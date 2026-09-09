import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reviewAvailability} from '../lib/review-service.ts';
import {hiddenListings} from '../lib/availability-review.ts';
const target={id:'car-1',title:'Test car',url:'https://seller.example/car'};
const report={...target,reportedAt:'2026-09-09T10:00:00Z',status:'pending'};
function fixture(){let reports=[report];const reviews=[];return {reviews,readReports:async()=>reports,readReviews:async()=>reviews,saveReview:async(r)=>{reviews.push(r)},removeReport:async()=>{reports=[]}}}
const input={id:'car-1',action:'hide',note:'Original advert says sold.',reportedAt:report.reportedAt};
void test('review hides car, archives evidence, clears report, and can be restored',async()=>{
 const store=fixture();assert.equal((await reviewAvailability(input,[target],store)).status,200);
 assert.equal((await store.readReports()).length,0);assert.equal(store.reviews[0].url,target.url);
 assert.deepEqual(hiddenListings([target],store.reviews),['car-1']);
 assert.equal((await reviewAvailability({...input,action:'restore',reportedAt:null},[target],store)).status,200);
 assert.deepEqual(hiddenListings([target],store.reviews),[]);
});
void test('stale and duplicate reviews cannot change listing status',async()=>{
 const store=fixture();assert.equal((await reviewAvailability({...input,reportedAt:'2020-01-01'},[target],store)).status,409);
 assert.equal(store.reviews.length,0);await reviewAvailability(input,[target],store);
 assert.equal((await reviewAvailability(input,[target],store)).status,409);
});
void test('failed persistence never clears a pending report',async()=>{
 const store=fixture();store.saveReview=async()=>{throw Error('offline')};
 await assert.rejects(()=>reviewAvailability(input,[target],store));
 assert.equal((await store.readReports()).length,1);
});
void test('dismissal keeps car listed and stores owner note',async()=>{
 const store=fixture();await reviewAvailability({...input,action:'dismiss'},[target],store);
 assert.deepEqual(hiddenListings([target],store.reviews),[]);assert.equal(store.reviews[0].note,input.note);
});
