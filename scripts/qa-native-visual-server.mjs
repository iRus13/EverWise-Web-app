// Local-only visual lab. Real screen components, synthetic identities/offers.
// Never load production environment files or expose this server off loopback.
import {build,preview} from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {mkdir, writeFile} from "node:fs/promises";

const root=fileURLToPath(new URL("../",import.meta.url));
const port=Number(process.env.EVERWISE_QA_PORT||8867);
const output=path.resolve(process.env.EVERWISE_NATIVE_EVIDENCE || path.join(root,"../qa-native-device-evidence"));
await mkdir(output,{recursive:true});
const commands=new Map(), results=new Map();
let sequence=Date.now();
function controller() {
  const params=new URLSearchParams(location.search);
  const device=params.get("qaDevice") || sessionStorage.getItem("qaDevice") || "primary";
  sessionStorage.setItem("qaDevice",device);
  const caseId=params.get("qaCase");
  const errors=[];
  addEventListener("error",event=>errors.push(event.message));
  addEventListener("unhandledrejection",event=>errors.push(String(event.reason)));
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  async function settled() {
    await document.fonts.ready;
    await frames();
    await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));
  }
  function resetScroll() {
    for(const el of document.querySelectorAll("*")) if(el.scrollTop) el.scrollTop=0;
    window.scrollTo(0,0);
  }
  async function measure() {
    if(document.readyState==="loading") await new Promise(resolve=>document.addEventListener("DOMContentLoaded",resolve,{once:true}));
    // Existing fixture measurements sometimes deliberately scroll to footers.
    for(let n=0;n<100;n++) {
      if(document.body.dataset.geometryReady || document.body.dataset.learningReady || document.body.dataset.assessmentReady || document.body.dataset.extraReady ||
        (!location.pathname.includes("app-layout") && document.querySelector("h1"))) break;
      await pause(100);
    }
    await pause(600);
    await settled();
    resetScroll(); await frames();
    const controls=[...document.querySelectorAll("button,input,textarea,select,a,[role=radio],[role=checkbox]")].filter(el=>el.getClientRects().length && getComputedStyle(el).visibility!=="hidden");
    const outside=[], small=[], unreachable=[];
    const label=el=>(el.getAttribute("aria-label")||el.textContent||el.getAttribute("placeholder")||el.tagName).trim().slice(0,120);
    for(const el of controls) {
      const r=el.getBoundingClientRect();
      if(r.left < -1 || r.right > innerWidth+1) outside.push({label:label(el),left:r.left,right:r.right});
      if(r.width<43 || r.height<43) small.push({label:label(el),width:r.width,height:r.height});
      // A large-text card may exceed the viewport. Its top and bottom must
      // each be reachable; requiring both in one frame would reject scrolling.
      for(const edge of ["top","bottom"]) {
        for(let parent=el.parentElement;parent;parent=parent.parentElement) {
          if(!/^(auto|scroll)$/.test(getComputedStyle(parent).overflowY)) continue;
          const a=el.getBoundingClientRect(),b=parent.getBoundingClientRect();
          parent.scrollTop+=edge==="top"?a.top-Math.max(0,b.top):a.bottom-Math.min(innerHeight,b.bottom);
        }
        if(document.documentElement.scrollHeight>innerHeight && getComputedStyle(document.body).overflowY!=="hidden") {
          const a=el.getBoundingClientRect();window.scrollBy(0,edge==="top"?a.top:a.bottom-innerHeight);
        }
        await frames();
        let top=0,bottom=innerHeight;
        for(let parent=el.parentElement;parent;parent=parent.parentElement) {
          if(!/^(auto|scroll|hidden|clip)$/.test(getComputedStyle(parent).overflowY)) continue;
          const b=parent.getBoundingClientRect();top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom);
        }
        const a=el.getBoundingClientRect();
        if(a.height>0 && (edge==="top"?a.top<top-2||a.top>bottom:a.bottom>bottom+2||a.bottom<top)) unreachable.push({label:label(el),edge,top:a.top,bottom:a.bottom,clipTop:top,clipBottom:bottom});
      }
    }
    resetScroll();await frames();
    const probe=document.createElement("div");probe.style.cssText="position:fixed;pointer-events:none;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)";document.body.append(probe);
    const safeArea={top:parseFloat(getComputedStyle(probe).paddingTop),bottom:parseFloat(getComputedStyle(probe).paddingBottom)};probe.remove();
    return {device,caseId,path:location.pathname+location.search,width:innerWidth,height:innerHeight,dpr:devicePixelRatio,native:window.Capacitor?.isNativePlatform?.()||false,safeArea,
      textSize:document.documentElement.dataset.textSize,heading:document.querySelector("h1")?.textContent,
      font:getComputedStyle(document.body).fontFamily,fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),
      scrollWidth:document.documentElement.scrollWidth,controls:controls.length,outside,small,unreachable,errors,
      brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)};
  }
  window.__everwiseVisualQA={measure};
  async function report(extra={}) {
    const result={...await measure(),...extra};
    await fetch("/__qa/result",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(result)});
  }
  if(caseId) report().catch(error=>fetch("/__qa/result",{method:"POST",body:JSON.stringify({device,caseId,error:String(error)})}));
  // Ordinary browser checks need measurement only. Polling during navigation
  // can emit WebKit cancellation errors unrelated to the application.
  if (!params.has("qaDevice") && !sessionStorage.getItem("qaNativeDriver")) return;
  sessionStorage.setItem("qaNativeDriver", "true");
  let busy=false;
  setInterval(async()=>{
    if(busy)return;busy=true;
    try {
      const command=await (await fetch(`/__qa/command?device=${encodeURIComponent(device)}`)).json();
      if(command && String(command.id)!==sessionStorage.getItem("qaCommand")) {
        sessionStorage.setItem("qaCommand",String(command.id));
        const url=new URL(command.path,location.origin);url.searchParams.set("qaDevice",device);url.searchParams.set("qaCase",command.caseId);
        location.assign(url.href);
      }
    } catch {} finally {busy=false;}
  },350);
}
const client=`(${controller.toString()})();`;
const labPlugin={
    name:"isolated-native-visual-lab",enforce:"pre",
    resolveId(source,importer) {
      if(!importer||!source.startsWith("."))return;
      const target=path.resolve(path.dirname(importer.split("?")[0]),source);
      if([path.join(root,"src/firebase"),path.join(root,"src/firebase.js")].includes(target))return path.join(root,"tests/fixtures/firebase-emulator.js");
    },
    transformIndexHtml(html) {
      return html.replace(/<meta\s+name="viewport"[^>]*>/, '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>').replace("</head>",'<link rel="stylesheet" href="/fonts/source-sans-3.css"/><script src="/__qa/controller.js"></script></head>');
    },
    configureServer(vite) {
      vite.middlewares.use(async(req,res,next)=>{
        if(process.env.EVERWISE_QA_HTTP_TRACE)console.log(req.method,req.url);
        res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' http://127.0.0.1:9099 http://127.0.0.1:8089 ws://127.0.0.1:8867; media-src 'self' blob:; frame-src 'self'");
        const url=new URL(req.url,"http://127.0.0.1:8867");
        if(!url.pathname.startsWith("/__qa/")&&!url.pathname.startsWith("/api/"))return next();
        res.setHeader("Cache-Control","no-store");res.setHeader("Content-Type","application/json");
        let body="";for await(const chunk of req) {body+=chunk;if(body.length>1000000){res.statusCode=413;res.end();return;}}
        try {
          if(url.pathname==="/__qa/controller.js") {res.setHeader("Content-Type","application/javascript");res.end(client);return;}
          if(url.pathname==="/__qa/command") {
            const device=url.searchParams.get("device")||"primary";
            if(req.method==="POST") {
              const input=JSON.parse(body);if(!input.path.startsWith("/")||input.path.startsWith("//"))throw Error("Local path required");
              commands.set(device,{...input,id:++sequence});
            }
            res.end(JSON.stringify(commands.get(device)||null));return;
          }
          if(url.pathname==="/__qa/result") {
            if(req.method==="POST") {
              const input=JSON.parse(body);const key=`${input.device}:${input.caseId}`;results.set(key,input);
              const file=key.replace(/[^a-zA-Z0-9_-]/g,"_");await writeFile(path.join(output,file+".json"),JSON.stringify(input,null,2));res.end('{"ok":true}');
            } else res.end(JSON.stringify(results.get(url.searchParams.get("key"))||null));return;
          }
          // Synthetic responses only; provider credentials are never loaded.
          if(url.pathname==="/api/partner/admin/report") {
            res.end(JSON.stringify({partnerId:"qa-partner",name:"QA Community Partner",branding:{name:"QA Community Partner",logoPath:null,accent:"#B0512F"},status:"active",invitation:{status:"active"},seats:{limit:500,claimed:6,available:494},research:{consentedCount:5,consentedPercentage:83.3,suppressed:false,distributions:Object.fromEntries(["accessibilityNeeds","ageBand","aiExperience","bankSafetyCategory","concerns","confidence","internetUse","primaryDevice","scamFrequency"].map(key=>[key,{"QA group":5}]))},updatedAt:"2026-09-20T00:00:00.000Z"}));return;
          }
          const api={"/api/partner/access":{status:"none"},"/api/billing/access":{access:"none",status:"none",canStartTrial:true,canManage:false},"/api/billing/plans":{plans:[]}};
          if(api[url.pathname])res.end(JSON.stringify(api[url.pathname]));else {res.statusCode=503;res.end('{"error":"Unavailable in isolated visual QA"}');}
        }catch(error){res.statusCode=400;res.end(JSON.stringify({error:String(error)}));}
      });
    },
};
labPlugin.configurePreviewServer=labPlugin.configureServer;
const config={
  root,configFile:false,envDir:false,logLevel:"error",plugins:[labPlugin,react()],
  define:{__EVERWISE_EMULATOR__:JSON.stringify({projectId:"demo-everwise-qa",host:"127.0.0.1",authPort:9099,firestorePort:8089})},
  build:{outDir:`/tmp/everwise-compiled-visual-qa-${port}`,emptyOutDir:true,rolldownOptions:{input:["index.html","tests/fixtures/app-layout.html","tests/fixtures/paywall-layout.html","tests/fixtures/learning-layout.html","tests/fixtures/assessments.html","tests/fixtures/extra-screens.html"].map(file=>path.join(root,file))}},
  preview:{host:"127.0.0.1",port,strictPort:true},
};
await build(config);
await preview(config);
console.log(`Native visual lab http://127.0.0.1:${port} — evidence ${output}`);
