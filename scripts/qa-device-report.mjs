// Build a local, shareable review gallery from the measured device evidence.
// Usage: node scripts/qa-device-report.mjs <native-summary.json> [...]
import {readFile,mkdir,writeFile,link,copyFile,unlink} from "node:fs/promises";
import path from "node:path";
const root=path.resolve("../qa-device-review");
const nativeRoot=path.resolve("../qa-native-device-evidence");
const webRoot=path.resolve("../qa-web-device-evidence");
const entriesByKey=new Map(), coverageGaps=[];
const webRuns=[webRoot,...(process.env.EVERWISE_WEB_REGRESSIONS||'../qa-web-device-regression,../qa-web-device-final-fixes').split(',').filter(Boolean).map(p=>path.resolve(p))];
for(const folder of webRuns) {
  const web=JSON.parse(await readFile(path.join(folder,'summary.json'),'utf8'));
  if(!web.finished || web.cases.length!==web.viewports.length*web.scenes.length*2)throw Error(`Incomplete web run: ${folder}`);
  for(const c of web.cases)entriesByKey.set(`web:${c.width}:${c.height}:${c.size}:${c.scene}`,{...c,platform:'Web',deviceLabel:`Web · ${c.width} × ${c.height}`,source:path.join(folder,c.screenshot||''),evidenceRun:path.basename(folder)});
}
for(const file of process.argv.slice(2)) {
  const run=JSON.parse(await readFile(file,'utf8'));
  for(const d of run.devices) {
    if(d.error||d.cases.length!==run.scenes.length*2)coverageGaps.push({run:path.basename(file),device:d.name,error:d.error||'Sweep incomplete',captured:d.cases.length,expected:run.scenes.length*2});
    for(const c of d.cases){
      const scene=c.screenshot.split('/').pop().replace(/^size-\d+-/,'').replace(/\.png$/,'');
      entriesByKey.set(`native:${d.name}:${c.textSize}:${scene}`,{...c,platform:'iOS simulator',deviceLabel:d.name,scene,size:c.textSize,evidenceRun:path.basename(file),
        failed:Boolean(c.error||c.native!==true||c.outside?.length||c.unreachable?.length||c.errors?.length||c.brokenImages?.length||c.scrollWidth>c.width+1),source:path.join(nativeRoot,c.screenshot)});
    }
  }
}
for (const [folder,kind] of [
  [process.env.EVERWISE_MOBILE_EVIDENCE || '../qa-mobile-browser-final','mobile'],
  [process.env.EVERWISE_ONBOARDING_EVIDENCE || '../qa-onboarding-device-evidence','onboarding'],
]) {
  let run;
  try { run=JSON.parse(await readFile(path.join(folder,'summary.json'),'utf8')); }
  catch(error) { if(error.code==='ENOENT') continue; throw error; }
  for(const c of run.cases) {
    const deviceLabel=kind==='mobile'?`${c.engine} · ${c.profile}`:`Web · ${c.width} × ${c.height}`;
    const scene=kind==='mobile'?c.scene:`onboarding-step-${c.step}`;
    entriesByKey.set(`${kind}:${deviceLabel}:${c.size}:${scene}`,{...c,platform:'Web',deviceLabel,scene,
      evidenceRun:path.basename(folder),source:path.resolve(folder,c.screenshot)});
  }
}
const entries=[...entriesByKey.values()];
await mkdir(root,{recursive:true});
await writeFile(path.join(root,'coverage-gaps.json'),JSON.stringify(coverageGaps,null,2));
await mkdir(path.join(root,"images"),{recursive:true});
const cases=[];
for(const [i,entry] of entries.entries()) {
  const file=`images/${String(i).padStart(4,"0")}.png`;
  if(entry.screenshot) {
    await unlink(path.join(root,file)).catch(error=>{if(error.code!=="ENOENT")throw error});
    try {await link(entry.source,path.join(root,file));}
    catch(error){if(error.code==="EXDEV")await copyFile(entry.source,path.join(root,file));else throw error;}
  }
  const {source:_source,fonts:_fonts,...publicEntry}=entry;
  cases.push({...publicEntry,image:entry.screenshot?file:null});
}
await writeFile(path.join(root,"coverage.json"),JSON.stringify(cases,null,2));
const data=JSON.stringify(cases).replaceAll("<","\\u003c");
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EverWise device review</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#efe9dc;color:#22201c;font:16px/1.5 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:32px}h1{font-size:clamp(28px,4vw,48px);margin:0}p{max-width:850px}small{color:#655f55}.summary{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}.summary b{background:#fbf9f4;border:1px solid #d8d0c2;border-radius:12px;padding:14px 20px}.filters{display:flex;gap:16px;flex-wrap:wrap;padding:20px;background:#fbf9f4;border-radius:16px;position:sticky;top:8px;z-index:1;box-shadow:0 5px 20px #2221}label{display:flex;flex-direction:column;gap:4px;font-weight:600}select{min-height:44px;font:inherit;border:1px solid #bbb3a8;border-radius:8px;background:white;padding:8px;max-width:100%}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-top:24px}.card{background:#fbf9f4;border-radius:16px;border:1px solid #d8d0c2;overflow:hidden}.card button{border:0;padding:12px;width:100%;background:#e3ddcf;cursor:zoom-in;min-height:44px}.card img{display:block;max-width:100%;height:360px;object-fit:contain;margin:auto}.caption{padding:14px}.caption strong{display:block}.pass{color:#3c602f}.fail{color:#a02f24}dialog{border:0;border-radius:16px;padding:16px;max-width:96vw;max-height:96vh;background:#fbf9f4}dialog::backdrop{background:#000b}dialog img{max-width:100%;height:auto;display:block;margin:auto}dialog button{position:sticky;top:0;float:right;min-height:44px;padding:8px 16px;font:inherit;border:1px solid #ccc;border-radius:8px;background:white}button:focus-visible,select:focus-visible{outline:3px solid #b0512f;outline-offset:3px}@media(max-width:600px){main{padding:16px}.filters{position:static}.card img{height:440px}}
</style><main><small>LOCAL TEST EVIDENCE</small><h1>EverWise · Device review</h1>
<p>Compare the captured screens at normal and largest text size. These are measured layouts with sample accounts and offers. A passing layout check does not certify every interaction or a live purchase.</p>
<div class="summary"><b id="total"></b><b id="devices"></b><b id="findings"></b></div>
<div class="filters"><label>Device or window<select id="device"></select></label><label>Text size<select id="size"><option value="size-2">Normal</option><option value="size-10">Largest</option></select></label><label>Screen<select id="scene"><option value="">All screens</option></select></label><label>Results<select id="result"><option value="all">All results</option><option value="review">Needs review</option></select></label></div>
<p id="count" aria-live="polite"></p><div class="grid" id="grid"></div>
<p><small>Native captures use the installed iOS simulator runtime. EverWise is currently an iPhone app; iPad native captures show its compatibility display. The web layout is tested at full tablet widths. Physical-device payments and every possible content/account state are outside this visual matrix. Native PNG captures pass through the simulator tool’s image encoder; these are visual and geometry checks, not bit-for-bit pixel comparisons.</small></p>
</main><dialog id="preview"><button id="close">Close</button><h2 id="title"></h2><img id="full" alt=""></dialog>
<script>const cases=${data};
const $=id=>document.getElementById(id);const names=[...new Set(cases.map(c=>c.deviceLabel))];
$('total').textContent=cases.length+' layout cases';$('devices').textContent=names.length+' device/window profiles';$('findings').textContent=cases.filter(c=>c.failed).length+' automated findings';
for(const name of names){const o=new Option(name,name);$('device').add(o)}
for(const name of [...new Set(cases.map(c=>c.scene))].sort())$('scene').add(new Option(name.replaceAll('-',' '),name));
function draw(){const selected=cases.filter(c=>c.deviceLabel===$('device').value&&c.size===$('size').value&&(!$('scene').value||c.scene===$('scene').value)&&($('result').value!=='review'||c.failed));$('grid').replaceChildren();$('count').textContent=selected.length+' screens shown';for(const c of selected){const card=document.createElement('article');card.className='card';const b=document.createElement('button');b.setAttribute('aria-label','Open '+c.scene+' screenshot');if(c.image){const im=new Image();im.src=c.image;im.alt=c.scene;im.loading='lazy';b.append(im)}else b.textContent='No screenshot';b.onclick=()=>{$('title').textContent=c.deviceLabel+' · '+c.scene.replaceAll('-',' ');$('full').src=c.image||'';$('full').alt=c.scene;$('preview').showModal()};const caption=document.createElement('div');caption.className='caption';const title=document.createElement('strong');title.textContent=c.scene.replaceAll('-',' ');const status=document.createElement('span');status.className=c.failed?'fail':'pass';status.textContent=c.failed?'Needs review':'Layout checks passed';const detail=document.createElement('small');detail.textContent=' · '+c.width+' × '+c.height+' content viewport';caption.append(title,status,detail);card.append(b,caption);$('grid').append(card)}}
for(const id of ['device','size','scene','result'])$(id).onchange=draw;$('close').onclick=()=>$('preview').close();draw();
</script></html>`;
await writeFile(path.join(root,"index.html"),html);
console.log(`Gallery: ${root}/index.html — ${cases.length} cases`);
