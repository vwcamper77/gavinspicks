import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSelectionReport} from '../lib/selection-report.ts';

const now = Date.parse('2026-09-17T07:00:00Z');
function car(overrides = {}) {
  return {id: 'test', modelId: 'model-test', title: 'Example manual', year: 2005, price: 25000,
    gearbox: '6-speed manual', seller: 'Example', location: 'UK', url: 'https://example.com/test',
    checkedAt: new Date(now).toISOString(), firstSeen: new Date(now).toISOString(),
    status: 'available', photoChecked: true, priceVerified: true, availableVerified: true,
    specVerified: true, ukVerified: true, ...overrides};
}

test('freshness is mandatory, with exact 24-hour boundary', () => {
  assert.equal(buildSelectionReport([car({checkedAt: new Date(now - 86400000).toISOString()})], now).totalSelected, 1);
  for (const checkedAt of [new Date(now - 86400001).toISOString(), new Date(now + 60001).toISOString(), 'invalid']) {
    assert.equal(buildSelectionReport([car({checkedAt})], now).totalSelected, 0);
  }
});

test('rejects excluded models, gearbox variants, sold and unverified adverts', () => {
  for (const overrides of [{modelId:'model-072'}, {modelId:'model-070'}, {title:'Ford Focus RS500'},
    {gearbox:'4-speed automatic'}, {gearbox:'three speed manual'}, {status:'sold'},
    {photoChecked:false}, {price:9999}, {price:100001}, {year:2011}, {year:1994}]) {
    assert.equal(buildSelectionReport([car(overrides)], now).totalSelected, 0, JSON.stringify(overrides));
  }
});

test('deduplicates URLs and applies per-model, per-year and global caps', () => {
  assert.equal(buildSelectionReport([car(), car()], now).totalSelected, 1);
  const make = (i, overrides={}) => car({id:String(i), url:`https://example.com/${i}`, ...overrides});
  assert.equal(buildSelectionReport(Array.from({length:6}, (_,i)=>make(i)), now).totalSelected, 3);
  assert.equal(buildSelectionReport(Array.from({length:6}, (_,i)=>make(i,{modelId:`model-${i}`})), now).totalSelected, 4);
  const rows = Array.from({length:64}, (_,i)=>make(i,{year:1995+Math.floor(i/4),modelId:`model-${i}`}));
  const report = buildSelectionReport(rows, now);
  assert.equal(report.totalSelected,50);
  assert.ok(report.perYear.every(bucket=>bucket.count<=4));
});
