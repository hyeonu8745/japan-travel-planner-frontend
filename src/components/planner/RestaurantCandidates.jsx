import { MODE_LABELS, genreLabel } from "../../utils/itineraryFormat";

export default function RestaurantCandidates({
  data,
  loading,
  error,
  replacingId,
  onReplace,
  onClose,
}) {
  return (
    <section className="detail restaurant-candidates-panel">
      <header>
        <div>
          <small>RESTAURANT CANDIDATES</small>
          <h2>다른 식당 보기</h2>
        </div>

        <button type="button" onClick={onClose}>
          ×
        </button>
      </header>

      {loading && <p className="candidate-state">후보 식당을 찾고 있어요...</p>}

      {error && <p className="candidate-state error">{error}</p>}

      {!loading && !error && data?.candidates?.length === 0 && (
        <p className="candidate-state">조건에 맞는 다른 식당이 없어요.</p>
      )}

      {data?.candidates?.length > 0 && (
        <div className="candidate-list candidate-list-flat">
          {data.candidates.map((candidate) => (
            <article key={candidate.id}>
              <div>
                <div>
                  <h3>{candidate.name}</h3>
                  <p>{genreLabel(candidate.genre)}</p>
                </div>

                <span>★ {candidate.rating ?? "-"}</span>
              </div>

              <div className="candidate-badges">
                {candidate.genreRepeated && <em>앞 끼니와 같은 음식</em>}
                {candidate.budgetRelaxed && <em>예산을 조금 넘어요</em>}
              </div>

              <dl>
                <div>
                  <dt>리뷰</dt>
                  <dd>
                    {candidate.reviewCount?.toLocaleString?.() ??
                      candidate.reviewCount ??
                      "-"}
                    개
                  </dd>
                </div>

                <div>
                  <dt>예산</dt>
                  <dd>{candidate.budget || "정보 없음"}</dd>
                </div>

                <div>
                  <dt>가까운 역</dt>
                  <dd>{candidate.nearestStation || "정보 없음"}</dd>
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
              </dl>

              <button
                type="button"
                disabled={replacingId != null}
                onClick={() => onReplace(candidate.id)}
              >
                {replacingId === candidate.id
                  ? "교체하는 중..."
                  : "이 식당으로 교체"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
