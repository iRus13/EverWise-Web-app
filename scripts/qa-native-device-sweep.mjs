// Run with qa-native-visual-server.mjs and the isolated com.everwise.visualqa
// simulator bundle. Deletes only simulator instances created by this process.
import {spawnSync} from "node:child_process";
import {mkdir,writeFile,readFile,cp,mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {scenes} from "./qa-device-scenes.mjs";

const output=path.resolve(process.env.EVERWISE_NATIVE_EVIDENCE||"../qa-native-device-evidence");
const runId=Date.now().toString(36);
const base=`http://127.0.0.1:${process.env.EVERWISE_QA_PORT||8867}`;
const selectedScenes=process.env.EVERWISE_QA_SCENE_FILTER?scenes.filter(s=>new RegExp(process.env.EVERWISE_QA_SCENE_FILTER).test(s.name)):scenes;
const fetchQA=(url,options={})=>fetch(url,{...options,signal:AbortSignal.timeout(10000)});
const shipping=process.env.EVERWISE_SIM_APP||"/tmp/everwise-simulator-qa/Build/Products/Debug-iphonesimulator/App.app";
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const prior=process.env.EVERWISE_QA_RESUME?JSON.parse(await readFile(process.env.EVERWISE_QA_RESUME,"utf8")):null;
async function capture(udid,file) {
  const response=await fetch(`http://127.0.0.1:8421/simulators/${udid}/screenshot.png?quality=1&scale=1&t=${Date.now()}`,{signal:AbortSignal.timeout(20000)});
  if(!response.ok||!response.headers.get("content-type")?.includes("image/png"))throw Error(`Native capture failed: ${response.status}`);
  await writeFile(file,Buffer.from(await response.arrayBuffer()));
}
function command(name,args,timeout=120000) {
  const r=spawnSync(name,args,{encoding:"utf8",timeout,maxBuffer:4*1024*1024});
  if(r.status!==0)throw Error(`${name} ${args.join(" ")}: ${r.stderr||r.stdout||r.error}`);
  return r.stdout.trim();
}
const inventory=JSON.parse(command("xcrun",["simctl","list","devices","available","-j"]));
const runtime=Object.keys(inventory.devices).find(k=>k.endsWith("iOS-27-0"));
if(!runtime)throw Error("Expected installed iOS 27 runtime");
const devices=inventory.devices[runtime].filter(d=>!d.name.startsWith("EverWise QA ")).map(d=>({name:d.name,type:d.deviceTypeIdentifier}));
const extra=JSON.parse(command("xcrun",["simctl","list","devicetypes","-j"])).devicetypes.find(d=>d.name==="iPhone 17 Pro");
if(extra&&!devices.some(d=>d.type===extra.identifier))devices.push({name:extra.name,type:extra.identifier});
const selected=process.env.EVERWISE_QA_DEVICE_FILTER?devices.filter(d=>new RegExp(process.env.EVERWISE_QA_DEVICE_FILTER).test(d.name)):devices;
if (!selected.length || !selectedScenes.length) throw Error("Device and scene filters must match at least one case");
if(process.env.EVERWISE_QA_EXISTING_UDID && selected.length!==1) throw Error("An existing QA device requires exactly one model filter");
const summary={runId,resumedFrom:prior?.runId,started:new Date().toISOString(),runtime,devices:[],scenes:selectedScenes.map(s=>s.name),scope:"Real native WKWebView, production components, synthetic fixture data; iPhone-only compatibility mode on iPad. No live accounts or purchases."};
await mkdir(output,{recursive:true});
const summaryPath=path.join(output,`sweep-${runId}.json`);
for(const device of selected) {
  const slug=device.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-$/,""),folder=path.join(output,slug);
  await mkdir(folder,{recursive:true});
  let udid,deviceBundleDir;
  const record={...device,slug,cases:[...(prior?.devices.find(d=>d.slug===slug)?.cases||[])]};summary.devices.push(record);
  try {
    udid=process.env.EVERWISE_QA_EXISTING_UDID || command("xcrun",["simctl","create",`EverWise QA ${device.name} ${runId}`,device.type,runtime]);record.udid=udid;
    console.log(`BOOT ${device.name} ${udid}`);
    // Xcode 27 Device Hub can shadow headless input/presentation. Heal only
    // after the simulator has finished booting, before launching the app.
    if(inventory.devices[runtime].find(d=>d.udid===udid)?.state!=="Booted")
      command("baguette",["boot","--udid",udid,"--no-heal"],300000);
    command("xcrun",["simctl","bootstatus",udid,"-b"],300000);
    if(process.env.EVERWISE_QA_HEAL === "1")command("baguette",["heal","--udid",udid],120000);
    if(!process.env.EVERWISE_QA_SKIP_SHIPPING) {
    command("xcrun",["simctl","install",udid,shipping]);
    command("xcrun",["simctl","launch",udid,"com.everwise.app"]);
    // A fresh simulator can need several seconds to present the first web frame.
    await sleep(12000);
    await capture(udid,path.join(folder,"shipping-welcome.png"));
    }
    deviceBundleDir=await mkdtemp(path.join(tmpdir(),"everwise-visual-bundle-"));
    const deviceBundle=path.join(deviceBundleDir,"App.app");
    await cp(shipping,deviceBundle,{recursive:true});
    // Only the disposable QA copy allows HTTP web content. The shipping app
    // is untouched; the lab binds loopback and blocks external connections.
    command("python3",["-c", "import plistlib,sys; p=sys.argv[1]; d=plistlib.load(open(p,'rb')); d['CFBundleIdentifier']='com.everwise.visualqa'; d['CFBundleDisplayName']='EverWise Visual QA'; d['NSAppTransportSecurity']={'NSAllowsArbitraryLoadsInWebContent':True}; plistlib.dump(d,open(p,'wb'))",path.join(deviceBundle,"Info.plist")]);
    const configPath=path.join(deviceBundle,"capacitor.config.json");
    const config=JSON.parse(await readFile(configPath,"utf8"));
    config.appId="com.everwise.visualqa";
    config.server={url:`${base}/?qaDevice=${slug}`,cleartext:true,allowNavigation:["127.0.0.1"]};
    await writeFile(configPath,JSON.stringify(config));
    command("codesign",["--force","--sign","-",deviceBundle]);
    command("xcrun",["simctl","install",udid,deviceBundle]);
    command("xcrun",["simctl","launch","--terminate-running-process",udid,"com.everwise.visualqa"]);
    for(const size of ["size-2","size-10"]) for(const scene of selectedScenes) {
      if(record.cases.some(c=>c.screenshot===`${slug}/${size}-${scene.name}.png`))continue;
      const caseId=`${runId}-${slug}-${size}-${scene.name}`;
      await fetchQA(`${base}/__qa/command?device=${slug}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({caseId,path:`${scene.url}&textSize=${size}`})});
      let result;
      for(let attempt=0;attempt<240;attempt++) {
        result=await(await fetchQA(`${base}/__qa/result?key=${slug}:${caseId}`)).json();
        if(result)break;
        // The iOS 27 simulator can present an empty loopback WKWebView
        // during launch/navigation. Retain that observation and retry once;
        // it is not evidence of a successful cold launch of the shipping app.
        if(attempt===60) {
          (record.measurementRelaunches ||= []).push(caseId);
          await capture(udid,path.join(folder,`before-relaunch-${caseId}.png`)).catch(()=>{});
          command("xcrun",["simctl","launch","--terminate-running-process",udid,"com.everwise.visualqa"]);
          await fetchQA(`${base}/__qa/command?device=${slug}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({caseId,path:`${scene.url}&textSize=${size}`})});
          console.log(`RETRY ${device.name}: ${size} ${scene.name} required a QA relaunch`);
        }
        await sleep(500);
      }
      if(!result)throw Error(`No measurement for ${caseId}`);
      await sleep(350);
      const filename=`${size}-${scene.name}.png`;
      await capture(udid,path.join(folder,filename));
      const entry={...result,screenshot:`${slug}/${filename}`};record.cases.push(entry);
      const bad=Boolean(result.error||result.native!==true||result.outside?.length||result.unreachable?.length||result.brokenImages?.length||result.errors?.length||result.scrollWidth>result.width+1);
      console.log(`${bad?"REVIEW":"PASS"} ${device.name} ${size} ${scene.name}: ${result.width}x${result.height} controls=${result.controls} outside=${result.outside?.length} unreachable=${result.unreachable?.length} small=${result.small?.length}`);
      await writeFile(summaryPath,JSON.stringify(summary,null,2));
    }
    // Capture the bundled app after the entire device has warmed up, too.
    if(!process.env.EVERWISE_QA_SKIP_SHIPPING) {
    command("xcrun",["simctl","launch","--terminate-running-process",udid,"com.everwise.app"]);
    await sleep(6000);
    await capture(udid,path.join(folder,"shipping-after-sweep.png"));
    }
  } catch(error) {record.error=String(error);console.log(`DEVICE ERROR ${device.name}: ${error}`);}
  finally {
    if(udid&&!process.env.EVERWISE_QA_EXISTING_UDID){command("xcrun",["simctl","shutdown",udid]);command("xcrun",["simctl","delete",udid]);record.cleaned=true;}
    if(deviceBundleDir)await rm(deviceBundleDir,{recursive:true,force:true});
    await writeFile(summaryPath,JSON.stringify(summary,null,2));
  }
}
summary.finished=new Date().toISOString();
await writeFile(summaryPath,JSON.stringify(summary,null,2));
console.log(`FINISHED ${summaryPath}`);

process.exitCode=summary.devices.some(d=>d.error||d.cases.length!==selectedScenes.length*2||d.cases.some(c=>c.error||c.native!==true||c.outside?.length||c.unreachable?.length||c.brokenImages?.length||c.errors?.length||c.scrollWidth>c.width+1))?1:0;
