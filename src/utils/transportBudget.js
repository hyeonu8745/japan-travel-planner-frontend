export function yenAmount(value) {
  return Number.isFinite(value) ? `${Math.round(value).toLocaleString('ko-KR')}엔` : '확인 어려움';
}
export function yenRange(min, max) {
  return Number.isFinite(min) && Number.isFinite(max) ? `${Math.round(min).toLocaleString('ko-KR')}~${Math.round(max).toLocaleString('ko-KR')}엔` : '확인 어려움';
}
export function passRecommendation(pass, savingsYen) {
  const days = pass.fromDay === pass.toDay ? `${pass.fromDay}일차` : `${pass.fromDay}~${pass.toDay}일차`;
  return `${days} ${pass.hours}시간권 추천${Number.isFinite(savingsYen) && savingsYen > 0 ? ` · ${yenAmount(savingsYen)} 절약` : ''}`;
}
