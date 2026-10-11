import { Fragment, useRef, useState } from "react";
import StopReasons from "./StopReasons";
import PlaceArtwork from "./PlaceArtwork";
import { dayHeaderArtwork } from "../../utils/placeArtwork";
import "../../styles/itineraryArt.css";
import {
  MODE_LABELS,
  buildRows,
  directionsUrl,
  formatLongDate,
  formatMinutes,
  stopSubtitle,
  totalTravelMinutes,
} from "../../utils/itineraryFormat";

import { dayZonesLabel, displayName } from "../../utils/itineraryPresentation";

const ART_ROOT = "/assets/ui-v2";
const MOVE_ART = { WALK: "walk", TRANSIT: "transit", DRIVE: "drive" };

function ItineraryArt({ name, className = "" }) {
  return <img className={`itinerary-art-icon ${className}`} src={`${ART_ROOT}/${name}.svg`} alt="" aria-hidden="true" />;
}



/**
 * 하루 일정 타임라인 (가운데 칸의 기본 상태)
 * - onOpenDetail(stop): "상세 보기"를 눌렀을 때
 * 서버가 계산한 값을 그대로 보여주기만 한다 (시각, 이동, 여유 시간, 빠진 장소, 안내)
 */
export default function DayTimeline({ day, accommodation, onOpenDetail, selectedOrder = null, onSelectStop, readOnly = false, busy = false, onReorder, onAdd }) {
  const dragIndex = useRef(null);
  const [dragging, setDragging] = useState(null);
  const canEdit = !readOnly && !busy;
  const moveStop = (from, to) => {
    if (!canEdit || from == null || from === to || to < 0 || to >= day.stops.length) return;
    const ids = day.stops.map((stop) => stop.id);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    onReorder?.(ids);
  };
  const addButton = (position) => !readOnly && (
    <li className="timeline-insert"><button type="button" disabled={busy} onClick={() => onAdd?.(position)}>+ 장소</button></li>
  );
  const rows = buildRows(day);
  const hasTransit = day.stops.some((stop) => stop.travel.mode === "TRANSIT");
  const image = dayHeaderArtwork(day);

  return (
    <section className="detail day-timeline planner-redesign itinerary-art premium-timeline">
      <div className="timeline-fixed-head">
      <div className="region-day-cover">
        {image && (
          <img src={image} alt={`${dayZonesLabel(day)} 지역 풍경`} />
        )}
        <div>
          <h2>DAY {day.dayNumber} · {dayZonesLabel(day)}</h2>
          <p>{formatLongDate(day.date)}</p>
        </div>
      </div>

      {day.description && <header className="timeline-head"><p>{day.description}</p></header>}
      </div>

      <div className="timeline-scroll" role="region" aria-label={`DAY ${day.dayNumber} 일정`} tabIndex={0}>
      {day.warnings?.length > 0 && <div className="notice-yellow" role="status">
        <b>⚠ 일정 안내</b>
        <ul>{day.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
      </div>}
      {day.dropped.length > 0 && (
        <div className="notice-yellow">
          <b>시간이 맞지 않아 일정에서 뺀 곳</b>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {day.dropped.map((d) => (
              <li key={d.name}>
                {displayName(d)} · {d.reasonLabel}
              </li>
            ))}
          </ul>
        </div>
      )}
      {hasTransit && (
        <div className="notice-gray">
          대중교통 시간은 예상치예요. 실제 경로는 &lsquo;길찾기&rsquo;에서
          확인하세요.
        </div>
      )}

      <ol className="timeline-list">
        {rows.map((row) => {
          if (row.kind === "start") {
            return (
              <li key={row.key} className="timeline-place timeline-start">
                <time>{row.time}</time>
                <div className="timeline-start-content">
                  <ItineraryArt name="hotel" />
                  <div>
                  <h3>숙소 출발</h3>
                  <p>{accommodation?.name || "출발점"}</p>
                  </div>
                </div>
              </li>
            );
          }
          if (row.kind === "move") {
            const routeFrom = row.from ?? accommodation;
            const routeUrl = directionsUrl(routeFrom, row.to, row.travel.mode);

            return (
              <Fragment key={row.key}>
              <li className="timeline-transfer">
              <div className={`timeline-move mode-${row.travel.mode.toLowerCase()}`}>
                <ItineraryArt name={MOVE_ART[row.travel.mode]} />
                <span className="timeline-move-label">{MODE_LABELS[row.travel.mode]} <b>{row.travel.minutes}분</b></span>
                {row.travel.estimated && (
                  <span className="estimate-badge">예상치</span>
                )}
                {routeUrl ? (
                  <a
                    className="directions-button"
                    href={routeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    길찾기 <span aria-hidden="true">↗</span>
                  </a>
                ) : <span className="directions-unavailable">좌표가 없어 길찾기를 열 수 없어요.</span>}
                {row.travel.mode === "TRANSIT" && <span className="directions-transit-note">열차·환승 안내는 Google 지도에서</span>}
              </div>
              {!readOnly && <button className="timeline-add-inline" type="button" disabled={busy} onClick={() => onAdd?.(day.stops.indexOf(row.to))}>+ 장소</button>}
              </li>
              </Fragment>
            );
          }
          if (row.kind === "gap") {
            return (
              <li key={row.key} className="timeline-gap">
                {row.from}~{row.to} 여유 시간
              </li>
            );
          }
          const { stop } = row;
          const index = day.stops.indexOf(stop);
          return (
            <li key={row.key} className={`timeline-place timeline-stop-card type-${stop.type.toLowerCase()}${selectedOrder === stop.order ? " is-selected" : ""}${dragging === index ? " is-dragging" : ""}`}
              onClick={(event) => { if (!event.target.closest("button, a")) onSelectStop?.(stop); }}
              draggable={canEdit}
              onDragStart={(event) => {
                if (!canEdit) { event.preventDefault(); return; }
                dragIndex.current = index;
                setDragging(index);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(index));
              }}
              onDragOver={(event) => { if (canEdit && dragIndex.current != null) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }}
              onDrop={(event) => {
                event.preventDefault();
                const from = dragIndex.current;
                dragIndex.current = null;
                setDragging(null);
                moveStop(from, index);
              }}
              onDragEnd={() => { dragIndex.current = null; setDragging(null); }}
            >
              <time>{stop.arrival.slice(0, 5)}</time>
              <div className="timeline-stop-surface">
              <div className="timeline-stop-main">
                <PlaceArtwork place={{ ...(stop.type === "ATTRACTION" ? stop.attraction : stop.restaurant), name: stop.name, nameKo: stop.nameKo }} type={stop.type} className="timeline-place-art" />
                <span className="timeline-place-kind">{stop.type === "ATTRACTION" ? "관광지" : stop.type === "LUNCH" ? "점심" : "저녁"}</span>
                <h3><button type="button" className="timeline-stop-select" aria-pressed={selectedOrder === stop.order} onClick={() => onSelectStop?.(stop)}><span className={`timeline-stop-number ${stop.type.toLowerCase()}`}>{String(stop.order).padStart(2, "0")}</span><span className="timeline-name-stack"><strong>{displayName(stop)}</strong>{stop.nameKo && <small>{stop.name}</small>}</span></button></h3>
                <p>{stopSubtitle(stop)}</p>
                <StopReasons reasons={stop.reasons} />
                {stop.warnings?.length > 0 && <ul className="timeline-stop-warnings">{stop.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
              </div>
              <div className="timeline-stop-actions">
                {!readOnly && <div className="timeline-order-actions">
                  <span title="카드를 끌어서 순서 변경" aria-hidden="true">⠿</span>
                  <button type="button" disabled={!canEdit || index === 0} aria-label={`${displayName(stop)} 위로 이동`} onClick={() => moveStop(index, index - 1)}>↑</button>
                  <button type="button" disabled={!canEdit || index === day.stops.length - 1} aria-label={`${displayName(stop)} 아래로 이동`} onClick={() => moveStop(index, index + 1)}>↓</button>
                </div>}
                {onOpenDetail && <button type="button" disabled={busy} onClick={() => onOpenDetail(stop)}>상세 보기 <span aria-hidden="true">›</span></button>}
              </div>
              </div>
            </li>
          );
        })}
        {addButton(day.stops.length)}
      </ol>
      </div>

      <footer className="timeline-summary two">
        <div>
          <ItineraryArt name="duration" />
          <span className="timeline-summary-label">
          <span>총 이동 시간</span>
          <b>{formatMinutes(totalTravelMinutes(day))}</b>
          </span>
        </div>
        <div>
          <ItineraryArt name="pin" />
          <span className="timeline-summary-label">
          <span>방문 장소</span>
          <b>{day.stops.length}곳</b>
          </span>
        </div>
      </footer>
    </section>
  );
}
