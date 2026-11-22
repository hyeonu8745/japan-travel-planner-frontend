export function changeRegion(values, region) {
  return {
    ...values,
    region: region?.code ?? '',
    baseCity: region?.cities?.[0]?.code ?? '',
    dayTripCities: [],
    arrivalAirport: '',
    arrivalFlightTime: '',
    departureAirport: '',
    departureFlightTime: '',
  };
}

export function changeBaseCity(values, baseCity) {
  return { ...values, baseCity, dayTripCities: [] };
}

export function toggleDayTrip(values, city) {
  const selected = values.dayTripCities ?? [];
  if (selected.includes(city)) return { ...values, dayTripCities: selected.filter((item) => item !== city) };
  if (selected.length >= 3) return values;
  return { ...values, dayTripCities: [...selected, city] };
}

export function validateDestination(values, regions) {
  const region = regions.find((item) => item.code === values.region);
  if (!region) throw new Error('여행할 권역을 골라주세요.');
  const base = region.cities.find((item) => item.code === values.baseCity);
  if (!base) throw new Error('숙소 도시를 골라주세요.');
  if (values.dayTripCities.length > 3) throw new Error('당일치기 도시는 3곳까지 고를 수 있어요.');
  if (values.dayTripCities.some((code) => !base.dayTrips?.some((trip) => trip.city === code))) {
    throw new Error('숙소 도시에서 갈 수 있는 당일치기 도시를 골라주세요.');
  }
  for (const airport of [values.arrivalAirport, values.departureAirport]) {
    if (airport && !region.airports.some((item) => item.code === airport)) {
      throw new Error('고른 권역의 공항을 선택해주세요.');
    }
  }
}

export function shortTrip(start, end) {
  if (!start || !end) return false;
  const first = Date.parse(start);
  const last = Date.parse(end);
  return Number.isFinite(first) && Number.isFinite(last) && last >= first && last - first <= 86400000;
}

export function isDayTrip(day) {
  return day?.transfers?.some((transfer) => transfer.kind === 'DAY_TRIP_GO') ?? false;
}

export function dayTripLabel(day, trips = []) {
  if (!isDayTrip(day)) return '';
  const transfer = day.transfers.find((item) => item.kind === 'DAY_TRIP_GO');
  const matches = trips.filter((trip) => trip.toStation && transfer.label?.includes(trip.toStation));
  return matches.length === 1 ? `${matches[0].label} 당일치기` : '당일치기';
}
