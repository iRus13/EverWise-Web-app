import test from 'node:test';
import assert from 'node:assert/strict';
import {partnerLearnerBaseUrl} from '../src/utils/partnerLearnerUrl.js';

test('native invitation base uses the public web app instead of the internal Capacitor address',()=>{
 assert.equal(partnerLearnerBaseUrl({native:true,currentUrl:'capacitor://localhost/#partner-admin=secret'}).href,'https://everwise.tips/');
});
test('a separate native deployment can use its configured HTTPS origin',()=>{
 assert.equal(partnerLearnerBaseUrl({native:true,publicOrigin:'https://learning.example.com'}).href,'https://learning.example.com/');
});
test('web invitation base preserves the app path and strips the admin fragment',()=>{
 assert.equal(partnerLearnerBaseUrl({currentUrl:'https://learning.example.com/app/?lang=en#partner-admin=secret'}).href,'https://learning.example.com/app/?lang=en');
});
for(const origin of ['http://learning.example.com','capacitor://localhost','https://user:secret@example.com','https://example.com/app','https://example.com/?secret=x','https://example.com/#secret','invalid']){
 test(`invalid native public origin is unavailable: ${origin}`,()=>assert.equal(partnerLearnerBaseUrl({native:true,publicOrigin:origin}),null));
}
test('unsupported current browser URL fails closed',()=>assert.equal(partnerLearnerBaseUrl({currentUrl:'javascript:void(0)'}),null));
