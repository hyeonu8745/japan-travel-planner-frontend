export const VERDICT_LABELS = { WITHIN: '예산 안', MAYBE_OVER: '넘을 수 있어요', OVER: '예산 초과', UNKNOWN: '확인 어려움' };
export function krwAmount(value) {
  if (!Number.isFinite(value)) return '정보 없음';
  if (value >= 10000) return `${(value / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만`;
  return Math.round(value).toLocaleString('ko-KR');
}
export function krwRange(min, max) {
  return Number.isFinite(min) && Number.isFinite(max) ? `${krwAmount(min)}~${krwAmount(max)} 원` : '확인 어려움';
}
export function exchangeRateText(rate, legacyRate) {
  const value = rate?.krwPerYen ?? legacyRate;
  if (!Number.isFinite(value) || value <= 0) return null;
  const label = rate?.sourceLabel || '고정 환율';
  const detail = [rate?.date, label].filter(Boolean).join(', ');
  return `기준 환율 100엔 = ${Math.round(value * 100).toLocaleString('ko-KR')}원 (${detail})`;
}


// Only open a current stop when the meal can be identified unambiguously.
export function mealStop(itinerary, dayNumber, meal) {
  const stops = itinerary?.days?.find((day) => day.dayNumber === dayNumber)?.stops?.filter((stop) => stop.type === meal.type) ?? [];
  const exact = stops.filter((stop) => (meal.name && stop.name === meal.name) || (meal.nameKo && stop.nameKo === meal.nameKo));
  return exact.length === 1 ? exact[0] : stops.length === 1 ? stops[0] : null;
}
