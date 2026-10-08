import { MODE_LABELS } from "../../utils/itineraryFormat";

function shiftLabel(minutes) {
  if (minutes == null || minutes === 0) {
    return "일정 종료 시각 변화 없음";
  }

  if (minutes > 0) {
    return `일정 종료 약 ${minutes}분 늦어짐`;
  }

  return `일정 종료 약 ${Math.abs(minutes)}분 빨라짐`;
}

export default function AttractionCandidates({
  data,
  loading,
  error,
  replacingId,
  onReplace,
  onClose,
  mode = "replace",
}) {
  const adding = mode === "add";
  const title = adding ? "일정에 장소 추가" : data?.night ? "다른 야경 장소 보기" : "다른 관광지 보기";

  return (
    <section className="detail attraction-candidates-panel">
      <header>
        <div>
          <small>ATTRACTION CANDIDATES</small>
          <h2>{title}</h2>
        </div>

        <button type="button" onClick={onClose} aria-label="후보 닫기">
          ×
        </button>
      </header>

      {data?.broadened && (
        <div className="candidate-info">
          같은 지역의 후보가 적어 근처 지역까지 넓혀 찾았어요.
        </div>
      )}

      {loading && (
        <p className="candidate-state">{adding ? "추가할" : "바꿀 수 있는"} 장소를 찾고 있어요...</p>
      )}

      {error && <p className="candidate-state error">{error}</p>}

      {!loading && !error && data?.candidates?.length === 0 && (
        <p className="candidate-state">{adding ? "추가할" : "바꿀 수 있는"} 장소가 없어요.</p>
      )}

      {data?.candidates?.length > 0 && (
        <div className="candidate-list candidate-list-flat">
          {data.candidates.map((candidate) => (
            <article key={candidate.id}>
              <div className="candidate-head">
                <div>
                  <h3>{candidate.name}</h3>

                  <p>{(candidate.labels ?? []).join(" · ") || "관광지"}</p>
                </div>

                <span>★ {candidate.rating ?? "-"}</span>
              </div>

              <div className="candidate-badges">
                {candidate.sameZone === false && <em>인근 지역</em>}

                {candidate.fitsInDay === false && <em>시간이 넘쳐요</em>}
              </div>

              <dl>
                <div>
                  <dt>리뷰</dt>
                  <dd>
                    {candidate.reviewCount != null
                      ? `${candidate.reviewCount.toLocaleString()}개`
                      : "정보 없음"}
                  </dd>
                </div>

                <div>
                  <dt>체류 시간</dt>
                  <dd>
                    {candidate.stayMinutes != null
                      ? `${candidate.stayMinutes}분`
                      : "정보 없음"}
                  </dd>
                </div>

                <div>
                  <dt>앞 장소에서</dt>
                  <dd>
                    {candidate.travel
                      ? `${MODE_LABELS[candidate.travel.mode]} ${
                          candidate.travel.minutes
                        }분`
                      : "정보 없음"}
                  </dd>
                </div>

                <div>
                  <dt>일정 영향</dt>
                  <dd>{shiftLabel(candidate.shiftMinutes)}</dd>
                </div>
              </dl>

              <button
                type="button"
                disabled={replacingId != null}
                onClick={() => onReplace(candidate.id)}
              >
                {replacingId === candidate.id
                  ? adding ? "추가하는 중..." : "교체하는 중..."
                  : adding ? "이 관광지 추가" : data.night
                    ? "이 야경 장소로 교체"
                    : "이 관광지로 교체"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
