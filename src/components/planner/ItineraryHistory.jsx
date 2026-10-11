import PanelIcon from "./PanelIcon";

const SOURCE_LABELS = { GENERATED: "AI 생성", EDITED: "일정 수정", RESTORED: "이전 버전 복원" };

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ItineraryHistory({ versions, loading, error, currentVersion, previewVersion, restoringVersion, onPreview, onRestore, onBackToLatest, onClose }) {
  const items = [...(versions ?? [])].sort((a, b) => Number(b.versionNo ?? b.version) - Number(a.versionNo ?? a.version));
  return <section className="detail itinerary-history-panel premium-history" aria-label="변경 이력">
    <header>
      <div><small>CHANGE HISTORY</small><h2>변경 이력</h2><p>일정이 바뀐 순간을 모아봤어요.</p></div>
      <PanelIcon name="history" className="history-header-art"/>
      <button type="button" onClick={onClose} aria-label="변경 이력 닫기">×</button>
    </header>
    {currentVersion != null && <div className="version-current-summary"><PanelIcon name="check"/><div><b>현재 일정 · v{currentVersion}</b><span>저장된 최신 일정이에요.</span></div></div>}
    {loading && <p className="candidate-state" role="status">변경 이력을 불러오고 있어요...</p>}
    {error && <p className="candidate-state error" role="alert">{error}</p>}
    {!loading && !error && !items.length && <div className="version-empty"><PanelIcon name="history"/><b>아직 변경 이력이 없어요.</b><p>일정을 수정하면 이전 버전이 여기에 남아요.</p></div>}
    {previewVersion != null && <div className="history-preview-notice"><b>v{previewVersion} 과거 버전을 보고 있어요.</b><span>이 화면은 보기 전용입니다.</span><button type="button" onClick={onBackToLatest}>최신 일정으로 돌아가기</button></div>}
    {!loading && !error && items.length > 0 && <div className="version-timeline">
      {items.map(version => {
        const number = version.versionNo ?? version.version;
        const current = number === currentVersion, preview = number === previewVersion;
        const label = version.changeNote || SOURCE_LABELS[version.source] || "일정 변경";
        return <article key={number} className={`version-entry${current ? " is-current" : ""}${preview ? " is-preview" : ""}`} aria-label={`v${number}${current ? " 현재 일정" : ""}`}>
          <div className="version-entry-head"><strong>v{number}</strong>{current && <span>현재</span>}{preview && <span>보는 중</span>}</div>
          <time dateTime={version.createdAt || undefined}>{formatDateTime(version.createdAt)}</time>
          <p>{label}</p>
          <div className="version-entry-bottom"><span className="version-source">{SOURCE_LABELS[version.source] || "일정 변경"}</span>
            {!current && <div className="version-entry-actions">
              <button type="button" onClick={() => onPreview(number)} disabled={restoringVersion != null} aria-pressed={preview}>이 버전 보기</button>
              <button type="button" className="version-restore" disabled={restoringVersion != null} onClick={() => onRestore(number)}>{restoringVersion === number ? "복원하는 중..." : "이 버전으로 복원"}</button>
            </div>}
          </div>
        </article>;
      })}
    </div>}
    {!loading && !error && items.length > 0 && <p className="version-help"><PanelIcon name="info"/>이전 일정은 보기로 확인한 뒤 복원할 수 있어요.</p>}
  </section>;
}
