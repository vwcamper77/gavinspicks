import test from 'node:test';
import assert from 'node:assert/strict';
import evidence from '../data/market-evidence.json' with {type:'json'};
import {marketProfile, chartSales, ownershipAppeal} from '../lib/market-evidence.ts';
void test('different bodies and conversions cannot inherit inappropriate evidence',()=>{
 assert.notEqual(marketProfile({modelId:'model-001',title:'Ferrari 360 Modena'}),marketProfile({modelId:'model-001',title:'Ferrari 360 Spider'}));
 assert.equal(marketProfile({modelId:'model-007',title:'Audi R8 V10 Coupe'}),null);
 assert.equal(marketProfile({modelId:'model-067',title:'Porsche 996 Carrera 4S standard'}),null);
});
void test('graph excludes overseas, related, future and more-than-five-year-old sales',()=>{
 const s=evidence['tt-qs'].sales[0];
 const sales=[s,{...s,currency:'USD'},{...s,match:'related'},{...s,date:'2021-09-08'},{...s,date:'2026-09-10'}];
 assert.deepEqual(chartSales(sales,'2026-09-09'),[s]);
});
void test('appeal weighting respects personal preferences without entering financial model',()=>{
 assert.equal(ownershipAppeal(8,10,100),8);
 assert.equal(ownershipAppeal(8,10,0),10);
 assert.equal(ownershipAppeal(8,10,50),9);
});
void test('evidence has dated sourced prices and consistently ordered budgets',()=>{
 for(const p of Object.values(evidence)){
  assert.ok(p.lowMaintenance<=p.highMaintenance);
  for(const s of p.sales){assert.ok(s.price>0);assert.ok(Number.isFinite(Date.parse(s.date)));assert.equal(new URL(s.url).protocol,'https:');assert.ok(s.fees);}
 }
});
