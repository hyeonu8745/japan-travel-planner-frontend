import { MODE_LABELS, hhmm } from "./itineraryFormat";

export const MAP_COLORS = { HOTEL: "#287365", ATTRACTION: "#07182d", LUNCH: "#27a9dc", DINNER: "#7560a8" };

function position(point) {
  if (point?.lat == null || point?.lng == null || point.lat === "" || point.lng === "") return null;
  const lat = Number(point.lat), lng = Number(point.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

export function buildMapDay(accommodation, day) {
  const hotelPosition = position(accommodation);
  const hotel = hotelPosition ? { key: "hotel", type: "HOTEL", name: accommodation.name || "숙소", position: hotelPosition } : null;
  const stops = [...(day?.stops ?? [])].sort((a, b) => a.order - b.order).map((stop) => ({
    key: `${day.dayNumber}-${stop.order}`, type: stop.type, order: stop.order, name: stop.name,
    position: position(stop), arrival: stop.arrival, departure: stop.departure, travel: stop.travel,
  }));
  const route = [hotel, ...stops];
  const segments = [];
  for (let index = 1; index < route.length; index++) {
    const from = route[index - 1], to = route[index];
    if (from?.position && to?.position) segments.push({ key: to.key, path: [from.position, to.position] });
  }
  return { points: route.filter((point) => point?.position), segments, missingCount: stops.filter((stop) => !stop.position).length + (accommodation && !hotel ? 1 : 0) };
}

export function mapPointTitle(point) {
  if (point.type === "HOTEL") return `숙소 · ${point.name}`;
  const travel = point.travel;
  const movement = travel && `${MODE_LABELS[travel.mode] ?? travel.mode} ${travel.minutes}분${travel.distanceMeters != null ? ` · ${travel.distanceMeters.toLocaleString()}m` : ""}`;
  return [ `${point.order}. ${point.name}`, `${hhmm(point.arrival)}–${hhmm(point.departure)}`, movement && `앞 장소에서 ${movement}` ].filter(Boolean).join("\n");
}
