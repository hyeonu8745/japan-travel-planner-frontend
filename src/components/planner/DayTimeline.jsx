import { Fragment, useRef, useState } from "react";
import {
  MODE_LABELS,
  buildRows,
  directionsUrl,
  formatLongDate,
  formatMinutes,
  stopSubtitle,
  totalTravelMinutes,
} from "../../utils/itineraryFormat";

const REGION_IMAGES = {
  ASAKUSA_UENO: "region-asakusa-ueno.png",
  GINZA_TOKYO: "region-ginza-tokyo-station.png",
  AKIHABARA_KANDA: "region-akihabara-kanda.png",
  SHINJUKU: "region-shinjuku.png",
  SHIBUYA_HARAJUKU: "region-shibuya-harajuku.png",
  ROPPONGI_TOWER: "region-roppongi-tokyo-tower.png",
  ODAIBA: "region-odaiba.png",
};

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
    <li className="timeline-insert"><button type="button" disabled={busy} onClick={() => onAdd?.(position)}>+ 장소 넣기</button></li>
  );
  const rows = buildRows(day);
  const hasTransit = day.stops.some((stop) => stop.travel.mode === "TRANSIT");
  const image = REGION_IMAGES[day.zone];

  return (
    <section className="detail day-timeline">
      <div className="region-day-cover">
        {image && (
          <img src={`/assets/${image}`} alt={`${day.zoneLabel} 수채화 풍경`} />
        )}
        <div>
          <h2>
            DAY {day.dayNumber} · {day.zoneLabel}
          </h2>
          <p>{formatLongDate(day.date)}</p>
        </div>
      </div>

      <header className="timeline-head">
        {day.description ? (
          <p>{day.description}</p>
        ) : (
          <p className="description-empty">식당 변경이 반영된 일정입니다.</p>
        )}
      </header>

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
                {d.name} · {d.reasonLabel}
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
              <li key={row.key} className="timeline-place">
                <time>{row.time}</time>
                <div>
                  <h3>숙소 출발</h3>
                  <p>출발점</p>
                </div>
              </li>
            );
          }
          if (row.kind === "move") {
            const routeFrom = row.from ?? accommodation;
            const routeUrl = directionsUrl(routeFrom, row.to, row.travel.mode);

            return (
              <Fragment key={row.key}>
              {addButton(day.stops.indexOf(row.to))}
              <li className="timeline-move">
                {MODE_LABELS[row.travel.mode]} {row.travel.minutes}분
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
                    길찾기
                  </a>
                ) : <span className="directions-unavailable">좌표가 없어 길찾기를 열 수 없어요.</span>}
                {row.travel.mode === "TRANSIT" && <span className="directions-transit-note">열차·환승 안내는 Google 지도에서</span>}
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
            <li key={row.key} className={`timeline-place timeline-stop-card${selectedOrder === stop.order ? " is-selected" : ""}${dragging === index ? " is-dragging" : ""}`}
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
              <div>
                <h3><button type="button" className="timeline-stop-select" aria-pressed={selectedOrder === stop.order} onClick={() => onSelectStop?.(stop)}><span className={`timeline-stop-number ${stop.type.toLowerCase()}`}>{stop.order}</span><span>{stop.name}</span></button></h3>
                <p>{stopSubtitle(stop)}</p>
              </div>
              <div className="timeline-stop-actions">
                {!readOnly && <div className="timeline-order-actions">
                  <span title="카드를 끌어서 순서 변경" aria-hidden="true">⠿</span>
                  <button type="button" disabled={!canEdit || index === 0} aria-label={`${stop.name} 위로 이동`} onClick={() => moveStop(index, index - 1)}>↑</button>
                  <button type="button" disabled={!canEdit || index === day.stops.length - 1} aria-label={`${stop.name} 아래로 이동`} onClick={() => moveStop(index, index + 1)}>↓</button>
                </div>}
                {onOpenDetail && <button type="button" disabled={busy} onClick={() => onOpenDetail(stop)}>상세 보기</button>}
              </div>
            </li>
          );
        })}
        {addButton(day.stops.length)}
      </ol>

      <footer className="timeline-summary two">
        <div>
          <span>총 이동 시간</span>
          <b>{formatMinutes(totalTravelMinutes(day))}</b>
        </div>
        <div>
          <span>방문 장소</span>
          <b>{day.stops.length}곳</b>
        </div>
      </footer>
    </section>
  );
}
