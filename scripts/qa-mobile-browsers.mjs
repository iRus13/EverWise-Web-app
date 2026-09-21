// Local mobile-browser emulation: touch, installation guidance and layout.
// This supplements native simulators; it does not emulate an OS keyboard.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium,webkit,devices}=require(process.env.EVERWISE_PLAYWRIGHT_MODULE||'playwright');
const base=`http://127.0.0.1:${process.env.EVERWISE_QA_PORT||8870}`;
const output=path.resolve(process.env.EVERWISE_WEB_EVIDENCE||'../qa-mobile-browser-evidence');await mkdir(output,{recursive:true});
const profiles=[
  {name:'iphone-small',engine:'webkit',options:{...devices['iPhone SE']},ios:true},
  {name:'iphone-large',engine:'webkit',options:{...devices['iPhone 13 Pro Max']},ios:true},
  {name:'ipad-desktop-ua',engine:'webkit',options:{...devices['iPad Pro 11'],userAgent:devices['Desktop Safari'].userAgent},ios:true},
  {name:'ipad-landscape',engine:'webkit',options:{...devices['iPad Pro 11 landscape'],userAgent:devices['Desktop Safari'].userAgent},ios:true},
  {name:'android-small',engine:'chromium',options:{...devices['Pixel 5'],viewport:{width:360,height:640}}},
  {name:'android-landscape',engine:'chromium',options:{...devices['Pixel 5 landscape'],viewport:{width:851,height:393}}},
];
const cases=[];const actions=[];
for(const profile of profiles.filter(p=>!process.env.EVERWISE_QA_PROFILE_FILTER||new RegExp(process.env.EVERWISE_QA_PROFILE_FILTER).test(p.name))){
  const browser=await (profile.engine==='webkit'?webkit:chromium).launch(profile.engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
  const {defaultBrowserType:_defaultBrowserType,...options}=profile.options;
  const context=await browser.newContext(options);
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  if(profile.ios)await context.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:false,configurable:true}));
  const page=await context.newPage();page.setDefaultTimeout(60000);
  try{
    for(const size of ['size-2','size-10'])for(const scene of ['home','home-pending','login','interview']){
      await page.goto(`${base}/tests/fixtures/app-layout.html?view=${scene}&textSize=${size}`,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.__everwiseVisualQA);
      const result=await page.evaluate(()=>window.__everwiseVisualQA.measure());
      const failed=Boolean(result.error||result.outside.length||result.unreachable.length||result.errors.length||result.brokenImages.length||result.scrollWidth>result.width+1);
      if(scene.startsWith('home'))assert.equal(await page.getByText('Add Everwise to your Home Screen',{exact:true}).isVisible(),true);
      const screenshot=`${profile.name}-${size}-${scene}.png`;await page.screenshot({path:path.join(output,screenshot)});
      cases.push({...result,profile:profile.name,engine:profile.engine,size,scene,screenshot,failed});
    }
    await page.goto(`${base}/tests/fixtures/app-layout.html?view=home`);
    await page.waitForSelector('body[data-geometry-ready="true"]',{state:'attached'});
    const dismiss=page.getByRole('button',{name:'Dismiss',exact:true});await dismiss.click();
    assert.equal(await page.getByText('Add Everwise to your Home Screen',{exact:true}).count(),0);
    await page.reload();await page.getByRole('heading').first().waitFor();
    assert.equal(await page.getByText('Add Everwise to your Home Screen',{exact:true}).count(),0);
    actions.push({profile:profile.name,dismissAndReload:true});
    console.log(`PASS ${profile.name}: 8 layouts + dismissal persistence`);
  }catch(error){await page.screenshot({path:path.join(output,profile.name+'-failure.png')}).catch(()=>{});await writeFile(path.join(output,profile.name+'-failure.txt'),String(error)+'\n'+await page.locator('body').innerText());throw error;}finally{await browser.close();await writeFile(path.join(output,'summary.json'),JSON.stringify({cases,actions},null,2));}
}
console.log(`FINISHED ${cases.length} layouts, ${cases.filter(c=>c.failed).length} findings`);
assert.equal(cases.filter(c=>c.failed).length,0);
