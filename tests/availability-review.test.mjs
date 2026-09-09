import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hiddenListings,latestReviews,validateReview} from '../lib/availability-review.ts';
const cars=[{id:'car-1',url:'https://seller.example/one'},{id:'reimport-1',url:'https://seller.example/one'},{id:'car-2',url:'https://seller.example/two'}];
const hide={...cars[0],title:'Car one',action:'hide',note:'Seller confirmed unavailable',reportedAt:'2026-09-09T10:00:00Z',reviewedAt:'2026-09-09T11:00:00Z'};
void test('hiding persists across repeated feed loads and same-url reimports',()=>{
 assert.deepEqual(hiddenListings(cars,[hide]),['car-1','reimport-1']);
 assert.deepEqual(hiddenListings([...cars],[hide]),['car-1','reimport-1']);
});
void test('restore removes hold, dismiss does not hide, event ordering is stable',()=>{
 const restore={...hide,action:'restore',reviewedAt:'2026-09-09T12:00:00Z'};
 assert.deepEqual(hiddenListings(cars,[restore,hide]),[]);
 assert.deepEqual(hiddenListings(cars,[{...hide,action:'dismiss'}]),[]);
 assert.equal(latestReviews([restore,hide])[0].action,'restore');
});
void test('reviews require valid id, explicit action, note and report snapshot',()=>{
 assert.ok(validateReview({...hide}));
 assert.ok(validateReview({...hide,action:'restore',reportedAt:null}));
 for(const bad of [null,{}, {...hide,id:'../secret'}, {...hide,note:''},{...hide,action:'delete'},{...hide,reportedAt:'oops'}])assert.equal(validateReview(bad),null);
});
