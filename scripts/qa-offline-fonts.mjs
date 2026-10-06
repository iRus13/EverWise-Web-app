// Run against qa-native-visual-server. Reproduce a stalled remote stylesheet,
// then verify the real app starts and loads its font with all external traffic blocked.
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.EVERWISE_PLAYWRIGHT_MODULE||"playwright");
const base=`http://127.0.0.1:${process.env.EVERWISE_QA_PORT||8867}`;
const output="../qa-web-device-evidence/startup";
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"});
try {
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  let release;
  const pending=new Promise(resolve=>{release=resolve;});
  let remoteRequested=false;
  await context.route("**/*",async route=>{
    const url=new URL(route.request().url());
    if(url.hostname==="fonts.googleapis.com") {remoteRequested=true;await pending;return route.abort();}
    if(url.origin!==base)return route.abort();
    if(url.pathname==="/" && url.searchParams.has("oldFonts")) {
      const response=await route.fetch();
      const html=(await response.text()).replaceAll('<link rel="stylesheet" href="/fonts/source-sans-3.css"/>',"").replace(/<link rel="stylesheet" href="\/fonts\/source-sans-3.css"\s*\/>/,"").replace("</head>",'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap"/></head>');
      return route.fulfill({response,body:html});
    }
    return route.continue();
  });
  await page.goto(`${base}/?oldFonts=1`,{waitUntil:"commit"});
  await page.waitForTimeout(2000);
  assert.ok(remoteRequested,"Regression reproduction must hold the remote stylesheet");
  assert.equal(await page.locator("#root").innerHTML(),"","Stalled remote stylesheet blocks application rendering");
  // A render-blocking stylesheet can also prevent the screenshot compositor
  // from completing. The empty app root is the regression observation.
  release();await context.close();

  const fixed=await browser.newContext({viewport:{width:390,height:844}});
  const external=[];
  await fixed.route("**/*",route=>{
    const url=new URL(route.request().url());
    if(url.origin!==base){external.push(url.origin);return route.abort();}
    return route.continue();
  });
  const app=await fixed.newPage();
  await app.goto(base,{waitUntil:"domcontentloaded"});
  await app.getByRole("button",{name:"Get Started",exact:true}).waitFor();
  const font=await app.evaluate(async()=>{
    await document.fonts.load('400 18px "Source Sans 3"');
    await document.fonts.load('700 18px "Source Sans 3"');
    await document.fonts.ready;
    return {faces:[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status})),assets:performance.getEntriesByType("resource").filter(r=>/\.woff2/.test(r.name)).map(r=>r.name),body:getComputedStyle(document.body).fontFamily};
  });
  assert.ok(font.faces.some(f=>f.family==="Source Sans 3"&&f.status==="loaded"));
  assert.ok(font.assets.length>0&&font.assets.every(url=>url.startsWith(`${base}/fonts/`)));
  assert.ok(!external.some(url=>/fonts\.googleapis|fonts\.gstatic/.test(url)));
  await app.screenshot({path:`${output}/after-local-font.png`});
  await app.getByRole("button",{name:"Get Started",exact:true}).click();
  await app.getByLabel("What should we call you?").waitFor();
  await writeFile(`${output}/result.json`,JSON.stringify({remoteStylesheetBlocksStartup:true,localFontStartsWithExternalRequestsBlocked:true,font,blockedOrigins:[...new Set(external)]},null,2));
  console.log("PASS: stalled remote font reproduces blank startup; bundled font renders welcome and opens onboarding with all external requests blocked");
  await fixed.close();
}finally{await browser.close();}
