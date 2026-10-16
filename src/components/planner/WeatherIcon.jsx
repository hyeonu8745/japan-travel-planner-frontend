export default function WeatherIcon({ condition }) {
  const sun = condition === 'SUNNY', partly = condition === 'PARTLY_CLOUDY';
  const rain = ['RAIN','DRIZZLE'].includes(condition), snow = condition === 'SNOW';
  const known = ['SUNNY','PARTLY_CLOUDY','CLOUDY','FOG','DRIZZLE','RAIN','SNOW','THUNDER'].includes(condition);
  return <svg className={`weather-icon weather-${String(condition || 'UNKNOWN').toLowerCase()}`} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {sun ? <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></> : known ? <>{partly && <><circle cx="8" cy="8" r="3"/><path d="M8 2v1M2 8h1m1-4 1 1m7-1-1 1"/></>}<path d="M7 16h11a4 4 0 1 0-1-7.9A5.5 5.5 0 0 0 6.3 9 3.6 3.6 0 0 0 7 16Z"/>{rain && <path d={condition === 'DRIZZLE' ? 'M9 19v.5m6-.5v.5' : 'm9 18-1 3m7-3-1 3'}/ >}{snow && <path d="M9 18v4m-2-2h4m5-2v4m-2-2h4"/>}{condition === 'FOG' && <path d="M4 19h16M6 22h12"/>}{condition === 'THUNDER' && <path d="m13 16-3 4h4l-2 3"/>}</> : <><circle cx="12" cy="12" r="9"/><path d="M10 9a2 2 0 1 1 3 2c-1 1-1 1-1 3m0 3v.1"/></>}
  </svg>;
}
