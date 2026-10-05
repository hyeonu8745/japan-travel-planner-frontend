function validPoint(point) {
  return (
    Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng))
  );
}

function projectPoints(accommodation, stops) {
  const points = [];

  if (validPoint(accommodation)) {
    points.push({
      key: "hotel",
      kind: "hotel",
      name: accommodation.name || "숙소",
      lat: Number(accommodation.lat),
      lng: Number(accommodation.lng),
    });
  }

  stops.forEach((stop) => {
    if (!validPoint(stop)) return;

    points.push({
      key: `stop-${stop.order}`,
      kind: stop.type === "ATTRACTION" ? "attraction" : "meal",
      order: stop.order,
      name: stop.name,
      lat: Number(stop.lat),
      lng: Number(stop.lng),
    });
  });

  if (points.length === 0) return [];

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latSpan = Math.max(maxLat - minLat, 0.002);
  const lngSpan = Math.max(maxLng - minLng, 0.002);

  const padding = 10;
  const usable = 80;

  return points.map((p) => ({
    ...p,
    x: padding + ((p.lng - minLng) / lngSpan) * usable,
    y: padding + ((maxLat - p.lat) / latSpan) * usable,
  }));
}

export default function ItineraryMap({
  accommodation,
  day,
  selectedOrder,
  onSelectStop,
}) {
  const stops = day?.stops ?? [];
  const points = projectPoints(accommodation, stops);

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <section className="map itinerary-map" aria-label="오늘의 일정 지도">
      {points.length > 0 ? (
        <>
          <svg
            className="itinerary-route"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {points.length > 1 && <polyline points={linePoints} />}
          </svg>

          {points.map((point) => {
            const isHotel = point.kind === "hotel";
            const active = !isHotel && point.order === selectedOrder;

            return (
              <button
                key={point.key}
                type="button"
                className={`map-stop-pin ${point.kind} ${
                  active ? "active" : ""
                }`}
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                }}
                onClick={() => !isHotel && onSelectStop?.(point.order)}
                disabled={isHotel}
                title={point.name}
              >
                <b>{isHotel ? "숙" : point.order}</b>
                <span>{point.name}</span>
              </button>
            );
          })}
        </>
      ) : (
        <div className="map-empty">표시할 좌표가 없어요.</div>
      )}

      <div className="map-info">
        {day ? (
          <>
            <span>오늘의 동선</span>
            <b>{day.zoneLabel}</b>
            <small>
              좌표 기준으로 표시한 동선입니다. 선은 실제 도로 경로가 아닌 직선
              연결입니다.
            </small>
          </>
        ) : (
          <>
            <span>지도</span>
            <b>일정 생성 후 표시</b>
            <small>숙소에서 출발하는 하루 동선이 표시됩니다.</small>
          </>
        )}
      </div>
    </section>
  );
}
