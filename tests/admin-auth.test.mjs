import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validAdminKey,createSession,validSession,SESSION_SECONDS,sameOrigin} from '../lib/admin-auth.ts';
const key='a'.repeat(64),now=1788950000000;
void test('owner access fails closed and rejects wrong or malformed keys',()=>{
 assert.equal(validAdminKey(key,key),true);
 for(const value of [null,{},'a','b'.repeat(64)])assert.equal(validAdminKey(value,key),false);
 assert.equal(validAdminKey('short','short'),false);
 assert.equal(validAdminKey(key,''),false);
});
void test('signed sessions reject tampering, expiry, other keys and malformed input',()=>{
 const session=createSession(key,now);
 assert.equal(validSession(session,key,now),true);
 assert.equal(validSession(session,key,now+SESSION_SECONDS*1000),false);
 assert.equal(validSession(session,'b'.repeat(64),now),false);
 assert.equal(validSession(session+'x',key,now),false);
 assert.equal(validSession('garbage',key,now),false);
 assert.equal(validSession(undefined,key,now),false);
 assert.equal(validSession(session,key,now-1000),false);
});
void test('mutations reject missing or foreign origins',()=>{
 const url='https://www.gavinspicks.com/api/admin/reports';
 assert.equal(sameOrigin(new Request(url,{headers:{origin:'https://www.gavinspicks.com'}})),true);
 assert.equal(sameOrigin(new Request(url,{headers:{origin:'https://attacker.example'}})),false);
 assert.equal(sameOrigin(new Request(url)),false);
});
