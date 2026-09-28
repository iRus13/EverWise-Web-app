import test from 'node:test';
import assert from 'node:assert/strict';
import {assessmentRevision, restoreAssessmentPosition, readAssessmentPosition, saveAssessmentPosition, clearAssessmentPosition, clearAllAssessmentPositions} from '../src/utils/assessmentProgress.js';
const exam={questions:[{options:['a','b'],correctIndex:0},{options:['c','d'],correctIndex:1}]};
const challenge={blocks:[{type:'learn'},{type:'choice'}]};
const examPosition={kind:'exam',revision:assessmentRevision(exam),phase:'quiz',answers:[0],selected:1};
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};

test('assessment drafts stay separate by learner and item, and clear independently',()=>{
 const store=storage(), id={uid:'one',itemId:'exam',storage:store};
 assert.equal(saveAssessmentPosition({...id,position:examPosition}),true);
 saveAssessmentPosition({...id,uid:'two',position:{...examPosition,selected:0}});
 assert.deepEqual(readAssessmentPosition(id),examPosition);
 assert.equal(readAssessmentPosition({...id,itemId:'another'}),null);
 assert.equal(readAssessmentPosition({...id,uid:'missing'}),null);
 clearAssessmentPosition(id);
 assert.equal(readAssessmentPosition(id),null);
 assert.equal(readAssessmentPosition({...id,uid:'two'}).selected,0);
 clearAllAssessmentPositions({storage:store});
 assert.equal(readAssessmentPosition({...id,uid:'two'}),null);
});
test('drafts fail gracefully when storage is missing, corrupt, disabled or full',()=>{
 for(const store of [undefined,{getItem:()=>'{broken',setItem:()=>{throw Error('full')}},{getItem:()=>{throw Error('blocked')},removeItem:()=>{throw Error('blocked')}}]) {
  const id={uid:'one',itemId:'exam',storage:store};
  assert.equal(readAssessmentPosition(id),null);
  assert.equal(saveAssessmentPosition({...id,position:examPosition}),false);
  assert.equal(clearAllAssessmentPositions({storage:store}),false);
 }
});
test('exam restore validates authored bounds and content revision, ignores stored score',()=>{
 assert.deepEqual(restoreAssessmentPosition(exam,'exam',{...examPosition,score:999}),examPosition);
 for(const position of [
  {...examPosition,selected:2},{...examPosition,answers:[9]},
  {...examPosition,answers:[0,1]}, {...examPosition,phase:'results'},
  {...examPosition,answers:[0,1],phase:'results',selected:1},
  {...examPosition,answers:['0']},{...examPosition,selected:-1},
 ]) assert.equal(restoreAssessmentPosition(exam,'exam',position),null);
 assert.equal(restoreAssessmentPosition({...exam,title:'Revised'},'exam',examPosition),null);
 assert.ok(restoreAssessmentPosition(exam,'exam',{...examPosition,phase:'results',answers:[null,1],selected:null}));
});
test('challenge restore requires a real block and a valid final block for completion',()=>{
 const p={kind:'challenge',revision:assessmentRevision(challenge),blockIndex:1,finished:false};
 assert.deepEqual(restoreAssessmentPosition(challenge,'challenge',p),p);
 assert.ok(restoreAssessmentPosition(challenge,'challenge',{...p,finished:true}));
 for(const bad of [{...p,blockIndex:2},{...p,blockIndex:0,finished:true},{...p,finished:'yes'}]) assert.equal(restoreAssessmentPosition(challenge,'challenge',bad),null);
 assert.equal(restoreAssessmentPosition(challenge,'exam',p),null);
 assert.equal(saveAssessmentPosition({uid:'',itemId:'exam',position:p,storage:storage()}),false);
});
