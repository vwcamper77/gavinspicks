import test from 'node:test';
import assert from 'node:assert/strict';
import {isLiveListing} from '../lib/eligibility.ts';
const now=Date.parse('2026-09-08T12:00:00Z');
const valid={status:'available',photoChecked:true,priceVerified:true,availableVerified:true,specVerified:true,ukVerified:true,price:50000,year:2005,checkedAt:new Date(now).toISOString()};
test('eligible listing passes exact budget and year boundaries',()=>{for(const price of [10000,100000])for(const year of [1995,2010])assert.equal(isLiveListing({...valid,price,year},now),true);});
test('unavailable statuses and missing verification are rejected',()=>{for(const status of ['sold','POA','reserved','deposit taken','under offer','unverified'])assert.equal(isLiveListing({...valid,status},now),false);for(const key of ['photoChecked','priceVerified','availableVerified','specVerified','ukVerified'])assert.equal(isLiveListing({...valid,[key]:false},now),false);});
test('invalid price/year and expired or future timestamps are rejected',()=>{for(const price of [0,9999,100001,NaN,Infinity])assert.equal(isLiveListing({...valid,price},now),false);for(const year of [1994,2011,2000.5])assert.equal(isLiveListing({...valid,year},now),false);for(const checkedAt of ['bad',new Date(now-86400001).toISOString(),new Date(now+60001).toISOString()])assert.equal(isLiveListing({...valid,checkedAt},now),false);});
