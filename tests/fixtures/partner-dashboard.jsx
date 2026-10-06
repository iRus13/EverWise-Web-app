// Local synthetic reports only. No admin credential or provider mutation.
import React from 'react';
import {createRoot} from 'react-dom/client';
import PartnerDashboard from '../../src/screens/PartnerDashboard';
import '../../src/index.css';
const query=new URLSearchParams(location.search),state=query.get('state')||'ready';
document.documentElement.dataset.textSize=query.get('textSize')||'size-2';
const qa=window.__partnerQA={state,calls:[],reportMode:state,rotationMode:state==='rotating'?'pending':state==='rotation-error'?'error':'success',copied:null};
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const report={partnerId:'qa-partner',name:'Community Learning and Digital Confidence Partnership',branding:{name:'Community Learning and Digital Confidence Partnership',logoPath:null,accent:'#B0512F'},status:'active',invitation:{status:'active'},seats:{limit:500,claimed:18,available:482},research:{consentedCount:15,consentedPercentage:83.3,suppressed:false,distributions:Object.fromEntries(['accessibilityNeeds','ageBand','aiExperience','bankSafetyCategory','concerns','confidence','internetUse','primaryDevice','scamFrequency'].map(k=>[k,{'A longer group description to check readable table wrapping':10,'Another group':5}]))},updatedAt:'2026-09-20T00:00:00.000Z'};
const waitForResolution=(signal,key)=>new Promise((resolve,reject)=>{
 qa[key]=resolve;
 signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});
});
const originalFetch=window.fetch.bind(window);
window.fetch=async(input,options={})=>{
 const url=new URL(typeof input==='string'?input:input.url,location.origin);
 if(url.pathname==='/api/partner/admin/report'){
  qa.calls.push('report');
  if(qa.reportMode==='loading')await waitForResolution(options.signal,'finishReport');
  if(qa.reportMode==='report-error')return response({code:'PARTNER_UNAVAILABLE'},503);
  if(qa.reportMode==='invalid')return response({code:'INVALID_ADMIN'},403);
  const value=structuredClone(report);
  if(qa.reportMode==='suppressed')value.research={consentedCount:4,consentedPercentage:22.2,suppressed:true,distributions:null};
  return response(value);
 }
 if(url.pathname==='/api/partner/admin/rotate-invite'){
  qa.calls.push('rotate');
  if(qa.rotationMode==='pending')await waitForResolution(options.signal,'finishRotation');
  if(qa.rotationMode==='error')return response({code:'PARTNER_UNAVAILABLE'},503);
  return response({partnerId:'qa-partner',inviteToken:'r'.repeat(43)});
 }
 return originalFetch(input,options);
};
Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{
 if(qa.state==='copy-failed')throw Error('QA denied clipboard');qa.copied=value;
}}});
if(state==='download-error')URL.createObjectURL=()=>{throw Error('QA denied download');};
createRoot(document.getElementById('root')).render(<PartnerDashboard adminToken={'Q'.repeat(43)}/>);
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
async function wait(test){for(let i=0;i<200;i++){if(test())return;await pause(25);}throw Error('Fixture state did not settle');}
async function setup(){
 if(['loading','report-error','invalid'].includes(state)){await wait(()=>document.querySelector('.status-screen h1'));}
 else{
  await wait(()=>button('Replace learner link'));
  if(['confirm','rotating','revealed','rotation-error','copy-failed'].includes(state)){
   button('Replace learner link').click();await wait(()=>button('Replace link now'));
   if(state!=='confirm'){button('Replace link now').click();await wait(()=>button('Replacing…')||document.querySelector('#replacement-learner-link')||button('Review replacement'));}
   if(['revealed','copy-failed'].includes(state)){
    await wait(()=>button('Copy replacement link'));
    if(state==='copy-failed'){button('Copy replacement link').click();await wait(()=>document.querySelector('[role=status]'));}
   }
  }
  if(state==='download-error'){button('Download aggregate CSV').click();await wait(()=>document.querySelector('[role=alert]'));}
 }
 document.body.dataset.extraReady='true';
}
setup().catch(error=>{document.body.dataset.qaError=String(error);throw error;});
