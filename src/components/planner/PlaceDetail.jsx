import { useState } from "react";
import { useToast } from "../toastContext";
import AttractionDetails from "./AttractionDetails";
import RestaurantDetails from "./RestaurantDetails";
import StopReasons from "./StopReasons";
import DetailArt from "./DetailArt";
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
    <section className="detail-schedule-info" aria-label="방문 일정">
        <h3><DetailArt name="calendar" />방문 일정</h3>
        <div className="place-facts">
          <div>
            <DetailArt name="clock" />
            <span>도착 예정 시간</span>
            <b>{hhmm(stop.arrival)}</b>
          </div>
          <div>
            <DetailArt name="clock" />
            <span>체류 시간</span>
            <b>{stop.stayMinutes}분</b>
          </div>
          <div>
            <DetailArt name={nextStop?.travel.mode || "pin"} />
            <span>다음 장소까지</span>
            <b>
              {nextStop
                ? `${MODE_LABELS[nextStop.travel.mode]} ${nextStop.travel.minutes}분`
                : "마지막 일정"}
            </b>
          </div>
        </div>

        {warnings.length > 0 && <div className="notice-yellow" role="status"><b><DetailArt name="warning" />일정 안내</b><ul>{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}

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
        <div className="detail-edit-toolbar">
        {isMeal && !readOnly && (
          <div className="restaurant-edit-actions">
            <button
              type="button"
              className="primary-action"
              onClick={onOpenCandidates}
              disabled={busy}
            >
              다른 식당 보기 ↗
            </button>

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
              다른 관광지 보기 ↗
            </button>
          </div>
        )}

        {!readOnly && <div className="restaurant-edit-actions">
          <button type="button" className="danger-action" disabled={busy || !canDelete} onClick={onDelete}>일정에서 삭제</button>
          {!canDelete && <small>하루의 마지막 1개 항목은 삭제할 수 없어요.</small>}
        </div>}
        </div>
        {isMeal && !readOnly && stop.alternatives?.[0] && <button className="detail-restore" type="button" disabled={busy || replacingId != null} onClick={() => onReplaceAlternative(stop.alternatives[0].id)}>↩ {stop.alternatives[0].name}으로 되돌리기</button>}
        {isMeal && stop.alternatives?.length > 0 && <section className="restaurant-alternative-details"><h4>이전 식당 후보</h4>{stop.alternatives.map((candidate) => <button type="button" key={candidate.id} onClick={() => setAlternativeDetail({ stopId: stop.id, candidate })}><DetailArt name="food" /><span>{candidate.name}<small>상세 보기</small></span><b aria-hidden="true">›</b></button>)}</section>}
    </section>
  );

  if (isMeal && alternativeDetail?.stopId === stop.id) return <section className="detail place-detail-v3 planner-redesign detail-art">
    <header className="place-detail-navigation"><button type="button" className="back-to-day" onClick={() => setAlternativeDetail(null)}>← 현재 식당으로</button><b>이전 식당 후보</b></header>
    <div className="body">
      <RestaurantDetails restaurantId={alternativeDetail.candidate.id} fallbackName={alternativeDetail.candidate.name} visitDate={visitDate} readOnly={readOnly}>
        {!readOnly && <button type="button" className="tabi-button tabi-button-primary tabi-button-wide" disabled={busy || replacingId != null} onClick={() => { setAlternativeDetail(null); onReplaceAlternative(alternativeDetail.candidate.id); }}>이 식당으로 교체</button>}
      </RestaurantDetails>
    </div>
  </section>;

  const heading = (details) => {
    const title = details?.localizedName || stop.name;
    const originalName = details?.restaurant?.name || details?.name || stop.name;
    const address = details?.restaurant?.address || place.address;
    return <div className="detail-place-heading">
      <h1>{title}</h1>
      {originalName !== title && <p className="detail-japanese-name">{originalName}</p>}
      {address && <p className="detail-address"><DetailArt name="pin" />{address}</p>}
      <p className="detail-category">{category}</p>
      <StopReasons reasons={stop.reasons} />
    </div>;
  };
  return (
    <section className="detail place-detail-v3 planner-redesign detail-art">
      <header className="place-detail-navigation">
        <button type="button" className="back-to-day" onClick={onBack}>← 하루 일정으로</button>
        <div className="place-detail-category"><DetailArt name={isMeal ? "food" : "pin"} /><b>{category}</b>
        <span className="place-kind">{KIND_LABELS[stop.type]} · {hhmm(stop.arrival)} 방문</span>
        </div>
      </header>


      <div className="body">
        {isMeal ? <RestaurantDetails key={stop.id} restaurantId={place.id} fallbackName={stop.name} visitDate={visitDate} heading={heading} onReplace={onOpenCandidates} readOnly={readOnly} busy={busy}>
          {scheduleInfo}
        </RestaurantDetails> : (
          <AttractionDetails key={stop.id} attractionId={place.id} fallbackName={stop.name} visitDate={visitDate} heading={heading}>
            {scheduleInfo}
          </AttractionDetails>
        )}
        <p className="detail-data-note">영업시간·입장료는 Google Maps와 공식 사이트에서 확인하세요.</p>
      </div>
        <footer className="detail-footer"><span className="google-attribution">Google Maps</span><div className="place-actions">
          <button type="button" onClick={() => copy(stop.name, "일본어 이름")}>
            <span aria-hidden="true">⧉</span> 일본어 이름 복사
          </button>
          {place.address && (
            <button type="button" onClick={() => copy(place.address, "주소")}>
              <DetailArt name="pin" /> 주소 복사
            </button>
          )}
          <a
            href={mapsSearchUrl(stop.name)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DetailArt name="pin" /> Google 지도에서 보기 ↗
          </a>
        </div></footer>
    </section>
  );
}
