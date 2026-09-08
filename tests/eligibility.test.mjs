import test from 'node:test';
import assert from 'node:assert/strict';
import {isLiveListing} from '../lib/eligibility.ts';
const now=Date.parse('2026-09-08T12:00:00Z');
const valid={status:'available',photoChecked:true,priceVerified:true,availableVerified:true,specVerified:true,ukVerified:true,price:50000,year:2005,checkedAt:new Date(now).toISOString()};
test('eligible listing passes exact budget and year boundaries',()=>{for(const price of [10000,100000])for(const year of [1995,2010])assert.equal(isLiveListing({...valid,price,year},now),true);});
test('unavailable statuses and missing verification are rejected',()=>{for(const status of ['sold','POA','reserved','deposit taken','under offer','unverified'])assert.equal(isLiveListing({...valid,status},now),false);for(const key of ['photoChecked','priceVerified','availableVerified','specVerified','ukVerified'])assert.equal(isLiveListing({...valid,[key]:false},now),false);});
test('invalid price/year and expired or future timestamps are rejected',()=>{for(const price of [0,9999,100001,NaN,Infinity])assert.equal(isLiveListing({...valid,price},now),false);for(const year of [1994,2011,2000.5])assert.equal(isLiveListing({...valid,year},now),false);for(const checkedAt of ['bad',new Date(now-86400001).toISOString(),new Date(now+60001).toISOString()])assert.equal(isLiveListing({...valid,checkedAt},now),false);});
const exceptions=[
 {...valid,modelId:'model-071',make:'BMW',model:'M5',generation:'E61',bodyStyle:'Touring',engine:'5.0 V10',transmission:'SMG',factoryTransmission:true,year:2007},
 {...valid,modelId:'model-072',make:'BMW',model:'1M',generation:'E82',bodyStyle:'Coupe',transmission:'manual',factoryTransmission:true,year:2011},
 {...valid,modelId:'model-073',make:'Audi',model:'ur-quattro',generation:'original',bodyStyle:'Coupe',transmission:'manual',factoryTransmission:true,year:1980}
];
test('named exceptions require exact verified identity and factory transmission',()=>{
 for(const l of exceptions){
  assert.equal(isLiveListing(l,now),true);
  for(const key of ['make','model','generation','bodyStyle','transmission','factoryTransmission']){
   assert.equal(isLiveListing({...l,[key]:undefined},now),false,key);
   assert.equal(isLiveListing({...l,[key]:'wrong'},now),false,key);
  }
 }
 assert.equal(isLiveListing({...exceptions[0],generation:'E60',bodyStyle:'Saloon'},now),false);
 assert.equal(isLiveListing({...exceptions[0],modelId:'model-001'},now),false);
 assert.equal(isLiveListing({...exceptions[0],engine:'4.4 V8'},now),false);
 for(const [index,years] of [[0,[2006,2011]],[1,[2010,2013]],[2,[1979,1992]]])for(const year of years)assert.equal(isLiveListing({...exceptions[index],year},now),false);
 for(const [index,year] of [[0,2010],[1,2012],[2,1991]])assert.equal(isLiveListing({...exceptions[index],year},now),true);
});
test('exceptions cannot bypass price, availability, evidence or freshness checks',()=>{
 for(const l of exceptions){
  for(const price of [9999,100001])assert.equal(isLiveListing({...l,price},now),false);
  for(const status of ['sold','POA','reserved'])assert.equal(isLiveListing({...l,status},now),false);
  for(const key of ['photoChecked','priceVerified','availableVerified','specVerified','ukVerified'])assert.equal(isLiveListing({...l,[key]:false},now),false);
  assert.equal(isLiveListing({...l,checkedAt:new Date(now-86400001).toISOString()},now),false);
 }
});

test('owner-rejected cars remain hidden after fresh checks or reimport under a new ID',()=>{
 for(const id of ['vision-vn06lwy','bp-10652']) assert.equal(isLiveListing({...valid,id},now),false);
 for(const url of ['https://www.visioncarsales.co.uk/vehicle/name/bmw-z4-z4-m-roadster/?ref=search','https://bpcarsalesltd.co.uk/used/cars/honda-s2000-20-roadster-2dr-10652/']) assert.equal(isLiveListing({...valid,id:'reimported',url},now),false);
 assert.equal(isLiveListing({...valid,id:'different-s2000',url:'https://example.com/other-car'},now),true);
});
