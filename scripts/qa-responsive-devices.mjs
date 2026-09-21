// Requires the loopback-only qa-native-visual-server. Exercise production
// components with local fixtures; never send a request to a live provider.
import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {scenes} from "./qa-device-scenes.mjs";
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.EVERWISE_PLAYWRIGHT_MODULE||"playwright");
const base=`http://127.0.0.1:${process.env.EVERWISE_QA_PORT||8867}`;
const selectedScenes=process.env.EVERWISE_QA_SCENE_FILTER?scenes.filter(s=>new RegExp(process.env.EVERWISE_QA_SCENE_FILTER).test(s.name)):scenes;
if (!selectedScenes.length) throw Error("Scene filter must match at least one case");
const output=path.resolve(process.env.EVERWISE_WEB_EVIDENCE||"../qa-web-device-evidence");
const viewports=process.env.EVERWISE_QA_VIEWPORTS?JSON.parse(process.env.EVERWISE_QA_VIEWPORTS):[[320,568],[360,640],[375,667],[390,844],[393,852],[402,874],[414,896],[420,912],[430,932],[440,956],
  [568,320],[667,375],[874,402],[956,440],[639,760],[640,760],[744,1133],[767,1024],[768,1024],[810,1080],[820,1180],[834,1194],
  [899,760],[900,760],[1023,768],[1024,768],[1180,820],[1280,800],[1366,1024],[1440,900],[1920,1080]];
await mkdir(output,{recursive:true});
const summary={started:new Date().toISOString(),viewports,scenes:selectedScenes.map(s=>s.name),cases:[]};
const browser=await chromium.launch({executablePath:process.env.EVERWISE_CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true});
const queue=[...viewports];
async function worker(id) {
  const context=await browser.newContext();
  await context.route("**/*",route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  const page=await context.newPage();
  page.setDefaultTimeout(30000);
  let viewport;
  while((viewport=queue.shift())) {
    const [width,height]=viewport;
    await page.setViewportSize({width,height});
    const folder=path.join(output,`${width}x${height}`);await mkdir(folder,{recursive:true});
    for(const size of ["size-2","size-10"]) for(const scene of selectedScenes) {
      let entry={width,height,size,scene:scene.name};
      try {
        await page.goto(`${base}${scene.url}&textSize=${size}&qaDevice=browser-${id}`,{waitUntil:"domcontentloaded"});
        await page.waitForFunction(()=>window.__everwiseVisualQA);
        const result=await page.evaluate(()=>window.__everwiseVisualQA.measure());
        entry={...entry,...result};
        entry.failed=Boolean(result.error||result.outside.length||result.unreachable.length||result.errors.length||result.brokenImages.length||result.scrollWidth>width+1);
        const filename=`${size}-${scene.name}.png`;
        await page.screenshot({path:path.join(folder,filename)});
        entry.screenshot=`${width}x${height}/${filename}`;
      }catch(error){entry.failed=true;entry.error=String(error);}
      summary.cases.push(entry);
      if(entry.failed) console.log(`REVIEW ${width}x${height} ${size} ${scene.name}: ${JSON.stringify({outside:entry.outside,unreachable:entry.unreachable,errors:entry.errors,error:entry.error})}`);
    }
    console.log(`DONE ${width}x${height}: ${summary.cases.filter(c=>c.width===width&&c.height===height).length} cases`);
    await writeFile(path.join(output,`worker-${id}.json`),JSON.stringify(summary.cases.filter(c=>c.device===`browser-${id}`),null,2));
  }
  await context.close();
}
try {await Promise.all(Array.from({length:Number(process.env.EVERWISE_QA_WORKERS||4)},(_,i)=>i).map(worker));}
finally {await browser.close();summary.finished=new Date().toISOString();await writeFile(path.join(output,"summary.json"),JSON.stringify(summary,null,2));}
console.log(`FINISHED ${summary.cases.length} cases, ${summary.cases.filter(c=>c.failed).length} need review`);
