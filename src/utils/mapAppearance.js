// Display geometry only; no external route lookup for transit.
export function transitArc([from, to]) {
  const lngScale = Math.max(.1, Math.cos((from.lat + to.lat) / 2 * Math.PI / 180));
  const dx = (to.lng - from.lng) * lngScale, dy = to.lat - from.lat;
  const control = { lat: (from.lat + to.lat) / 2 + dx * .24, lng: (from.lng + to.lng) / 2 - dy * .24 / lngScale };
  return Array.from({ length: 33 }, (_, index) => {
    const t = index / 32, remaining = 1 - t;
    return {
      lat: remaining * remaining * from.lat + 2 * remaining * t * control.lat + t * t * to.lat,
      lng: remaining * remaining * from.lng + 2 * remaining * t * control.lng + t * t * to.lng,
    };
  });
}

// Anchor to half of the drawn route length, rather than half of its vertices.
export function pathMidpoint(path) {
  if (path.length < 2) return path[0];
  const lengths = path.slice(1).map((point, index) => {
    const from = path[index];
    const scale = Math.cos((from.lat + point.lat) / 2 * Math.PI / 180);
    return Math.hypot(point.lat - from.lat, (point.lng - from.lng) * scale);
  });
  let remaining = lengths.reduce((total, length) => total + length, 0) / 2;
  for (let index = 0; index < lengths.length; index++) {
    if (remaining <= lengths[index]) {
      const fraction = lengths[index] ? remaining / lengths[index] : 0;
      const from = path[index], to = path[index + 1];
      return { lat: from.lat + (to.lat - from.lat) * fraction, lng: from.lng + (to.lng - from.lng) * fraction };
    }
    remaining -= lengths[index];
  }
  return path.at(-1);
}

export function pixelPathDistance(point, path) {
  let distance = Infinity;
  for (let index = 1; index < path.length; index++) {
    const a = path[index - 1], b = path[index];
    const dx = b.x - a.x, dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    const fraction = lengthSquared ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared)) : 0;
    distance = Math.min(distance, Math.hypot(point.x - a.x - fraction * dx, point.y - a.y - fraction * dy));
  }
  return distance;
}

export function routeColor(mode, index) {
  // Transit stays orange; solid routes use visibly different segment colors.
  if (mode === "TRANSIT") return ["#bc4700", "#dc6500", "#9c3800"][index % 3];
  return ["#dc2626", "#2563eb", "#9333ea", "#059669", "#db2777", "#0891b2", "#854d0e", "#4f46e5"][index % 8];
}
