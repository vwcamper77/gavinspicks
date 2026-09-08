import test from 'node:test';
import assert from 'node:assert/strict';
import {
  predict,
  defaultInputs,
  historicalGrowth,
} from '../lib/future-predictor.ts';

const zero = {
  ...defaultInputs,
  growth: 0,
  spread: 0,
  discountRate: 0,
  storage: 0,
  maintenance: 0,
  servicing: 0,
  other: 0,
  costInflation: 0,
  saleFee: 0,
  annualMiles: 0,
  mileagePenalty: 0,
};
const close = (a, b) => assert.ok(Math.abs(a - b) < 0.00001, `${a} != ${b}`);

void test('flat market with no costs breaks even; discount affects purchase only', () => {
  close(predict(50000, zero).last.net, 0);
  const result = predict(50000, { ...zero, discount: 10 });
  close(result.purchase, 45000);
  close(result.last.base, 50000);
  close(result.last.net, 5000);
});

void test('growth, costs, fees and discounting reconcile against cash flows', () => {
  const r = predict(50000, {
    ...zero,
    growth: 10,
    storage: 1000,
    maintenance: 500,
    servicing: 500,
    costInflation: 10,
    saleFee: 5,
    discountRate: 10,
  });
  close(r.last.base, 80525.5);
  close(r.last.cumulativeCost, 12210.2);
  close(r.last.proceeds, 76499.225);
  close(r.last.net, 14289.025);
  close(r.last.npv, 47500 - 50000 - (5 * 2000) / 1.1);
  close(r.breakEven * 0.95 - 50000 - r.last.cumulativeCost, 0);
});

void test('premium and mileage adjustments compound without changing the starting price', () => {
  const r = predict(50000, {
    ...zero,
    desirability: 10,
    owners: -10,
    condition: 20,
    annualMiles: 10000,
    mileagePenalty: 2,
  });
  close(r.years[0].base, 50000);
  close(r.last.base, 50000 * 1.1 * 0.9 * 1.2 * 0.98 ** 5);
});

void test('scenario order and input safety hold at boundary values', () => {
  const r = predict(50000, {
    ...defaultInputs,
    growth: -30,
    spread: 20,
    discount: 200,
    saleFee: 100,
    storage: NaN,
  });
  assert.equal(r.input.discount, 50);
  assert.equal(r.input.saleFee, 30);
  assert.equal(r.input.storage, defaultInputs.storage);
  for (const year of r.years) {
    assert.ok(year.low <= year.base && year.base <= year.high);
    assert.ok(Number.isFinite(year.npv));
    assert.ok(year.low > 0);
  }
  assert.throws(() => predict(0, defaultInputs));
});

void test('historical trend requires all six positive observations', () => {
  assert.equal(historicalGrowth([100, null, 120, 130, 140, 150]), null);
  assert.equal(historicalGrowth([100, 110, 120, 130, 140, 0]), null);
  assert.equal(historicalGrowth([100, 110]), null);
  close(historicalGrowth([100, 110, 121, 133.1, 146.41, 161.051]), 10);
});

void test('default storage and selling commission are zero',()=>{
 assert.equal(defaultInputs.storage,0);
 assert.equal(defaultInputs.saleFee,0);
});
void test('break-even growth reconciles to zero profit including mileage and premiums',()=>{
 const inputs={...defaultInputs,discount:5,maintenance:750,servicing:900,desirability:4,owners:-3,saleFee:2};
 const r=predict(50000,inputs);
 close(predict(50000,{...inputs,growth:r.breakEvenGrowth}).last.net,0);
 const higher=predict(50000,{...inputs,maintenance:3000});
 assert.ok(higher.last.net<r.last.net);
 assert.equal(higher.last.base,r.last.base);
});
