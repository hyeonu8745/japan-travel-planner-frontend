import test from 'node:test';
import assert from 'node:assert/strict';
import { daySummary, roundedYenRange } from '../src/utils/daySummary.js';

test('당일치기 비용은 시내 이동을 중복하지 않고 공항 비용은 해당 날짜에만 더한다', () => {
  const budget = { days: [{ dayNumber: 1, meals: [{ minYen: 1000, maxYen: 1200 }] }], transport: { days: [{ dayNumber: 1, minYen: 300, maxYen: 400 }], dayTrips: [{ dayNumber: 1, cityLabel: '교토', minYen: 1500, maxYen: 1600 }], airport: { arrival: { cheapYen: 500, fastYen: 700 } } } };
  const result = daySummary(budget, { dayNumber: 1, stops: [{ travel: { mode: 'WALK' } }] }, true, false);
  assert.deepEqual(result.total, { minYen: 3000, maxYen: 3500 });
  assert.equal(result.travel.length, 2);
  assert.equal(result.modes.walk, 1);
});

test('값이 없으면 합계를 추정하지 않고 렌터카 교통비는 제외한다', () => {
  const result = daySummary({ days: [{ dayNumber: 1, meals: [{ minYen: null }] }], transport: { rentalCar: true, days: [{ dayNumber: 1, minYen: 100 }] } }, { dayNumber: 1 }, true, true);
  assert.equal(result.total, null);
  assert.deepEqual(result.travel, []);
  assert.equal(roundedYenRange(null, null), '가격 정보 없음');
  assert.equal(roundedYenRange(949, 951), '900~1,000엔');
  assert.equal(roundedYenRange(1001, 1049), '1,000엔');
});
