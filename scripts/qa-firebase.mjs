// Launches only local demo emulators. Never logs in, deploys or uses cloud data.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
import { spawn } from "node:child_process";
import { FIRESTORE_DATABASE_ID } from "../src/config/firebaseDatabase.js";
import { firebaseQaExitCode, QA_PROJECT, QA_HOST, QA_PORTS } from "./firebase-qa-config.mjs";
const root=fileURLToPath(new URL("../",import.meta.url));
const require=createRequire(import.meta.url);
const cli=process.env.EVERWISE_FIREBASE_CLI || require.resolve("firebase-tools/lib/bin/firebase.js");
const cliRequire=createRequire(cli);
const {getFirestoreConfig}=cliRequire("../firestore/fsConfig.js");
const config=JSON.parse(await readFile(path.join(root,"firebase.json"),"utf8"));
const deployed=getFirestoreConfig(QA_PROJECT,{config:{src:config},only:"firestore:rules"});
assert.equal(deployed.length,1,"Expected one explicit application database");
assert.equal(deployed[0].database,FIRESTORE_DATABASE_ID,"Rules deployment must target the database selected by the app");
assert.equal(deployed[0].rules,"firestore.rules");
console.log(`PASS: Firebase CLI resolves application rules to database ${deployed[0].database}`);
for(const port of [...Object.values(QA_PORTS),9150]){
  await new Promise((resolve,reject)=>{
    const probe=net.createServer();probe.once("error",reject);
    probe.listen(port,QA_HOST,()=>probe.close(resolve));
  });
}
const work=await mkdtemp(path.join(tmpdir(),"everwise-firebase-qa-"));
const resultPath=path.join(work,"completed.json");
await writeFile(path.join(work,"firestore.rules"),await readFile(path.join(root,"firestore.rules")));
await writeFile(path.join(work,"firebase.json"),JSON.stringify({
  firestore:deployed,
  emulators:{...Object.fromEntries(Object.entries(QA_PORTS).map(([name,port])=>[name,{host:QA_HOST,port}])),ui:{enabled:false},singleProjectMode:true},
},null,2));
const quote=value=>"'"+value.replaceAll("'","'\\''")+"'";
const command=[process.execPath,path.join(root,"scripts/qa-firebase-scenarios.mjs")].map(quote).join(" ");
const child=spawn(process.execPath,[cli,"emulators:exec","--project",QA_PROJECT,"--only","auth,firestore","--config","firebase.json",command],{
  cwd:work,stdio:"inherit",detached:process.platform!=="win32",
  env:{...process.env,FIREBASE_CLI_DISABLE_UPDATE_CHECK:"true",EVERWISE_FIREBASE_QA_RESULT:resultPath},
});
console.log(`Local emulator logs: ${work}`);
const stop=signal=>{try{process.kill(process.platform==="win32"?child.pid:-child.pid,signal);}catch{/* Already exited. */}};
let killTimer;
let timedOut=false;
const timer=setTimeout(()=>{timedOut=true;stop("SIGTERM");killTimer=setTimeout(()=>stop("SIGKILL"),5000);},10*60_000);
try {
  const code=await new Promise((resolve,reject)=>{child.once("error",reject);child.once("exit",(code,signal)=>resolve(code??(signal?1:0)));});
  let result;
  if (code===0 && !timedOut) {
    try { result=JSON.parse(await readFile(resultPath,"utf8")); } catch { /* Completion is validated below. */ }
  }
  process.exitCode=firebaseQaExitCode({code,timedOut,result});
  if (process.exitCode===0) console.log("PASS: parent verified all service scenarios and both browser journeys completed");
  else console.error(timedOut ? "FAIL: Firebase QA exceeded its ten-minute limit" : "FAIL: Firebase QA child did not complete successfully");
} finally {clearTimeout(timer);clearTimeout(killTimer);}
