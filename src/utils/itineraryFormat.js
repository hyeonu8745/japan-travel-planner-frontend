// 일정 응답(ItineraryResponseDto)을 화면에 보여주기 위한 순수 함수 모음

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export const MODE_LABELS = { WALK: "도보", TRANSIT: "대중교통", DRIVE: "차량" };
const GOOGLE_TRAVEL_MODES = {
  WALK: "walking",
  TRANSIT: "transit",
  DRIVE: "driving",
};

/** "16:15:00" → "16:15" */
export function hhmm(time) {
  return time ? time.slice(0, 5) : "";
}

/** "18:00" 에서 minutes분을 뺀 시각 (자정 아래로는 내려가지 않음) */
export function minusMinutes(time, minutes) {
  const [h, m] = hhmm(time).split(":").map(Number);
  const total = Math.max(0, h * 60 + m - minutes);
  const hour = String(Math.floor(total / 60)).padStart(2, "0");
  const minute = String(total % 60).padStart(2, "0");
  return `${hour}:${minute}`;
}

/** "2026-10-20" → "2026년 10월 20일 화요일" (시간대 문제가 없게 직접 파싱) */
export function formatLongDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${y}년 ${m}월 ${d}일 ${WEEKDAYS[date.getDay()]}요일`;
}

/** 54 → "54분", 88 → "1시간 28분", 120 → "2시간" */
export function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** 하루의 이동 시간 합 (장소 사이 여유 10분은 제외, 화면에 보이는 이동 시간 기준) */
export function totalTravelMinutes(day) {
  return day.stops.reduce((sum, stop) => sum + stop.travel.minutes, 0);
}

/** Google 지도 경로 보기 링크. 실제 지하철 경로는 이 링크로 확인한다 */
export function directionsUrl(from, to, mode) {
  const params = new URLSearchParams({
    api: "1",
    origin: `${from.lat},${from.lng}`,
    destination: `${to.lat},${to.lng}`,
    travelmode: GOOGLE_TRAVEL_MODES[mode] ?? "transit",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** 장소 이름으로 Google 지도 검색 링크 */
export function mapsSearchUrl(name) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}

/** "ラーメン,つけ麺,担々麺" → "ラーメン · つけ麺" (앞의 두 개가 대표 장르) */
export function genreLabel(genreCsv) {
  if (!genreCsv) return "";
  return genreCsv
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");
}

/** 타임라인 장소 아래 한 줄 설명 */
export function stopSubtitle(stop) {
  if (stop.type === "ATTRACTION") {
    const labels = stop.attraction?.labels ?? [];
    const kind =
      labels.length > 0
        ? `관광지 · ${labels.slice(0, 3).join(", ")}`
        : "관광지";
    return `${kind} · 체류 ${stop.stayMinutes}분`;
  }
  const meal = stop.type === "LUNCH" ? "점심" : "저녁";
  const genre = genreLabel(stop.restaurant?.genre);
  return `${meal}${genre ? ` · ${genre}` : ""} · 체류 ${stop.stayMinutes}분`;
}

/**
 * 하루를 타임라인 행으로 바꾼다.
 *  start → (move → [gap] → place) 반복
 * move는 앞 장소(첫 항목은 숙소)에서 이 장소로 오는 이동이고,
 * gap은 식사 시간대를 기다린 시간이다 (도착한 뒤 식사가 시작될 때까지)
 */
export function buildRows(day) {
  const rows = [];
  if (day.windowStart) {
    rows.push({ kind: "start", key: "start", time: hhmm(day.windowStart) });
  }
  day.stops.forEach((stop, index) => {
    rows.push({
      kind: "move",
      key: `move-${stop.order}`,
      travel: stop.travel,
      from: index > 0 ? day.stops[index - 1] : null,
      to: stop,
    });
    if (stop.waitMinutes > 0) {
      rows.push({
        kind: "gap",
        key: `gap-${stop.order}`,
        from: minusMinutes(stop.arrival, stop.waitMinutes),
        to: hhmm(stop.arrival),
      });
    }
    rows.push({ kind: "place", key: `place-${stop.order}`, stop });
  });
  return rows;
}
