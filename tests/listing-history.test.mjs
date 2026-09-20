import {test} from 'node:test';
import assert from 'node:assert/strict';
import {observedDuration, formatDuration, sortPastFinds} from '../lib/listing-history.ts';

const base = {id: 'car', checkedAt: '2026-09-20T12:00:00Z', firstSeen: '2026-09-08T13:21:11.301079Z', statusObservedAt: '2026-09-09T11:55:03.142559Z'};
test('elapsed time uses first observation, not a later recheck; no exact sale claim', () => {
  assert.equal(formatDuration(observedDuration(base)), '22h 33m');
  assert.equal(observedDuration({...base, checkedAt: '2026-10-01'}), observedDuration(base));
  assert.equal(formatDuration(0), 'Under 1 minute');
  assert.equal(formatDuration(2 * 86400000 + 3600000), '2d 1h');
});
test('unknown, invalid and reversed dates never become a quick sale', () => {
  for (const car of [{...base, firstSeen: null}, {...base, statusObservedAt: null}, {...base, firstSeen: 'bad'}, {...base, firstSeen: '2026-10-01'}]) {
    assert.equal(observedDuration(car), null);
    assert.equal(formatDuration(observedDuration(car)), 'Not recorded');
  }
});
test('unknown timing stays last for both duration sort directions', () => {
  const cars = [{...base, id: 'unknown', firstSeen: null}, {...base, id: 'slow', firstSeen: '2026-09-01'}, {...base, id: 'fast'}];
  assert.deepEqual(sortPastFinds(cars, 'fastest').map(car => car.id), ['fast', 'slow', 'unknown']);
  assert.deepEqual(sortPastFinds(cars, 'slowest').map(car => car.id), ['slow', 'fast', 'unknown']);
  assert.equal(cars[0].id, 'unknown');
});
