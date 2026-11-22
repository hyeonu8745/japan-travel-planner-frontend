export function roundedYenRange(min, max) {
  if (!Number.isFinite(min)) return '가격 정보 없음';
  const first = Math.round(min / 100) * 100;
  const last = Number.isFinite(max) ? Math.round(max / 100) * 100 : first;
  return first === last ? `${first.toLocaleString('ko-KR')}엔` : `${first.toLocaleString('ko-KR')}~${last.toLocaleString('ko-KR')}엔`;
}

export function daySummary(budget, day, isFirst, isLast) {
  if (!budget) return null;
  const meals = budget.days?.find(item => item.dayNumber === day.dayNumber)?.meals ?? [];
  const transport = budget.transport;
  const trip = transport?.dayTrips?.find(item => item.dayNumber === day.dayNumber);
  const local = trip ?? transport?.days?.find(item => item.dayNumber === day.dayNumber);
  const travel = [];
  if (!transport?.rentalCar && local) travel.push({ label: trip ? `${trip.cityLabel} 왕복 + 시내` : '시내 이동', minYen: local.minYen, maxYen: local.maxYen });
  if (!transport?.rentalCar && transport?.airport) {
    for (const [show, leg, label] of [[isFirst, transport.airport.arrival, '공항 도착'], [isLast, transport.airport.departure, '공항 출발']]) {
      if (show && leg) travel.push({ label, minYen: leg.cheapYen, maxYen: leg.fastYen });
    }
  }
  const values = [...meals, ...travel];
  const complete = values.length > 0 && values.every(item => Number.isFinite(item.minYen) && Number.isFinite(item.maxYen));
  const total = complete ? { minYen: values.reduce((sum, item) => sum + item.minYen, 0), maxYen: values.reduce((sum, item) => sum + item.maxYen, 0) } : null;
  const modes = (day.stops ?? []).reduce((counts, stop) => {
    if (stop.travel?.mode === 'TRANSIT') counts.transit += 1;
    if (stop.travel?.mode === 'WALK') counts.walk += 1;
    return counts;
  }, { transit: 0, walk: 0 });
  return { meals, travel, total, modes };
}
