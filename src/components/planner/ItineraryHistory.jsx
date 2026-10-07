const SOURCE_LABELS = {
  GENERATED: "AI 생성",
  EDITED: "일정 수정",
  RESTORED: "이전 버전 복원",
};

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR");
}

export default function ItineraryHistory({
  versions,
  loading,
  error,
  currentVersion,
  previewVersion,
  restoringVersion,
  onPreview,
  onRestore,
  onBackToLatest,
  onClose,
}) {
  return (
    <section className="detail itinerary-history-panel">
      <header>
        <div>
          <small>CHANGE HISTORY</small>
          <h2>변경 이력</h2>
        </div>

        <button type="button" onClick={onClose} aria-label="변경 이력 닫기">
          ×
        </button>
      </header>

      {loading && (
        <p className="candidate-state">변경 이력을 불러오고 있어요...</p>
      )}

      {error && <p className="candidate-state error">{error}</p>}

      {!loading && !error && versions?.length === 0 && (
        <p className="candidate-state">아직 변경 이력이 없어요.</p>
      )}

      {previewVersion != null && (
        <div className="history-preview-notice">
          <b>과거 버전을 보고 있어요.</b>
          <span>이 화면은 보기 전용입니다.</span>

          <button type="button" onClick={onBackToLatest}>
            최신 일정으로 돌아가기
          </button>
        </div>
      )}

      {versions?.length > 0 && (
        <div className="history-list">
          {versions.map((version) => {
            const versionNo = version.versionNo ?? version.version;

            const isCurrent = versionNo === currentVersion;

            const isPreview = versionNo === previewVersion;

            const label =
              version.changeNote ||
              SOURCE_LABELS[version.source] ||
              "일정 변경";

            return (
              <article key={versionNo} className={isPreview ? "active" : ""}>
                <div className="history-version-head">
                  <div>
                    <strong>v{versionNo}</strong>

                    {isCurrent && <span>현재</span>}
                  </div>

                  <small>{formatDateTime(version.createdAt)}</small>
                </div>

                <p>{label}</p>

                <div className="history-actions">
                  {!isCurrent && (
                    <button type="button" onClick={() => onPreview(versionNo)}>
                      이 버전 보기
                    </button>
                  )}

                  {!isCurrent && (
                    <button
                      type="button"
                      className="primary-action"
                      disabled={restoringVersion != null}
                      onClick={() => onRestore(versionNo)}
                    >
                      {restoringVersion === versionNo
                        ? "복원하는 중..."
                        : "이 버전으로 복원"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
