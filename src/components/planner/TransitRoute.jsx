import { stationName } from '../../utils/travelPresentation';

export default function TransitRoute({ travel, onSelect, selected = false, destination }) {
  const route = travel?.mode === 'TRANSIT' ? travel.route : null;
  if (!route) return null;
  const segments = route.segments ?? [];
  return <div className="transit-route transit-journey" aria-label="대중교통 참고 경로">
    <div className="transit-journey-header">{onSelect ? (
      <button type="button" className="transit-route-select" aria-pressed={selected}
        aria-label={`${destination}까지 대중교통 경로 강조`} onClick={onSelect}>대중교통 이동</button>
    ) : <b>대중교통 이동</b>}<strong>{travel.minutes}분</strong></div>
    <div className="transit-journey-body">
      {route.walkToMeters != null && <p className="transit-walk">🚶 승차역까지 도보 {route.walkToMeters.toLocaleString()}m</p>}
      <div className="transit-stop"><span aria-hidden="true">●</span><b>{stationName(route.fromStation, route.fromStationKo)}</b><small>승차</small></div>
      {segments.map((segment, index) => <div className="transit-journey-leg" key={index} style={{ '--line-color': /^#[\da-f]{6}$/i.test(segment.colour) ? segment.colour : '#788695' }}>
        <div className="transit-line-chip"><span aria-hidden="true">●</span><b>{segment.line}</b>{segment.stops != null && <span>{segment.stops}정거장</span>}</div>
        <div className="transit-stop"><span aria-hidden="true">●</span><b>{stationName(segment.to, segment.toKo)}</b><small>{index < segments.length - 1 ? '환승' : '하차'}</small></div>
      </div>)}
      {!segments.length && <div className="transit-stop"><span aria-hidden="true">●</span><b>{stationName(route.toStation, route.toStationKo)}</b><small>하차</small></div>}
      {route.walkFromMeters != null && <p className="transit-walk">🚶 목적지까지 도보 {route.walkFromMeters.toLocaleString()}m</p>}
    </div>
    <small className="transit-reference">노선은 참고용이에요. 시간표·정확한 경로는 길찾기에서 확인하세요.</small>
  </div>;
}
