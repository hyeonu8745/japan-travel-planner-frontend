import { useToast } from "../toastContext";
import {
  MODE_LABELS,
  genreLabel,
  hhmm,
  mapsSearchUrl,
} from "../../utils/itineraryFormat";

const KIND_LABELS = { ATTRACTION: "관광지", LUNCH: "점심", DINNER: "저녁" };

/**
 * 장소 상세 (가운데 칸). 타임라인에서 "상세 보기"를 누르면 열린다.
 * - 영업시간·입장료는 우리가 알 수 없으므로 단정하지 않고 Google 지도 확인을 안내한다
 * - nextStop: 다음 장소까지의 이동 (마지막 일정이면 null)
 */
export default function PlaceDetail({
  stop,
  nextStop,
  onBack,
  onOpenCandidates,
  onReplaceAlternative,
  replacingId,
}) {
  const showToast = useToast();
  const isMeal = stop.type !== "ATTRACTION";
  const place = isMeal ? stop.restaurant : stop.attraction;

  const copy = (text, label) => {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast(`${label}을(를) 복사했어요`))
      .catch(() => showToast("복사하지 못했어요"));
  };

  const category = isMeal
    ? `${KIND_LABELS[stop.type]} · ${genreLabel(place.genre) || "식당"}`
    : `관광지 · ${(place.labels ?? []).slice(0, 2).join(", ") || "명소"}`;

  return (
    <section className="detail place-detail-v3">
      <header>
        <b>{category}</b>
        <span className="place-kind">{KIND_LABELS[stop.type]}</span>
      </header>

      <div className="visual">
        <strong>{isMeal ? "食" : "観"}</strong>
        <small>
          방문 예정 · <b>{hhmm(stop.arrival)}</b>
        </small>
      </div>

      <div className="body">
        <button type="button" className="back-to-day" onClick={onBack}>
          ← 하루 일정으로
        </button>

        <div className="title">
          <div>
            <h1>{stop.name}</h1>
            <p>{place.address}</p>
          </div>
          {place.rating != null && <strong>★ {place.rating}</strong>}
        </div>

        <p className="review-count">
          {isMeal
            ? `타베로그 평점${place.budget ? ` · 예산 ${place.budget}` : ""}`
            : place.reviewCount != null
              ? `Google 리뷰 ${place.reviewCount.toLocaleString()}개`
              : ""}
        </p>

        <div className="place-facts">
          <div>
            <span>체류 시간</span>
            <b>{stop.stayMinutes}분</b>
          </div>
          <div>
            <span>다음 장소까지</span>
            <b>
              {nextStop
                ? `${MODE_LABELS[nextStop.travel.mode]} ${nextStop.travel.minutes}분`
                : "마지막 일정"}
            </b>
          </div>
        </div>

        {isMeal && place.budgetRelaxed && (
          <div className="notice-yellow">
            <b>예산 안에서 찾기 어려워 조금 높은 곳으로 골랐어요.</b>
          </div>
        )}
        {isMeal && place.genreRepeated && (
          <div className="notice-yellow">
            <b>앞 식사와 비슷한 음식이에요.</b>
          </div>
        )}

        {/* 식당 정기 휴일 안내 */}
        {isMeal && place.holiday && (
          <div className="data-notice">
            정기 휴일: <b>{place.holiday}</b>
            <br />
            타베로그 등록 정보 기준이며 임시 휴무는 반영되지 않을 수 있어요.
          </div>
        )}

        {/* 식당 변경 / 되돌리기 */}
        {isMeal && (
          <div className="restaurant-edit-actions">
            <button
              type="button"
              className="primary-action"
              onClick={onOpenCandidates}
            >
              다른 식당 보기
            </button>

            {stop.alternatives?.[0] && (
              <button
                type="button"
                disabled={replacingId != null}
                onClick={() => onReplaceAlternative(stop.alternatives[0].id)}
              >
                ↩ {stop.alternatives[0].name}으로 되돌리기
              </button>
            )}
          </div>
        )}

        <div className="place-actions"></div>

        <div className="place-actions">
          <button type="button" onClick={() => copy(stop.name, "일본어 이름")}>
            일본어 이름 복사
          </button>
          {place.address && (
            <button type="button" onClick={() => copy(place.address, "주소")}>
              주소 복사
            </button>
          )}
          <a
            href={mapsSearchUrl(stop.name)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Maps에서 확인
          </a>
        </div>

        <div className="data-notice">
          영업시간·입장료는 Google Maps와 공식 사이트에서 확인하세요
        </div>
      </div>
    </section>
  );
}
