import { forecastRainProbability, temperature, weatherArtwork } from '../../utils/weatherPresentation';

export default function WeatherStrip({ weather }) {
  const {data,loading,error,reload} = weather;
  if (loading) return <div className="weather-strip weather-status" role="status">날씨 불러오는 중…</div>;
  if (error) return <div className="weather-strip weather-status" title={error}><button type="button" onClick={reload}>날씨 다시 불러오기</button></div>;
  if (!data) return null;
  return <div className="weather-strip" aria-label="여행 날짜별 날씨"><div className="weather-chip-list" title={data.message || ''}>
    {data.days?.map(day => <div className={`weather-chip weather-chip-${weatherArtwork(day.condition)}`} key={day.date || day.dayNumber} tabIndex={0} title={[data.message,day.label,day.observedDate && `관측일 ${day.observedDate}`,Number.isFinite(day.rainMm) && `강수량 ${day.rainMm}mm`].filter(Boolean).join(' · ')}><span className="weather-chip-day">DAY {day.dayNumber}</span><div className="weather-chip-temperature"><b>{temperature(day.tempMax)}</b><span> / {temperature(day.tempMin)}</span></div><div className="weather-chip-meta">{day.source === 'LAST_YEAR' ? '작년 이맘때' : forecastRainProbability(day) || day.label}</div></div>)}
    {!data.days?.length && <span className="weather-status">{data.message || '날씨 정보가 없어요.'}</span>}
    </div></div>;
}
