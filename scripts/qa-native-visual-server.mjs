// Local-only visual lab. Real screen components, synthetic identities/offers.
// Never load production environment files or expose this server off loopback.
import {build,preview} from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {mkdir, writeFile} from "node:fs/promises";
import {instrumentStartup, instrumentBillingToken} from "./qa-startup-trace.mjs";

const root=fileURLToPath(new URL("../",import.meta.url));
const port=Number(process.env.EVERWISE_QA_PORT||8867);
const output=path.resolve(process.env.EVERWISE_NATIVE_EVIDENCE || path.join(root,"../qa-native-device-evidence"));
await mkdir(output,{recursive:true});
const commands=new Map(), results=new Map();
let sequence=Date.now();
function controller() {
  const startup = [];
  const mark = name => { if (startup.length < 60) startup.push({name, ms:performance.now()}); };
  window.__qaStartupMark = mark;
  window.__qaStartupTrace = async (name, operation) => {
    mark(name + "-start");
    try { return await operation(); } finally { mark(name + "-end"); }
  };
  mark("controller-ready");
  let lastScreen;
  new MutationObserver(() => {
    const screen = document.querySelector('.app-viewport')?.className.match(/app-screen-([a-z-]+)/)?.[1];
    if (screen && screen !== lastScreen) { lastScreen = screen; mark("screen-" + screen); }
  }).observe(document.documentElement, {subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  window.__qaStartup = startup;
  const params=new URLSearchParams(location.search);
  let signOutAttempts = 0;
  window.__qaSignOut = action => {
    signOutAttempts += 1;
    mark("sign-out-attempt");
    if (params.get("qaSignOut") === "held") {
      mark("sign-out-held");
      return new Promise(() => {});
    }
    if (params.get("qaSignOut") === "fail-once" && signOutAttempts === 1) {
      mark("sign-out-fault");
      return new Promise((_, reject) => setTimeout(() => reject(new Error("Synthetic logout failure")), 3000));
    }
    return action();
  };
  window.__qaCatalogRead = read => {
    if (params.get("qaHoldCatalog") === "1") {
      mark("catalog-held");
      return new Promise(() => {});
    }
    if (params.get("qaCatalog") === "fixture") {
      mark("synthetic-catalog");
      return Promise.resolve({products:[
        {id:"com.everwise.app.monthly",displayPrice:"€12,99",periodUnit:"month",periodValue:1},
        {id:"com.everwise.app.annual",displayPrice:"€79,99",periodUnit:"year",periodValue:1,eligibleForTrial:true,trialValue:1,trialUnit:"week"},
      ]});
    }
    return read();
  };
  const holdAuth = params.get("qaHoldAuth") === "1";
  if (holdAuth) {
    const next = new URL(location.href);
    next.searchParams.delete("qaHoldAuth");
    history.replaceState(null, "", next);
  }
  window.__qaStartupAuth = () => {
    if (holdAuth) { mark("auth-held"); return new Promise(() => {}); }
    return Promise.resolve();
  };
  window.__qaFreshTokenRead = read => {
    if (params.get("qaHoldFreshToken") === "1") {
      mark("fresh-token-held");
      return new Promise(() => {});
    }
    return read();
  };
  window.__qaReauthenticate = verify => {
    if (params.get("qaHoldReauthentication") === "1") {
      mark("password-verification-held");
      return new Promise(() => {});
    }
    return verify();
  };
  window.__qaDeletionGuard = operation => {
    if (params.get("qaHoldFreshToken") === "1" || params.get("qaHoldReauthentication") === "1") {
      mark("unexpected-deletion-blocked");
      throw new Error("Destructive action blocked in isolated token fault case");
    }
    return operation();
  };
  let accessHeld = false;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input, location.href);
    if (params.get("qaHoldReauthentication") === "1" &&
        (url.pathname.startsWith("/api/partner/release-") || url.pathname === "/api/billing/cancel")) {
      mark("unexpected-deletion-blocked");
      return Promise.reject(new Error("Mutation blocked in isolated password fault case"));
    }
    if (params.get("qaPublic") === "1" && url.origin === location.origin && url.pathname === "/api/partner/access") {
      url.searchParams.set("qaPublic", "1");
      return originalFetch(url.href, init);
    }
    if (params.get("qaHoldAccess") === "1" && !accessHeld && url.origin === location.origin && url.pathname === "/api/partner/access") {
      accessHeld = true;
      mark("access-held");
      url.searchParams.set("qaHoldAccess", "1");
      return originalFetch(url.href, init);
    }
    return originalFetch(input, init);
  };
  let billingTokensHeld = 0;
  window.__qaBillingTokenRead = read => {
    if (params.get("qaHoldBillingTokens") === "1" && billingTokensHeld < 2) {
      billingTokensHeld += 1;
      mark("billing-token-held");
      return new Promise(() => {});
    }
    return read();
  };
  let tokenHeld = false;
  window.__qaStartupTokenRead = read => {
    if (params.get("qaHoldToken") === "1" && !tokenHeld) {
      tokenHeld = true;
      mark("token-held");
      return new Promise(() => {});
    }
    return read();
  };
  let profileHeld = false;
  window.__qaStartupProfileRead = read => {
    if (params.get("qaHoldProfile") === "1" && !profileHeld) {
      profileHeld = true;
      mark("profile-held");
      return new Promise(() => {});
    }
    return Promise.resolve().then(read).then(snap => {
      const legacy = params.get("qaLegacyProfile");
      if (params.get("qaMirrorSponsor") !== "1" && !legacy) return snap;
      const data = {...snap.data()};
      if (params.get("qaMirrorSponsor") === "1") {
        mark("synthetic-sponsored-profile");
        Object.assign(data, {accessSource:"partner", partnerId:"qa-learning"});
      }
      if (legacy === "missing") {
        mark("legacy-profile-missing");
        delete data.subscriptionStatus; delete data.trialStartedAt; delete data.plan;
      } else if (legacy === "expired") {
        mark("legacy-profile-expired");
        Object.assign(data, {subscriptionStatus:"trial",trialStartedAt:"2000-01-01T00:00:00.000Z",plan:"annual"});
      }
      if (legacy === "active") {
        mark("legacy-profile-active");
        Object.assign(data, {subscriptionStatus:"active",plan:"annual"});
      }
      return {exists: () => snap.exists(), data: () => data};
    });
  };
  const device=params.get("qaDevice") || sessionStorage.getItem("qaDevice") || "primary";
  sessionStorage.setItem("qaDevice",device);
  const caseId=params.get("qaCase");
  const nativeInput=[];
  for(const type of ['pointerdown','pointerup','click']) addEventListener(type,event=>{
    const button=event.target?.closest?.('button');
    nativeInput.push({type,trusted:event.isTrusted,pointerType:event.pointerType,x:event.clientX,y:event.clientY,label:button?.getAttribute('aria-label')||button?.textContent?.trim()||null});
    if(nativeInput.length>30)nativeInput.shift();
  },true);
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
  function presented(el) {
    if (!el.getClientRects().length || getComputedStyle(el).visibility === "hidden") return false;
    // WebKit can report layout rectangles for a closed disclosure's contents.
    // Only its summary is presented until the learner opens it.
    for (let parent=el.parentElement;parent;parent=parent.parentElement) {
      if (parent.tagName === "DETAILS" && !parent.open && !parent.querySelector(":scope > summary")?.contains(el)) return false;
    }
    return true;
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
    const controls=[...document.querySelectorAll("button,input,textarea,select,a,summary,[role=radio],[role=checkbox]")].filter(presented);
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
    return {device,caseId,timeOrigin:performance.timeOrigin,path:location.pathname+location.search,width:innerWidth,height:innerHeight,dpr:devicePixelRatio,native:window.Capacitor?.isNativePlatform?.()||false,safeArea,
      systemText:{category:document.documentElement.dataset.systemTextCategory,bodyScale:document.documentElement.style.getPropertyValue("--system-text-scale"),titleScale:document.documentElement.style.getPropertyValue("--system-title-scale"),expanded:document.documentElement.dataset.expandedText},
      partnerFixture:window.__partnerQA ? {state:window.__partnerQA.state,replacementLink:document.querySelector("#replacement-learner-link")?.value || null} : undefined,
      textSize:document.documentElement.dataset.textSize,heading:document.querySelector("h1")?.textContent,
      textOverflow:[...document.querySelectorAll("h1,h2,h3,p,button,label")].filter(el=>el.getClientRects().length&&el.clientWidth>0&&el.scrollWidth>el.clientWidth+2).map(el=>({text:el.textContent.slice(0,100),width:el.clientWidth,scroll:el.scrollWidth,class:el.className})),
      font:getComputedStyle(document.body).fontFamily,fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),
      scrollWidth:document.documentElement.scrollWidth,controls:controls.length,outside,small,unreachable,errors,
      brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)};
  }
  async function snapshot() {
    await settled();
    const controls=[...document.querySelectorAll('button,input,textarea,a,summary')].filter(presented).map(el=>{
      const r=el.getBoundingClientRect();let top=0,bottom=innerHeight,left=0,right=innerWidth;
      for(let parent=el.parentElement;parent;parent=parent.parentElement) {
        const css=getComputedStyle(parent),bounds=parent.getBoundingClientRect();
        if(/^(auto|scroll|hidden|clip)$/.test(css.overflowY)){top=Math.max(top,bounds.top);bottom=Math.min(bottom,bounds.bottom);}
        if(/^(auto|scroll|hidden|clip)$/.test(css.overflowX)){left=Math.max(left,bounds.left);right=Math.min(right,bounds.right);}
      }
      return {label:(el.getAttribute('aria-label')||el.textContent||el.getAttribute('placeholder')||el.id).trim(),role:el.getAttribute('role'),disabled:el.disabled||false,checked:el.getAttribute('aria-checked'),pressed:el.getAttribute('aria-pressed'),x:r.x,y:r.y,width:r.width,height:r.height,clip:{top,bottom,left,right},visible:getComputedStyle(el).visibility!=='hidden'&&r.bottom>top&&r.top<bottom&&r.right>left&&r.left<right};
    });
    const current=document.querySelector('[aria-current="step"]');
    const currentTitle=current?.querySelector('.course-step-title');
    const currentMeta=current?.querySelector('.course-step-meta');
    const courseCurrent=currentTitle && currentMeta ? {
      title:currentTitle.textContent,meta:currentMeta.textContent,
      titleRect:currentTitle.getBoundingClientRect().toJSON(),metaRect:currentMeta.getBoundingClientRect().toJSON(),
      titleFont:parseFloat(getComputedStyle(currentTitle).fontSize),metaFont:parseFloat(getComputedStyle(currentMeta).fontSize),
      firstLineBottom:currentTitle.getBoundingClientRect().top+parseFloat(getComputedStyle(currentTitle).lineHeight),
      toolbarBottom:document.querySelector('.course-path-toolbar')?.getBoundingClientRect().bottom,
    } : null;
    const progress=document.querySelector('[role=progressbar]');
    const layout={scrollY,heading:document.querySelector('h1')?.getBoundingClientRect().toJSON(),panes:[...document.querySelectorAll('.app-viewport,.app-shell,.app-canvas,.today-screen,.today-content,.settings-screen,.app-navigation')].map(el=>({class:el.className,rect:el.getBoundingClientRect().toJSON(),scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,paddingTop:getComputedStyle(el).paddingTop,overflowY:getComputedStyle(el).overflowY}))};
    return {device,layout,courseCurrent,startup:[...startup],timeOrigin:performance.timeOrigin,nativeInput:[...nativeInput],screenWidth:screen.width,screenHeight:screen.height,width:innerWidth,height:innerHeight,path:location.pathname,heading:document.querySelector('h1')?.textContent,body:document.body.innerText,textSize:document.documentElement.dataset.textSize,systemTextCategory:document.documentElement.dataset.systemTextCategory,compactCourseControls:document.querySelector('.course-path-toolbar')?.dataset.compactControls,courseActions:window.__courseQA?.actions || null,focusedCurrent:document.activeElement?.getAttribute('aria-current') === 'step',progress:progress?{value:progress.getAttribute('aria-valuenow'),max:progress.getAttribute('aria-valuemax')}:null,controls,errors};
  }
  window.__everwiseVisualQA={measure,snapshot};
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
        if(command.action==="snapshot") {
          const result={...await snapshot(),caseId:command.caseId};
          await fetch('/__qa/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)});return;
        }
        if(command.action==="measure") { await report({caseId:command.caseId});return; }
        const url=new URL(command.path,location.origin);
        // Diagnostic wrappers can include qaDevice in their configured server
        // URL. Capacitor matches that URL prefix, including query order.
        const params=new URLSearchParams([["qaDevice",device]]);
        for(const [key,value] of url.searchParams) if(key !== "qaDevice") params.append(key,value);
        params.set("qaCase",command.caseId);url.search=params.toString();
        location.assign(url.href);
      }
    } catch {} finally {busy=false;}
  },350);
}
const client=`(${controller.toString()})();`;
const labPlugin={
    name:"isolated-native-visual-lab",enforce:"pre",
    transform(source,id) {
      if (id === path.join(root,"src/services/purchases.js")) return source.replace("() => NativePurchases.getProducts()", "() => window.__qaCatalogRead(() => NativePurchases.getProducts())");
      if (process.env.EVERWISE_QA_TRACE_STARTUP === "1" && id === path.join(root,"src/App.jsx")) return instrumentStartup(source);
      if (process.env.EVERWISE_QA_TRACE_STARTUP === "1" && id === path.join(root,"src/services/billingAccess.js")) return instrumentBillingToken(source);
    },
    resolveId(source,importer) {
      if(!importer||!source.startsWith("."))return;
      const target=path.resolve(path.dirname(importer.split("?")[0]),source);
      if([path.join(root,"src/firebase"),path.join(root,"src/firebase.js")].includes(target))return path.join(root,"tests/fixtures/firebase-emulator.js");
    },
    transformIndexHtml(html) {
      return html.replace(/<meta\s+name="viewport"[^>]*>/, '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>').replace("</head>",'<script src="/__qa/controller.js"></script></head>');
    },
    configureServer(vite) {
      vite.middlewares.use(async(req,res,next)=>{
        if(process.env.EVERWISE_QA_HTTP_TRACE)console.log(req.method,req.url);
        res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' http://127.0.0.1:9099 http://127.0.0.1:8089 ws://127.0.0.1:8867; media-src 'self' blob:; frame-src 'self'");
        const url=new URL(req.url,"http://127.0.0.1:8867");
        // Keep isolated screens inside the diagnostic wrapper's configured
        // root URL. Navigating to a different HTML path can open Safari.
        const scene = url.searchParams.get("qaScene");
        if (url.pathname === "/" && ["app-layout", "paywall-layout", "learning-layout", "extra-screens", "assessments"].includes(scene)) {
          req.url = `/tests/fixtures/${scene}.html${url.search}`;
          return next();
        }
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
          // A real stalled HTTP response: the client AbortController must
          // terminate this request. Do not log authorization headers.
          if (url.pathname === "/api/partner/access" && url.searchParams.get("qaHoldAccess") === "1") {
            return;
          }
          // Synthetic responses only; provider credentials are never loaded.
          if(url.pathname==="/api/partner/admin/report") {
            res.end(JSON.stringify({partnerId:"qa-partner",name:"QA Community Partner",branding:{name:"QA Community Partner",logoPath:null,accent:"#B0512F"},status:"active",invitation:{status:"active"},seats:{limit:500,claimed:6,available:494},research:{consentedCount:5,consentedPercentage:83.3,suppressed:false,distributions:Object.fromEntries(["accessibilityNeeds","ageBand","aiExperience","bankSafetyCategory","concerns","confidence","internetUse","primaryDevice","scamFrequency"].map(key=>[key,{"QA group":5}]))},updatedAt:"2026-09-20T00:00:00.000Z"}));return;
          }
          // Opt-in local entitlement fixture for real App learning journeys. This
          // does not change production access checks or contact a partner service.
          const partnerAccess=process.env.EVERWISE_QA_SPONSORED_ACCESS === "1" && url.searchParams.get("qaPublic") !== "1"
            ? {status:"active",partnerId:"qa-learning",name:"QA Learning Lab",branding:{name:"QA Learning Lab",logoPath:null,accent:"#B0512F"}}
            : {status:"none"};
          const api={"/api/partner/access":partnerAccess,"/api/billing/access":{access:"none",status:"none",plan:null,trialEndsAt:null,currentPeriodEndsAt:null,cancelAtPeriodEnd:false,canStartTrial:true,canManage:false},"/api/billing/plans":{plans:[{key:"annual",currency:"usd",unitAmount:6000,interval:"year",trialDays:7},{key:"monthly",currency:"usd",unitAmount:799,interval:"month",trialDays:3}]}};
          if(api[url.pathname])res.end(JSON.stringify(api[url.pathname]));else {res.statusCode=503;res.end('{"error":"Unavailable in isolated visual QA"}');}
        }catch(error){res.statusCode=400;res.end(JSON.stringify({error:String(error)}));}
      });
    },
};
labPlugin.configurePreviewServer=labPlugin.configureServer;
const config={
  root,configFile:false,envDir:false,logLevel:"error",plugins:[labPlugin,react()],
  define:{__EVERWISE_EMULATOR__:JSON.stringify({projectId:"demo-everwise-qa",host:"127.0.0.1",authPort:9099,firestorePort:8089})},
  build:{outDir:`/tmp/everwise-compiled-visual-qa-${port}`,emptyOutDir:true,rolldownOptions:{input:["index.html","tests/fixtures/app-layout.html","tests/fixtures/paywall-layout.html","tests/fixtures/learning-layout.html","tests/fixtures/assessments.html","tests/fixtures/extra-screens.html","tests/fixtures/partner-dashboard.html"].map(file=>path.join(root,file))}},
  preview:{host:"127.0.0.1",port,strictPort:true},
};
await build(config);
await preview(config);
console.log(`Native visual lab http://127.0.0.1:${port} — evidence ${output}`);
