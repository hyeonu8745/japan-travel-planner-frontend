import { Component, useEffect, useMemo, useState } from "react";
import { APIProvider, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { buildMapDay, MAP_COLORS, mapPointTitle } from "../../utils/itineraryMapData";

function MapMessage({ children }) {
  return <div className="google-map-message" role="status">{children}</div>;
}

class MapBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <MapMessage>지도를 표시하지 못했어요. 새로고침해 다시 시도해주세요.</MapMessage> : this.props.children;
  }
}

function DayMapGeometry({ model }) {
  const map = useMap();
  const maps = useMapsLibrary("maps");
  const core = useMapsLibrary("core");
  useEffect(() => {
    if (!map || !maps || !core) return undefined;
    // Custom OverlayView pins need no additional cloud Map ID.
    const overlays = model.points.map((point) => {
      const pin = document.createElement("div");
      pin.className = `google-trip-pin google-trip-pin-${point.type.toLowerCase()}`;
      pin.style.setProperty("--pin-color", MAP_COLORS[point.type] ?? MAP_COLORS.ATTRACTION);
      pin.title = mapPointTitle(point);
      pin.setAttribute("role", "img"); pin.setAttribute("aria-label", pin.title); pin.tabIndex = 0;
      const badge = document.createElement("b");
      if (point.type === "HOTEL") badge.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 3l9 8v10h-6v-7H9v7H3Z" fill="currentColor"/></svg>';
      else badge.textContent = String(point.order);
      const label = document.createElement("span"); label.textContent = point.name;
      pin.append(badge, label);
      const overlay = new maps.OverlayView();
      overlay.onAdd = () => overlay.getPanes().overlayMouseTarget.append(pin);
      overlay.draw = () => {
        const pixel = overlay.getProjection()?.fromLatLngToDivPixel(new core.LatLng(point.position));
        if (pixel) { pin.style.left = `${pixel.x}px`; pin.style.top = `${pixel.y}px`; }
      };
      overlay.onRemove = () => pin.remove(); overlay.setMap(map);
      return overlay;
    });
    const lines = model.segments.map((segment) => new maps.Polyline({
      map, path: segment.path, geodesic: false, strokeColor: "#27a9dc", strokeOpacity: .8, strokeWeight: 3, clickable: false,
    }));
    const fit = () => {
      if (model.points.length === 1 || model.points.every((point) => point.position.lat === model.points[0]?.position.lat && point.position.lng === model.points[0]?.position.lng)) {
        map.setCenter(model.points[0].position); map.setZoom(16);
      } else {
        const bounds = new core.LatLngBounds(); model.points.forEach((point) => bounds.extend(point.position)); map.fitBounds(bounds, 70);
      }
    };
    fit();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    observer?.observe(map.getDiv());
    return () => { observer?.disconnect(); overlays.forEach((overlay) => overlay.setMap(null)); lines.forEach((line) => line.setMap(null)); };
  }, [map, maps, core, model]);
  return null;
}

function GoogleDayMap({ apiKey, model }) {
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    const previous = window.gm_authFailure;
    const authFailure = () => { setStatus("error"); if (typeof previous === "function") previous(); };
    window.gm_authFailure = authFailure;
    const timeout = window.setTimeout(() => setStatus((current) => current === "loading" ? "timeout" : current), 15000);
    return () => {
      window.clearTimeout(timeout);
      if (window.gm_authFailure === authFailure) {
        if (previous) window.gm_authFailure = previous;
        else delete window.gm_authFailure;
      }
    };
  }, []);
  return <>
    <APIProvider apiKey={apiKey} language="ko" region="JP" onLoad={() => setStatus((previous) => previous === "error" ? previous : "ready")} onError={() => setStatus("error")}>
      <MapBoundary>
        <Map defaultCenter={model.points[0].position} defaultZoom={13} maxZoom={18} gestureHandling="cooperative"
          mapTypeControl={false} streetViewControl={false} fullscreenControl zoomControl style={{ width: "100%", height: "100%" }}>
          <DayMapGeometry model={model} />
        </Map>
      </MapBoundary>
    </APIProvider>
    {status === "loading" && <MapMessage>Google 지도를 불러오고 있어요...</MapMessage>}
    {status === "error" && <MapMessage>지도를 불러오지 못했어요. 브라우저용 지도 키와 허용 주소, 네트워크 연결을 확인해주세요.</MapMessage>}
    {status === "timeout" && <MapMessage>지도 로딩이 지연되고 있어요. 네트워크 연결을 확인하거나 새로고침해주세요.</MapMessage>}
  </>;
}

export default function ItineraryMap({ accommodation, day }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const model = useMemo(() => buildMapDay(accommodation, day), [accommodation, day]);
  return <section className="map itinerary-map google-itinerary-map" aria-label="오늘의 일정 지도">
    <div className="google-map-canvas">
      {!day ? <MapMessage>일정을 만들면 선택한 날짜의 지도가 표시돼요.</MapMessage>
        : !apiKey ? <MapMessage>Google 지도 키가 아직 설정되지 않았어요. 지도 설정 후 개발 서버를 다시 실행해주세요.</MapMessage>
          : !model.points.length ? <MapMessage>이 날짜에는 지도에 표시할 좌표가 없어요.</MapMessage>
            : <GoogleDayMap apiKey={apiKey} model={model} />}
    </div>
    <footer className="google-map-footer">
      <b>{day ? `DAY ${day.dayNumber} · ${day.zoneLabel}` : "여행 지도"}</b>
      <div className="google-map-legend"><span className="hotel">숙소</span><span className="attraction">관광지</span><span className="lunch">점심</span><span className="dinner">저녁</span></div>
      <p>숙소부터 방문 순서대로 연결한 직선이에요. 실제 도로 경로는 일정의 ‘경로 보기’에서 확인하세요.</p>
      {model.missingCount > 0 && <p>좌표가 없는 장소 {model.missingCount}곳은 지도에서 제외했어요.</p>}
    </footer>
  </section>;
}
