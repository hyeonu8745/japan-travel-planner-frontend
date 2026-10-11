export function clusterMapPins(points, gap = 44) {
  const pending = new Set(points.map((_, index) => index));
  const groups = [];
  while (pending.size) {
    const first = pending.values().next().value;
    const group = [first]; pending.delete(first);
    for (let cursor = 0; cursor < group.length; cursor += 1) {
      const point = points[group[cursor]];
      if (point.clusterable === false) continue;
      for (const index of pending) {
        const other = points[index];
        if (other.clusterable !== false && Math.hypot(point.x - other.x, point.y - other.y) < gap) { group.push(index); pending.delete(index); }
      }
    }
    groups.push(group);
  }
  return groups;
}

export function mapClusterLabel(orders) {
  const sorted = [...orders].sort((a, b) => a - b);
  if (sorted.length > 1 && sorted.every((order, index) => order === sorted[0] + index)) return `${sorted[0]}–${sorted.at(-1)}`;
  return sorted.length <= 3 ? sorted.join('·') : `${sorted[0]}·${sorted[1]} +${sorted.length - 2}`;
}

// Keep geographic anchors unchanged; only offset crowded marker badges in pixels.
export function layoutMapPins(points, gap = 56) {
  const placed = [];
  return points.map(point => {
    const candidates = [{ dx: 0, dy: 0 }];
    for (const radius of [gap, gap * 1.5, gap * 2, gap * 2.5]) {
      for (let i = 0; i < 12; i += 1) {
        const angle = -Math.PI / 2 + i * Math.PI / 6;
        candidates.push({ dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius });
      }
    }
    const available = candidates.find(({ dx, dy }) => placed.every(other => Math.hypot(point.x + dx - other.x, point.y + dy - other.y) >= gap - 0.01));
    const offset = available ?? candidates.reduce((best, candidate) => {
      const clearance = value => Math.min(...placed.map(other => Math.hypot(point.x + value.dx - other.x, point.y + value.dy - other.y)));
      return clearance(candidate) > clearance(best) ? candidate : best;
    });
    placed.push({ x: point.x + offset.dx, y: point.y + offset.dy });
    return offset;
  });
}
