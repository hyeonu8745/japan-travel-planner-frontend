import "../../styles/api1012.css";

export default function GeneratingOverlay({ error, onRetry, onClose }) {
  if (error) return <section className="schedule-generating-overlay" aria-live="polite"><div className="schedule-generating-card failed-card"><span className="ai-orbit fail-icon">!</span><small>GENERATION FAILED</small><h2>일정을 만들지 못했어요</h2><p>{error.message}</p><div className="failed-actions">{error.status !== 429 && <button type="button" className="primary-action" onClick={onRetry}>다시 시도</button>}<button type="button" onClick={onClose}>닫기</button></div></div></section>;
  return <section className="schedule-generating-overlay" aria-live="polite" aria-busy="true"><div className="schedule-generating-card"><span className="ai-orbit">✦</span><small>AI ITINERARY GENERATION</small><h2>생성 중…</h2><p>조건에 맞는 장소와 방문 순서, 이동 시간과 설명을 준비하고 있어요.<br/>서버 응답이 올 때까지 조금만 기다려주세요.</p><div className="generation-progress generation-indeterminate" aria-hidden="true"><i/></div><strong>완료되면 준비된 일정을 보여드릴게요.</strong></div></section>;
}
