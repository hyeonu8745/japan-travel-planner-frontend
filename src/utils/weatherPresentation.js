export function temperature(value) { return Number.isFinite(value) ? `${value}°` : '—'; }
export function forecastRainProbability(day) {
  return day?.source === 'FORECAST' && Number.isFinite(day.rainProbability) ? `강수 ${day.rainProbability}%` : null;
}
export function weatherForDay(weather, day) {
  return weather?.days?.find(item => day.date ? item.date === day.date : item.dayNumber === day.dayNumber);
}
export function canApplyRainPlan(plan) { return plan?.changed === true && Number.isFinite(plan.version); }

// Unknown/future conditions use a neutral background; never infer conditions from rain probability.
export function weatherArtwork(condition) {
  return ({SUNNY:'sunny',PARTLY_CLOUDY:'partly-cloudy',CLOUDY:'cloudy',FOG:'fog',DRIZZLE:'drizzle',RAIN:'rain',SNOW:'snow',THUNDER:'thunder',UNKNOWN:'unknown'})[condition] || 'unknown';
}
