import { MODE_LABELS, hhmm } from "./itineraryFormat.js";

import { travelMapsUrl } from "./travelPresentation.js";
import { isDayTrip } from "./regionSelection.js";
import { displayName } from "./itineraryPresentation.js";

export const MAP_COLORS = { HOTEL: "#287365", ATTRACTION: "#07182d", LUNCH: "#27a9dc", DINNER: "#7560a8", CAFE: "#a87848" };

function position(point) {
  if (point?.lat == null || point?.lng == null || point.lat === "" || point.lng === "") return null;
  const lat = Number(point.lat), lng = Number(point.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

export function transitGeometry(travel) {
  if (travel?.mode !== "TRANSIT" || !travel.route?.segments?.length) return null;
  const legs = travel.route.segments.map((segment) => {
    if (!Array.isArray(segment.path) || segment.path.length < 2) return null;
    const points = segment.path.map(position);
    if (points.some((point) => !point)) return null;
    return { ...segment, points, color: /^#[\da-f]{6}$/i.test(segment.colour) ? segment.colour : "#788695" };
  });
  return legs.every(Boolean) ? legs : null;
}

export function buildMapDay(accommodation, day) {
  const hotelPosition = position(accommodation);
  const hotel = hotelPosition ? { key: "hotel", type: "HOTEL", name: accommodation.name || "숙소", position: hotelPosition } : null;
  const stops = [...(day?.stops ?? [])].sort((a, b) => a.order - b.order).map((stop) => ({
    key: `${day.dayNumber}-${stop.order}`, type: stop.type, order: stop.order, name: displayName(stop), originalName: stop.nameKo ? stop.name : null,
    position: position(stop), arrival: stop.arrival, departure: stop.departure, travel: stop.travel,
  }));
  const route = [isDayTrip(day) ? null : hotel, ...stops];
  const segments = [];
  for (let index = 1; index < route.length; index++) {
    const from = route[index - 1], to = route[index];
    to.directionsUrl = travelMapsUrl(to.travel, from?.position, to.position);
    const transitLegs = transitGeometry(to.travel);
    const origin = from?.position ?? (isDayTrip(day) ? transitLegs?.[0].points[0] : null);
    if (origin && to?.position) segments.push({ key: to.key, mode: to.travel?.mode, minutes: to.travel?.minutes, fromOrder: from?.order ?? (isDayTrip(day) ? "도착역" : "숙소"), toOrder: to.order, fromName: from?.name ?? transitLegs?.[0].path[0].nameKo ?? transitLegs?.[0].path[0].name, toName: to.name, directionsUrl: to.directionsUrl, transitLegs, path: [origin, to.position] });
  }
  return { points: route.filter((point) => point?.position), segments, missingCount: stops.filter((stop) => !stop.position).length + (accommodation && !hotel ? 1 : 0) };
}

export function mapPointTitle(point) {
  if (point.type === "HOTEL") return `숙소 · ${point.name}`;
  const travel = point.travel;
  const movement = travel && `${MODE_LABELS[travel.mode] ?? travel.mode} ${travel.minutes}분${travel.distanceMeters != null ? ` · ${travel.distanceMeters.toLocaleString()}m` : ""}`;
  return [ `${point.order}. ${point.name}`, point.originalName, `${hhmm(point.arrival)}–${hhmm(point.departure)}`, movement && `앞 장소에서 ${movement}` ].filter(Boolean).join("\n");
}
