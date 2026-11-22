import { useLayoutEffect, useRef, useState } from "react";
import { dayZonesLabel, restaurantGenres } from "../utils/itineraryPresentation";
import { isDayTrip } from "../utils/regionSelection";
import { stationName } from "../utils/travelPresentation";
import { daySummary, roundedYenRange } from "../utils/daySummary";
import "./dayPage.css";
const formatDate = value => { if (!value) return ""; const date = new Date(value + "T00:00:00"); return Number.isNaN(date.getTime()) ? value : `${date.getMonth()+1}/${date.getDate()} (${"일월화수목금토"[date.getDay()]})`; };
const time = value => value ? String(value).slice(0, 5) : "";
const kinds = { LUNCH: "점심", DINNER: "저녁", CAFE: "카페" };

function Transfer({ item }) {
  return <div className="print-row"><time>{time(item.time)}</time><span>🚉 {item.label}</span></div>;
}

function Travel({ travel }) {
  if (!travel) return null;
  const segments = travel.route?.segments ?? [];
  return <div className="print-travel">{segments.length ? segments.map((segment, index) =>
    <span key={index}><span className="print-chip" style={{ borderColor: /^#[\da-f]{6}$/i.test(segment.colour) ? segment.colour : "#999" }}>● {segment.line} {segment.stops != null && `${segment.stops}정거장`}</span>{index < segments.length - 1 && <> → {stationName(segment.to, segment.toKo)} 환승 → </>}</span>
  ) : travel.mode === "WALK" ? "🚶 도보" : travel.mode === "DRIVE" ? "자동차" : "대중교통"}{travel.minutes != null && ` · ${travel.minutes}분`}</div>;
}



export default function DayPage({ day, title, pageNo, backgroundUrl, budget, isFirst = false, isLast = false }) {
  const summary = daySummary(budget, day, isFirst, isLast);
  const frame = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const measure = () => {
      const box = frame.current;
      const content = contentRef.current;
      if (!box || !content || !box.clientWidth || !box.clientHeight) return;
      let low = 0.01;
      let high = 1.15;
      for (let step = 0; step < 20; step += 1) {
        const candidate = (low + high) / 2;
        content.style.width = `${box.clientWidth / candidate}px`;
        if (content.scrollHeight * candidate <= box.clientHeight &&
            content.scrollWidth * candidate <= box.clientWidth + 1) {
          low = candidate;
        } else {
          high = candidate;
        }
      }
      content.style.width = `${box.clientWidth / low}px`;
      setScale(low);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame.current);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [day, title, pageNo, budget, isFirst, isLast]);
  return <section className="day-page" style={backgroundUrl ? { backgroundImage: `url("${backgroundUrl}")` } : undefined}>
    <div className="day-page-area" ref={frame}>
      <div className="day-page-content" ref={contentRef} style={{ transform: `scale(${scale})` }}>
        <header><span className="day-page-title">{title || "나의 여행"} · 상세 일정</span><span className="day-page-number">{pageNo}</span></header>
      <h1>DAY {day.dayNumber} · {formatDate(day.date)} · {dayZonesLabel(day)} {isDayTrip(day) && <small>당일치기</small>}</h1>
      {day.description && <p className="day-description">{day.description}</p>}
      {day.transfers?.filter(item => item.position === "BEFORE").map((item, i) => <Transfer key={i} item={item} />)}
      {day.stops?.map((stop, i) => <div key={stop.id || i}>{i > 0 && <Travel travel={stop.travel} />}<div className="print-row"><time>{time(stop.arrival)}{stop.departure && `–${time(stop.departure)}`}</time><div><strong>{stop.nameKo || stop.name}</strong>{stop.nameKo && stop.name && <small>{stop.name}</small>}<span>{[kinds[stop.type], stop.attraction?.labels?.[0], stop.stayMinutes != null && `${stop.stayMinutes}분`, stop.attraction?.mustSee && "대표 명소", restaurantGenres(stop.restaurant), stop.restaurant?.budget, stop.restaurant?.nearestStation && `가까운 역 ${stop.restaurant.nearestStation}`].filter(Boolean).join(" · ")}</span></div></div></div>)}
      {day.transfers?.filter(item => item.position === "AFTER").map((item, i) => <Transfer key={i} item={item} />)}
      {summary && <section className="day-summary">
        <h2>오늘 요약 (1인)</h2>
        {summary.meals.map((meal, index) => <div key={index}><span>식비 · {kinds[meal.type] || meal.type} {meal.nameKo || meal.name}{meal.estimated && ' (예상)'}</span><strong>{roundedYenRange(meal.minYen, meal.maxYen)}</strong></div>)}
        {summary.travel.map((item, index) => <div key={index}><span>교통 · {item.label}</span><strong>{roundedYenRange(item.minYen, item.maxYen)}</strong></div>)}
        <div className="day-summary-total"><span>합계</span><strong>{summary.total ? `약 ${roundedYenRange(summary.total.minYen, summary.total.maxYen)}` : '확인 어려움'}</strong></div>
        <div><span>이동</span><span>대중교통 {summary.modes.transit}구간 · 도보 {summary.modes.walk}구간</span></div>
      </section>}
      {day.warnings?.map((warning, i) => <p className="print-warning" key={i}>⚠ {warning}</p>)}
      {isLast && budget && Number.isFinite(budget.total?.minYen) && Number.isFinite(budget.total?.maxYen) && <p className="day-trip-total">여행 전체 예상 (1인) 약 {roundedYenRange(budget.total.minYen / (budget.travelers || 1), budget.total.maxYen / (budget.travelers || 1))}{Number.isFinite(budget.total.minKrw) && Number.isFinite(budget.total.maxKrw) && ` (약 ${Math.round(budget.total.minKrw / (budget.travelers || 1)).toLocaleString('ko-KR')}~${Math.round(budget.total.maxKrw / (budget.travelers || 1)).toLocaleString('ko-KR')}원)`}{(budget.exchangeRate?.date || budget.exchangeRateDate) && ` · 환율 ${budget.exchangeRate?.date || budget.exchangeRateDate} 기준`}</p>}
      {isLast && <p className="print-disclaimer">이동 시간은 예상치예요. 영업시간·휴무와 교통편은 방문 전 확인해 주세요. 노선은 참고용이에요.</p>}
      </div>
    </div>
  </section>;
}
