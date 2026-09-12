import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupabaseStore} from '../lib/private-records.mjs';
const config={url:'https://example.supabase.co',key:'sb_secret_test'};
test('reads return records and preserve missing versus failed reads',async()=>{
 const calls=[];
 const store=createSupabaseStore({...config,fetcher:async(url,options)=>{calls.push({url,options});return Response.json([{payload:{action:'rejected'}}]);}});
 assert.deepEqual(await store.read('curation-decisions/abc.json'),{action:'rejected'});
 assert.equal(calls[0].url.searchParams.get('id'),'eq.abc');
 assert.equal(calls[0].options.cache,'no-store');
 assert.equal(calls[0].options.headers.apikey,config.key);
 const missing=createSupabaseStore({...config,fetcher:async()=>Response.json([])});
 assert.equal(await missing.read('sold-reports/abc.json'),null);
 const failed=createSupabaseStore({...config,fetcher:async()=>new Response('secret details',{status:403})});
 await assert.rejects(failed.read('sold-reports/abc.json'),/^Error: Private database request failed \(403\).$/);
});
test('batched reads paginate by stable key without one read per record',async()=>{
 const calls=[];
 const first=Array.from({length:500},(_,i)=>({id:String(i).padStart(4,'0'),payload:{i}}));
 const store=createSupabaseStore({...config,fetcher:async(url)=>{calls.push(url);return Response.json(calls.length===1?first:[{id:'0500',payload:{i:500}}]);}});
 const rows=await store.all('leads/');
 assert.equal(rows.length,501);assert.equal(calls.length,2);
 assert.equal(calls[1].searchParams.get('id'),'gt.0499');
});
test('inserts preserve duplicate protection; upserts are explicit and empty success is accepted',async()=>{
 const calls=[];
 const store=createSupabaseStore({...config,fetcher:async(url,options)=>{calls.push({url,options});return new Response(null,{status:201});}});
 await store.write('sold-reports/car.json',{status:'pending'});
 await store.write('curation-decisions/abc.json',{action:'approved'},true);
 assert.equal(calls[0].options.headers.Prefer,'return=minimal');
 assert.equal(calls[1].options.headers.Prefer,'resolution=merge-duplicates,return=minimal');
 assert.equal(calls[1].url.searchParams.get('on_conflict'),'collection,id');
 await assert.rejects(store.write('other/abc.json',{}),/Invalid private record path/);
});
test('deleting a report addresses only its exact collection and id',async()=>{
 let call;
 const store=createSupabaseStore({...config,fetcher:async(url,options)=>{call={url,options};return new Response(null,{status:204});}});
 await store.remove('sold-reports/car.json');
 assert.equal(call.options.method,'DELETE');
 assert.equal(call.url.searchParams.get('collection'),'eq.sold-reports');
 assert.equal(call.url.searchParams.get('id'),'eq.car');
});
