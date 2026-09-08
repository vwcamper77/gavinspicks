import test from 'node:test';
import assert from 'node:assert/strict';
import {acceptSoldReport} from '../lib/sold-reports.ts';
const targets=[{id:'recovered-001',url:'https://seller.example/car',label:'Car'}];
const request=(body={id:'recovered-001'},origin='https://gavinspicks.com')=>new Request('https://gavinspicks.com/api/reports',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
void test('report saves a server-owned URL once and stays pending',async()=>{
 const records=new Map();const store={exists:async p=>records.has(p),save:async(p,r)=>records.set(p,r)};
 for(let i=0;i<2;i++)assert.equal((await acceptSoldReport(request({id:'recovered-001',url:'https://attacker.example'}),targets,store)).status,202);
 assert.equal(records.size,1);const r=[...records.values()][0];assert.equal(r.url,targets[0].url);assert.equal(r.status,'pending');
});
void test('unknown IDs and cross-origin reports never write',async()=>{
 const store={exists:()=>{throw Error('must not read')},save:()=>{throw Error('must not write')}};
 assert.equal((await acceptSoldReport(request({id:'../other'}),targets,store)).status,404);
 assert.equal((await acceptSoldReport(request(undefined,'https://other.example'),targets,store)).status,403);
 assert.equal((await acceptSoldReport(request({id:'x'.repeat(600)}),targets,store)).status,413);
});
void test('storage failures do not produce a success acknowledgement',async()=>{
 assert.equal((await acceptSoldReport(request(),targets,{exists:async()=>false,save:async()=>{throw Error('offline')}})).status,503);
});
