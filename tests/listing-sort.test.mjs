import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sortListings} from '../lib/listing-sort.ts';
const cars=[
{id:'a',firstSeen:'2026-09-01',price:30000,mileage:null,year:2000},
{id:'b',firstSeen:'2026-09-03',price:20000,mileage:50000,year:2010},
{id:'c',firstSeen:'2026-09-02',price:40000,mileage:10000,year:2005},
];
test('all listing sort directions, including missing mileage last',()=>{
const expected={newest:'bca',oldest:'acb','price-asc':'bac','price-desc':'cab','mileage-asc':'cba','mileage-desc':'bca','year-asc':'acb','year-desc':'bca'};
for(const [sort,ids] of Object.entries(expected))assert.equal(sortListings(cars,sort).map(c=>c.id).join(''),ids,sort);
assert.equal(cars.map(c=>c.id).join(''),'abc');
});
test('ties use latest discovery and stable identity; empty lists work',()=>{
assert.deepEqual(sortListings([],'newest'),[]);
const tied=cars.map(c=>({...c,price:10000}));
assert.equal(sortListings(tied,'price-asc').map(c=>c.id).join(''),'bca');
});
