import { Component, useEffect, useMemo, useRef, useState } from "react";
import { APIProvider, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { transitArc, routeColor, pathMidpoint, pixelPathDistance } from "../../utils/mapAppearance";
import { createRouteCache } from "../../api/mapRoutes";
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

function DayMapGeometry({ model, selectedOrder, routeCache, onRouteFailures }) {
  const pinElements = useRef([]);
  const selectMapStop = useRef(null);
  const map = useMap();
  const maps = useMapsLibrary("maps");
  const core = useMapsLibrary("core");
  useEffect(() => {
    if (!map || !maps || !core) return undefined;
    let active = true;
    onRouteFailures(0);
    const infoWindow = new maps.InfoWindow();
    const routePanel = document.createElement("div"); routePanel.className = "google-route-panel"; routePanel.hidden = true;
    routePanel.setAttribute("role", "region"); routePanel.setAttribute("aria-label", "선택한 이동 구간");
    maps.OverlayView.preventMapHitsAndGesturesFrom?.(routePanel);
    map.getDiv().append(routePanel);
    const showPanel = (content) => {
      infoWindow.close();
      const close = document.createElement("button"); close.type = "button"; close.className = "google-route-panel-close";
      close.textContent = "×"; close.setAttribute("aria-label", "경로 정보 닫기");
      close.addEventListener("click", () => { routePanel.hidden = true; emphasizeSegment(null); });
      routePanel.replaceChildren(close, content); routePanel.hidden = false;
    };
    pinElements.current = [];
    // Custom OverlayView pins need no additional cloud Map ID.
    const overlays = model.points.map((point) => {
      const pin = document.createElement("div");
      pin.className = `google-trip-pin google-trip-pin-${point.type.toLowerCase()}`;
      pin.style.setProperty("--pin-color", MAP_COLORS[point.type] ?? MAP_COLORS.ATTRACTION);
      pin.title = mapPointTitle(point);
      pin.setAttribute("role", "button"); pin.setAttribute("aria-label", `${pin.title} · 지도 정보 열기`); pin.tabIndex = 0;
      const showInfo = () => {
        routePanel.hidden = true; emphasizeSegment(null);
        const content = document.createElement("div"); content.className = "google-route-info";
        const title = document.createElement("b"); title.textContent = point.type === "HOTEL" ? `숙소 · ${point.name}` : `${point.order}. ${point.name}`;
        const details = document.createElement("p"); details.textContent = mapPointTitle(point).split("\n").slice(1).join("\n");
        content.append(title, details);
        if (point.type !== "HOTEL") {
          if (point.directionsUrl) {
            const link = document.createElement("a"); link.className = "directions-button"; link.textContent = "길찾기";
            link.href = point.directionsUrl; link.target = "_blank"; link.rel = "noopener noreferrer"; content.append(link);
          } else {
            const note = document.createElement("span"); note.textContent = "출발지 좌표가 없어 길찾기를 열 수 없어요."; content.append(note);
          }
          if (point.travel?.mode === "TRANSIT") {
            const note = document.createElement("p"); note.className = "directions-transit-note"; note.textContent = "열차·환승 안내는 Google 지도에서"; content.append(note);
          }
        }
        infoWindow.setContent(content); infoWindow.setPosition(point.position); infoWindow.open({ map, shouldFocus: false });
      };
      pin.addEventListener("click", showInfo);
      pin.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); showInfo(); }
      });
      maps.OverlayView.preventMapHitsAndGesturesFrom?.(pin);
      const badge = document.createElement("b");
      if (point.type === "HOTEL") badge.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 3l9 8v10h-6v-7H9v7H3Z" fill="currentColor"/></svg>';
      else badge.textContent = String(point.order);
      const label = document.createElement("span"); label.textContent = point.name;
      if (point.type === "LUNCH" || point.type === "DINNER") {
        const mealIcon = document.createElement("i"); mealIcon.className = "google-pin-meal-icon";
        mealIcon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2v7m3-7v7M2 2v7c0 3 6 3 6 0M5 12v10m11-20c-4 3-4 9 0 10V2Zm0 10v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        badge.append(mealIcon);
      }
      pin.append(badge, label);
      pinElements.current.push({ pin, order: point.order });
      const overlay = new maps.OverlayView();
      overlay.onAdd = () => overlay.getPanes().overlayMouseTarget.append(pin);
      overlay.draw = () => {
        const pixel = overlay.getProjection()?.fromLatLngToDivPixel(new core.LatLng(point.position));
        if (pixel) { pin.style.left = `${pixel.x}px`; pin.style.top = `${pixel.y}px`; }
      };
      overlay.onRemove = () => pin.remove(); overlay.setMap(map);
      return overlay;
    });
    const lineListeners = [];
    const transitLabels = [];
    const routeLabels = [];
    const outlines = [], casings = [], hitLines = [], routePaths = [], baseIcons = [];
    const emphasizeSegment = (index) => {
      lines.forEach((line, lineIndex) => {
        const selected = lineIndex === index, transit = model.segments[lineIndex].mode === "TRANSIT";
        const zIndex = selected ? 1000 : 10 + lineIndex * 4;
        line.setOptions({ strokeColor: selected ? routeColor(model.segments[lineIndex].mode, lineIndex) : "#8d9baa", strokeWeight: selected ? 8 : 3, strokeOpacity: transit ? 0 : selected ? 1 : .75, zIndex: zIndex + 2,
          icons: selected ? baseIcons[lineIndex] : transit ? [{ ...baseIcons[lineIndex][0], icon: { ...baseIcons[lineIndex][0].icon, strokeColor: "#8794a2", fillColor: "#8794a2", strokeWeight: .8, scale: .65 } }] : [] });
        outlines[lineIndex].setOptions({ strokeOpacity: selected && !transit ? .85 : 0, zIndex, icons: selected && transit ? [{ ...baseIcons[lineIndex][0], icon: { ...baseIcons[lineIndex][0].icon, strokeColor: "#07182d", fillColor: "#07182d", strokeWeight: 5 } }] : [] });
        casings[lineIndex].setOptions({ strokeWeight: selected ? 12 : 5, zIndex: zIndex + 1,
          icons: transit ? [{ ...baseIcons[lineIndex][0], icon: { ...baseIcons[lineIndex][0].icon, strokeColor: "#fff", fillColor: "#fff", strokeWeight: selected ? 3 : 2, scale: selected ? 1 : .65 } }] : [] });
      });
      routeLabels.forEach(({ label }, labelIndex) => label.classList.toggle("is-selected", labelIndex === index));
    };
    const selectAtPoint = (index, event) => {
      const projection = overlays[0]?.getProjection();
      if (!event?.latLng || !projection) { routeLabels[index].showDirections(); return; }
      const point = projection.fromLatLngToDivPixel(event.latLng);
      const candidates = routePaths.flatMap((path, routeIndex) => {
        const pixels = path.map((position) => projection.fromLatLngToDivPixel(new core.LatLng(position)));
        return point && pixels.every(Boolean) && pixelPathDistance(point, pixels) <= 16 ? [routeIndex] : [];
      });
      if (candidates.length < 2) { routeLabels[index].showDirections(); return; }
      const content = document.createElement("div"); content.className = "google-route-info google-route-picker";
      const heading = document.createElement("b"); heading.textContent = "겹친 경로 · 확인할 구간을 선택하세요"; content.append(heading);
      candidates.forEach((routeIndex) => {
        const button = document.createElement("button"); button.type = "button";
        button.textContent = routeLabels[routeIndex].summary;
        button.style.setProperty("--route-color", routeColor(model.segments[routeIndex].mode, routeIndex));
        button.addEventListener("click", routeLabels[routeIndex].showDirections); content.append(button);
      });
      showPanel(content);
    };
    const lines = model.segments.map((segment, index) => {
      const transit = segment.mode === "TRANSIT";
      const path = transit ? transitArc(segment.path) : segment.path;
      const color = routeColor(segment.mode, index);
      let midpoint = pathMidpoint(path);
      // A repeating double chevron reads as a guidance lane without hiding turns.
      const arrow = { icon: { path: "M -2,2 0,0 2,2 M -2,6 0,4 2,6", fillOpacity: 0, strokeColor: "#fff", strokeOpacity: 1, strokeWeight: 2, scale: 1.5 }, offset: "36px", repeat: "84px" };
      const endpoints = ["0%", "100%"].map((offset, endpoint) => ({ icon: { path: core.SymbolPath.CIRCLE, fillColor: endpoint ? color : "#fff", fillOpacity: 1, strokeColor: "#07182d", strokeWeight: 1.5, strokeOpacity: 1, scale: 4 }, offset }));
      const icons = segment.mode === "TRANSIT" ? [
        { icon: { path: "M -3,-5 Q -3,-7 0,-7 Q 3,-7 3,-5 L 3,5 Q 3,7 0,7 Q -3,7 -3,5 Z", fillColor: color, fillOpacity: 1, strokeColor: color, strokeOpacity: 1, strokeWeight: 1, scale: 1 }, offset: "0", repeat: "24px" }, { ...arrow, offset: "48px", repeat: "96px" },
      ] : [arrow];
      icons.push(...endpoints);
      routePaths.push(path); baseIcons.push(icons);
      outlines.push(new maps.Polyline({ map, path, geodesic: false, strokeColor: "#07182d", strokeOpacity: 0, strokeWeight: 15, clickable: false, zIndex: 10 + index * 4 }));
      casings.push(new maps.Polyline({ map, path, geodesic: false, strokeColor: "#fff", strokeOpacity: transit ? 0 : .95, strokeWeight: 11, clickable: false, zIndex: 10 + index * 3,
        icons: transit ? [{ ...icons[0], icon: { ...icons[0].icon, strokeColor: "#fff", fillColor: "#fff", strokeWeight: 3 } }] : [] }));
      const hitLine = new maps.Polyline({ map, path, geodesic: false, strokeColor: color, strokeOpacity: .01, strokeWeight: 30, clickable: true, zIndex: 2000 + index });
      hitLines.push(hitLine);
      const line = new maps.Polyline({ map, path, geodesic: false, strokeColor: color,
        strokeOpacity: transit ? 0 : 1, strokeWeight: 7, clickable: false, icons, zIndex: 11 + index * 3 });
      {
        const modeLabel = transit ? "전철" : segment.mode === "DRIVE" ? "차" : "도보";
        const text = segment.minutes != null ? `${modeLabel} 약 ${segment.minutes}분` : `${modeLabel} 이동`;
        const orderLabel = `${segment.fromOrder} → ${segment.toOrder}`;
        const showDirections = () => {
          emphasizeSegment(index);
          const content = document.createElement("div"); content.className = "google-route-info";
          const title = document.createElement("b"); title.textContent = `${orderLabel} · ${text}`;
          const names = document.createElement("p"); names.textContent = `${segment.fromName} → ${segment.toName}`;
          const note = document.createElement("p"); note.textContent = transit ? "표시된 곡선은 실제 노선이 아니에요. 열차·환승 안내는 Google 지도에서 확인하세요." : "이동 시간은 일정 기준이에요. 자세한 경로는 Google 지도에서 확인하세요.";
          const link = document.createElement("a"); link.className = "directions-button"; link.textContent = "길찾기";
          link.href = segment.directionsUrl; link.target = "_blank"; link.rel = "noopener noreferrer";
          content.append(title, names, note, link);
          showPanel(content);
        };
        lineListeners.push(hitLine.addListener("click", (event) => selectAtPoint(index, event)));
        const label = document.createElement("button"); label.type = "button"; label.className = "google-transit-label";
        label.style.setProperty("--route-color", color); label.textContent = transit ? `🚃 ${orderLabel}` : orderLabel;
        label.title = `${orderLabel} 구간 길찾기 보기`; label.setAttribute("aria-label", `${segment.fromName}에서 ${segment.toName}까지 ${text} · 길찾기 보기`);
        label.addEventListener("click", showDirections);
        maps.OverlayView.preventMapHitsAndGesturesFrom?.(label);
        const labelEntry = { label, summary: `${orderLabel} · ${transit ? "🚃 " : ""}${text}`, showDirections, updatePath: (updatedPath) => {
          midpoint = pathMidpoint(updatedPath);
          overlay.draw();
        } };
        routeLabels.push(labelEntry);
        const overlay = new maps.OverlayView();
        overlay.onAdd = () => overlay.getPanes().overlayMouseTarget.append(label);
        overlay.draw = () => {
          const pixel = overlay.getProjection()?.fromLatLngToDivPixel(new core.LatLng(midpoint));
          if (pixel) { label.style.left = `${pixel.x}px`; label.style.top = `${pixel.y}px`; }
        };
        overlay.onRemove = () => label.remove(); overlay.setMap(map); transitLabels.push(overlay);
      }
      return line;
    });
    emphasizeSegment(null);
    selectMapStop.current = (order) => {
      const index = model.segments.findIndex((segment) => segment.toOrder === order);
      const point = model.points.find((point) => point.order === order);
      if (index >= 0) routeLabels[index].showDirections();
      else { routePanel.hidden = true; emphasizeSegment(null); }
      if (point) map.panTo(point.position);
    };
    // Deferral avoids starting paid calls for StrictMode's discarded effect.
    Promise.resolve().then(async () => {
      if (!active) return;
      const results = await Promise.all(model.segments.map(async (segment, index) => {
        const result = await routeCache.get(segment);
        if (active && segment.mode !== "TRANSIT") { routePaths[index] = result.path; lines[index].setPath(result.path); outlines[index].setPath(result.path); casings[index].setPath(result.path); hitLines[index].setPath(result.path); routeLabels[index].updatePath(result.path); }
        return result;
      }));
      if (active) onRouteFailures(results.filter((result) => result.failed).length);
    });
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
    return () => { active = false; selectMapStop.current = null; pinElements.current = []; observer?.disconnect(); infoWindow.close(); routePanel.remove(); lineListeners.forEach((listener) => listener.remove()); transitLabels.forEach((overlay) => overlay.setMap(null)); overlays.forEach((overlay) => overlay.setMap(null)); [...lines, ...outlines, ...casings, ...hitLines].forEach((line) => line.setMap(null)); };
  }, [map, maps, core, model, routeCache, onRouteFailures]);
  useEffect(() => {
    pinElements.current.forEach(({ pin, order }) => {
      const selected = order != null && order === selectedOrder;
      pin.classList.toggle("is-selected", selected);
      pin.setAttribute("aria-pressed", String(selected));
    });
    selectMapStop.current?.(selectedOrder);
  }, [selectedOrder, model, map, maps, core]);
  return null;
}

function GoogleDayMap({ apiKey, model, selectedOrder }) {
  const [routeCache] = useState(() => createRouteCache());
  const [routeFailures, setRouteFailures] = useState(0);
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
          <DayMapGeometry model={model} selectedOrder={selectedOrder} routeCache={routeCache} onRouteFailures={setRouteFailures} />
        </Map>
      </MapBoundary>
    </APIProvider>
    {routeFailures > 0 && <div className="google-route-fallback" role="status">경로를 불러오지 못한 {routeFailures}개 구간은 직선으로 표시해요.</div>}
    {status === "loading" && <MapMessage>Google 지도를 불러오고 있어요...</MapMessage>}
    {status === "error" && <MapMessage>지도를 불러오지 못했어요. 브라우저용 지도 키와 허용 주소, 네트워크 연결을 확인해주세요.</MapMessage>}
    {status === "timeout" && <MapMessage>지도 로딩이 지연되고 있어요. 네트워크 연결을 확인하거나 새로고침해주세요.</MapMessage>}
  </>;
}

export default function ItineraryMap({ accommodation, day, selectedOrder = null }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const model = useMemo(() => buildMapDay(accommodation, day), [accommodation, day]);
  return <section className="map itinerary-map google-itinerary-map" aria-label="오늘의 일정 지도">
    <div className="google-map-canvas">
      {!day ? <MapMessage>일정을 만들면 선택한 날짜의 지도가 표시돼요.</MapMessage>
        : !apiKey ? <MapMessage>Google 지도 키가 아직 설정되지 않았어요. 지도 설정 후 개발 서버를 다시 실행해주세요.</MapMessage>
          : !model.points.length ? <MapMessage>이 날짜에는 지도에 표시할 좌표가 없어요.</MapMessage>
            : <GoogleDayMap apiKey={apiKey} model={model} selectedOrder={selectedOrder} />}
      {day && <div className="google-route-legend" aria-label="이동수단 범례"><span className="walk">실선: 도보·차</span><span className="transit">점선: 대중교통</span><small>선택한 구간은 컬러로 강조 · 이동 안내는 하단에 표시<br />대중교통: 실제 노선은 길찾기에서 확인</small></div>}
    </div>
    <footer className="google-map-footer">
      <b>{day ? `DAY ${day.dayNumber} · ${day.zoneLabel}` : "여행 지도"}</b>
      <div className="google-map-legend"><span className="hotel">숙소</span><span className="attraction">관광지</span><span className="lunch">점심</span><span className="dinner">저녁</span></div>
      <p>도보·차는 실제 경로, 대중교통은 위치를 잇는 점선 곡선이며 실제 노선이 아니에요. 이동 시간은 일정 기준이며, 자세한 안내는 ‘길찾기’에서 확인하세요.</p>
      {model.missingCount > 0 && <p>좌표가 없는 장소 {model.missingCount}곳은 지도에서 제외했어요.</p>}
    </footer>
  </section>;
}
