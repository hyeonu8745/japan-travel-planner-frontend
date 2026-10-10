import { useState } from "react";
import RestaurantDetails from "./RestaurantDetails";
import {
  MODE_LABELS,
  genreLabel,
  holidayLabel,
} from "../../utils/itineraryFormat";

export default function RestaurantCandidates({
  data,
  loading,
  error,
  replacingId,
  onReplace,
  onClose,
  visitDate,
}) {
  const [selected, setSelected] = useState(null);
  const current = data?.candidates?.find((candidate) => candidate.id === selected);
  if (current && !loading) return <section className="detail restaurant-candidates-panel"><div className="body">
    <button type="button" className="back-to-day" onClick={() => setSelected(null)}>← 식당 후보로</button>
    {error && <p className="candidate-state error" role="alert">{error}</p>}
    <RestaurantDetails restaurantId={current.id} fallbackName={current.name} visitDate={visitDate}>
      <button type="button" className="tabi-button tabi-button-primary tabi-button-wide" disabled={replacingId != null} onClick={() => onReplace(current.id)}>{replacingId === current.id ? "교체하는 중..." : "이 식당으로 교체"}</button>
    </RestaurantDetails>
  </div></section>;
  return (
    <section className="detail restaurant-candidates-panel">
      <header>
        <div>
          <small>RESTAURANT CANDIDATES</small>
          <h2>다른 식당 보기</h2>
        </div>

        <button type="button" className="tabi-button candidate-close" aria-label="식당 후보 닫기" onClick={onClose}>
          ×
        </button>
      </header>

      {loading && <p className="candidate-state">후보 식당을 찾고 있어요...</p>}

      {error && <p className="candidate-state error" role="alert">{error}</p>}

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

                {candidate.closedOnVisitDay && (
                  <em className="holiday-badge">이 날 정기 휴일일 수 있어요</em>
                )}
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

              {candidate.holiday && (
                <p className="candidate-holiday">
                  정기 휴일: {holidayLabel(candidate.holiday)}
                </p>
              )}

              <div className="candidate-card-actions">
              <button type="button" className="tabi-button" onClick={() => setSelected(candidate.id)}>상세 보기</button>
              <button
                type="button"
                className="tabi-button tabi-button-primary"
                disabled={replacingId != null}
                onClick={() => onReplace(candidate.id)}
              >
                {replacingId === candidate.id
                  ? "교체하는 중..."
                  : "이 식당으로 교체"}
              </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
