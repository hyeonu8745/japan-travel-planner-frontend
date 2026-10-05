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
export default function DayTimeline({ day, accommodation, onOpenDetail }) {
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

      {day.warnings.map((warning) => (
        <div key={warning} className="notice-yellow">
          <b>{warning}</b>
        </div>
      ))}
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
          대중교통 시간은 예상치예요. 실제 경로는 &lsquo;경로 보기&rsquo;에서
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

            return (
              <li key={row.key} className="timeline-move">
                {MODE_LABELS[row.travel.mode]} {row.travel.minutes}분
                {row.travel.estimated && (
                  <span className="estimate-badge">예상치</span>
                )}
                {routeFrom && routeFrom.lat != null && row.to.lat != null && (
                  <a
                    href={directionsUrl(routeFrom, row.to, row.travel.mode)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    경로 보기
                  </a>
                )}
              </li>
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
          return (
            <li key={row.key} className="timeline-place">
              <time>{stop.arrival.slice(0, 5)}</time>
              <div>
                <h3>{stop.name}</h3>
                <p>{stopSubtitle(stop)}</p>
              </div>
              {onOpenDetail && (
                <button type="button" onClick={() => onOpenDetail(stop)}>
                  상세 보기
                </button>
              )}
            </li>
          );
        })}
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
