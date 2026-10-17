// Retain partial edits; normalize only on blur/submission, never while typing.
export function normalizeFlightTime(value) {
  const text = String(value ?? '').trim();
  if (/^\d{3,4}$/.test(text)) return `${text.slice(0,-2).padStart(2,'0')}:${text.slice(-2)}`;
  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  return match ? `${match[1].padStart(2,'0')}:${match[2]}` : text;
}

// Empty values must be explicit nulls so an existing flight can also be cleared by PUT.
export function flightRequestFields(values) {
  const result = {};
  for (const direction of ['arrival', 'departure']) {
    const airport = values[`${direction}Airport`] || null;
    const time = normalizeFlightTime(values[`${direction}FlightTime`]) || null;
    if (airport && !['NRT', 'HND'].includes(airport)) throw new Error('공항은 나리타 또는 하네다를 선택해주세요.');
    if (time && !airport) throw new Error(`${direction === 'arrival' ? '도착' : '출발'} 공항도 함께 선택해주세요.`);
    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('비행기 시각은 HH:mm 형식으로 입력해주세요.');
    result[`${direction}Airport`] = airport;
    result[`${direction}FlightTime`] = time;
  }
  return result;
}

// Preserve server wording and order, including an arrival and departure on the same day.
export function dayTransfers(day, position) {
  return (day?.transfers ?? []).filter(transfer => transfer.position === position);
}
