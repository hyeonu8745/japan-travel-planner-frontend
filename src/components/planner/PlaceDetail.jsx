import { useState } from "react";
import { useToast } from "../toastContext";
import AttractionDetails from "./AttractionDetails";
import RestaurantDetails from "./RestaurantDetails";
import {
  MODE_LABELS,
  genreLabel,
  hhmm,
  mapsSearchUrl,
  holidayLabel,
} from "../../utils/itineraryFormat";

const KIND_LABELS = { ATTRACTION: "관광지", LUNCH: "점심", DINNER: "저녁" };

/**
 * 장소 상세 (가운데 칸). 타임라인에서 "상세 보기"를 누르면 열린다.
 * - 관광지는 상세 화면을 열 때 Google 상세 API를 조회한다.
 * - nextStop: 다음 장소까지의 이동 (마지막 일정이면 null)
 */
export default function PlaceDetail({
  stop,
  nextStop,
  onBack,
  onOpenCandidates,
  onReplaceAlternative,
  replacingId,
  onOpenAttractionCandidates,
  readOnly = false,
  busy = false,
  canDelete = true,
  onDelete,
  warnings = [],
  visitDate,
}) {
  const showToast = useToast();
  const [alternativeDetail, setAlternativeDetail] = useState(null);
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

  const scheduleInfo = (
    <>
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

        {warnings.length > 0 && <div className="notice-yellow" role="status"><b>⚠ 일정 안내</b><ul>{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}

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
        {isMeal && (place.holiday || place.closedOnVisitDay) && (
          <div className="data-notice">
            {place.holiday && (
              <>
                정기 휴일: <b>{holidayLabel(place.holiday)}</b>
              </>
            )}
            {place.closedOnVisitDay && (
              <>
                {place.holiday && <br />}
                <b className="holiday-danger">⚠ 이 날 정기 휴일일 수 있어요.</b>
              </>
            )}
            <br />
            타베로그 등록 정보 기준이며 임시 휴무·공휴일은 반영되지 않을 수
            있어요.
          </div>
        )}

        {/* 식당 변경 / 되돌리기 */}
        {isMeal && !readOnly && (
          <div className="restaurant-edit-actions">
            <button
              type="button"
              className="primary-action"
              onClick={onOpenCandidates}
              disabled={busy}
            >
              교체 · 다른 식당 보기
            </button>

            {stop.alternatives?.[0] && (
              <button
                type="button"
                disabled={busy || replacingId != null}
                onClick={() => onReplaceAlternative(stop.alternatives[0].id)}
              >
                ↩ {stop.alternatives[0].name}으로 되돌리기
              </button>
            )}
          </div>
        )}

        {!isMeal && !readOnly && (
          <div className="restaurant-edit-actions">
            <button
              type="button"
              className="primary-action"
              onClick={onOpenAttractionCandidates}
              disabled={busy}
            >
              교체 · 다른 관광지 보기
            </button>
          </div>
        )}

        {!readOnly && <div className="restaurant-edit-actions">
          <button type="button" className="danger-action" disabled={busy || !canDelete} onClick={onDelete}>삭제</button>
          {!canDelete && <small>하루의 마지막 1개 항목은 삭제할 수 없어요.</small>}
        </div>}
    </>
  );

  if (isMeal && alternativeDetail?.stopId === stop.id) return <section className="detail place-detail-v3">
    <div className="body"><button type="button" className="back-to-day" onClick={() => setAlternativeDetail(null)}>← 현재 식당으로</button>
      <RestaurantDetails restaurantId={alternativeDetail.candidate.id} fallbackName={alternativeDetail.candidate.name} visitDate={visitDate} readOnly={readOnly}>
        {!readOnly && <button type="button" className="tabi-button tabi-button-primary tabi-button-wide" disabled={busy || replacingId != null} onClick={() => { setAlternativeDetail(null); onReplaceAlternative(alternativeDetail.candidate.id); }}>이 식당으로 교체</button>}
      </RestaurantDetails>
    </div>
  </section>;

  return (
    <section className="detail place-detail-v3">
      <header>
        <b>{category}</b>
        <span className="place-kind">{KIND_LABELS[stop.type]}{!isMeal && ` · 방문 ${hhmm(stop.arrival)}`}</span>
      </header>


      <div className="body">
        <button type="button" className="back-to-day" onClick={onBack}>
          ← 하루 일정으로
        </button>

        <div className="title">
          <div>
            <h1>{stop.name}</h1>
            <p>{place.address}</p>
          </div>
        </div>


        {isMeal ? <RestaurantDetails key={stop.id} restaurantId={place.id} fallbackName={stop.name} visitDate={visitDate} onReplace={onOpenCandidates} readOnly={readOnly} busy={busy}>
          {scheduleInfo}
        </RestaurantDetails> : (
          <AttractionDetails key={stop.id} attractionId={place.id} fallbackName={stop.name} visitDate={visitDate}>
            {scheduleInfo}
          </AttractionDetails>
        )}
        {isMeal && stop.alternatives?.length > 0 && <section className="restaurant-alternative-details"><h3>이전 식당 후보</h3>{stop.alternatives.map((candidate) => <button type="button" key={candidate.id} onClick={() => setAlternativeDetail({ stopId: stop.id, candidate })}>{candidate.name} · 상세 보기</button>)}</section>}

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
