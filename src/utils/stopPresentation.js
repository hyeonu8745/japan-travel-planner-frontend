export const STOP_KIND_LABELS = { ATTRACTION: '관광지', LUNCH: '점심', DINNER: '저녁', CAFE: '쉬는 시간 카페' };
export const stopKindLabel = type => STOP_KIND_LABELS[type] || type;

// The server selects the appropriate daytime/dinner budget and exposes it as restaurant.budget.
export function cafeBudgetText(restaurant) {
  const raw = typeof restaurant?.budget === 'string' ? restaurant.budget.trim() : '';
  const normalized = raw.normalize('NFKC');
  if (!raw || ['-', '—'].includes(normalized)) return '예산 정보 없음';
  const upperOnly = normalized.match(/^[~〜]\s*¥?\s*(\d+(?:,\d{3})*)\s*(?:円|엔)?$/u);
  if (upperOnly) return `~${Number(upperOnly[1].replaceAll(',', '')).toLocaleString('ko-KR')}엔`;
  return raw;
}

export function cafeBudgetLabel(restaurant) {
  const text = cafeBudgetText(restaurant);
  return text === '예산 정보 없음' ? text : `1인 ${text}`;
}
