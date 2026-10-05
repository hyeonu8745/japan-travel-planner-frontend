import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { getPreferences } from "../api/chat";

// ✅ 추가:
// 식당 후보 조회 / 식당 교체 API까지 import
import {
  generateItinerary,
  getItinerary,
  getRestaurantCandidates,
  replaceRestaurant,
} from "../api/itinerary";

import { getTrip } from "../api/trips";
import { getUser } from "../auth/token";

import Brand from "../components/Brand";
import ChatPanel from "../components/planner/ChatPanel";
import DayTimeline from "../components/planner/DayTimeline";
import GeneratingOverlay from "../components/planner/GeneratingOverlay";

// ✅ 추가:
// 실제 일정 좌표를 표시하는 지도 컴포넌트
import ItineraryMap from "../components/planner/ItineraryMap";

import PlaceDetail from "../components/planner/PlaceDetail";

// ✅ 추가:
// LUNCH / DINNER 식당 후보 목록 컴포넌트
import RestaurantCandidates from "../components/planner/RestaurantCandidates";

/**
 * 취향 constraint category → 화면 표시 문구
 */
const CATEGORY_LABELS = {
  FOOD_PREFER: "좋아하는 음식",
  FOOD_AVOID: "피할 음식",
  ATMOSPHERE: "분위기",
  MOBILITY: "이동",
  SMOKING: "흡연",
  SCHEDULE: "일정",
  ETC: "기타",
};

/**
 * 여행 상태 → 화면 표시 문구
 */
const STATUS_LABELS = {
  CONDITIONS_SET: "조건 입력 완료",
  PREFERENCE_GATHERING: "취향 대화 중",
  READY_TO_GENERATE: "일정 생성 대기",
  GENERATED: "일정 완성",
  EDITING: "일정 수정 중",
};

/**
 * 일정이 이미 존재하는 여행 상태
 *
 * GENERATED:
 * AI로 일정이 생성된 상태
 *
 * EDITING:
 * 식당 교체 등으로 사용자가 일정을 수정한 상태
 */
const HAS_ITINERARY = ["GENERATED", "EDITING"];

/**
 * YYYY-MM-DD → Date
 */
function parseDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * 여행 시작일 ~ 종료일을
 * ["10월 20일", "10월 21일", ...] 형태로 변환
 */
function tripDays(trip) {
  const start = parseDate(trip.startDate);
  const end = parseDate(trip.endDate);

  const days = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(`${d.getMonth() + 1}월 ${d.getDate()}일`);
  }

  return days;
}

/**
 * 서버의 "09:30:00" 형식을 "09:30"으로 표시
 */
function formatTime(value) {
  return value ? value.slice(0, 5) : "모름";
}

export default function PlannerPage() {
  /**
   * URL
   * /trips/:tripId/planner
   */
  const { tripId } = useParams();

  const location = useLocation();
  const navigate = useNavigate();

  /**
   * 로그인 사용자 정보
   */
  const user = getUser();

  /**
   * 여행 기본 정보
   */
  const [trip, setTrip] = useState(null);

  /**
   * AI가 파악한 취향 정보
   */
  const [preference, setPreference] = useState(null);

  /**
   * 최초 페이지 로딩 오류
   */
  const [error, setError] = useState("");

  /**
   * =========================================================
   * 일정 관련 상태
   * =========================================================
   */

  /**
   * 서버에서 받은 전체 최신 일정
   *
   * 식당을 교체하면 version이 올라가고
   * 모든 stop.id가 새로 생성되기 때문에
   * 일정 일부만 수정하지 않고 전체 응답을 여기에 교체한다.
   */
  const [itinerary, setItinerary] = useState(null);

  /**
   * 우측/중앙에 표시할 플래너 탭
   *
   * plan  = 일정
   * taste = 파악한 취향
   */
  const [panel, setPanel] = useState("plan");

  /**
   * 현재 선택한 DAY의 배열 index
   *
   * itinerary.days[dayIndex]
   */
  const [dayIndex, setDayIndex] = useState(0);

  /**
   * 현재 상세정보를 보고 있는 stop의 order
   *
   * 중요:
   * stop.id로 저장하면 안 된다.
   *
   * 식당 교체 성공 후 서버가 새 일정 version을 만들면서
   * 모든 stops[].id를 새로 발급하기 때문이다.
   *
   * dayNumber + order 조합은 일정 위치를 계속 유지할 수 있다.
   */
  const [selectedOrder, setSelectedOrder] = useState(null);

  /**
   * 일정 생성 상태
   *
   * idle
   * running
   * failed
   */
  const [generation, setGeneration] = useState({
    status: "idle",
    error: null,
  });

  /**
   * GeneratingOverlay를 다시 처음부터 보여주기 위한 key
   */
  const [attempt, setAttempt] = useState(0);

  /**
   * AI 대화에서 사용자가 일정 생성을 원한다고 판단됐는지
   */
  const [wantsGeneration, setWantsGeneration] = useState(false);

  /**
   * 일정 만들기 더블 클릭 방지
   */
  const generatingRef = useRef(false);

  /**
   * =========================================================
   * 식당 후보 / 교체 관련 상태
   * =========================================================
   */

  // ✅ 추가:
  // 식당 후보 패널 상태
  const [candidateState, setCandidateState] = useState({
    open: false,
    loading: false,
    data: null,
    error: "",
  });

  // ✅ 추가:
  // 현재 교체 요청 중인 restaurantId
  //
  // 후보의 여러 버튼을 동시에 누르지 못하게 하기 위해 사용
  const [replacingId, setReplacingId] = useState(null);

  /**
   * 여행 조건 입력 화면에서 넘어온 첫 요청
   *
   * 예:
   * "맛집 위주로 도쿄 여행하고 싶어"
   *
   * 이 값은 ChatPanel에서 첫 AI 메시지로 자동 전송한다.
   */
  const [initialPrompt] = useState(() => location.state?.initialPrompt);

  /**
   * location.state의 initialPrompt는 한 번 사용한 뒤 제거
   *
   * 제거하지 않으면:
   * - 새로고침
   * - 뒤로가기
   *
   * 등에서 같은 첫 메시지가 다시 전송될 수 있다.
   */
  useEffect(() => {
    if (location.state?.initialPrompt) {
      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * =========================================================
   * 최초 여행 + 취향 정보 로딩
   * =========================================================
   */
  useEffect(() => {
    Promise.all([getTrip(tripId), getPreferences(tripId)])
      .then(([tripData, preferenceData]) => {
        setTrip(tripData);
        setPreference(preferenceData);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [tripId]);

  /**
   * =========================================================
   * 이미 일정이 존재하는 여행이면 최신 일정 조회
   * =========================================================
   *
   * GENERATED / EDITING 상태일 때만 조회한다.
   *
   * GET /api/trips/{tripId}/itinerary
   */
  const tripStatus = trip?.status;

  useEffect(() => {
    if (!tripStatus || !HAS_ITINERARY.includes(tripStatus)) {
      return undefined;
    }

    let cancelled = false;

    getItinerary(tripId)
      .then((data) => {
        if (!cancelled) {
          /**
           * 이미 POST 일정 생성 결과가 화면에 있는 경우
           * 불필요하게 다시 덮어쓰지 않는다.
           */
          setItinerary((prev) => prev ?? data);
        }
      })
      .catch(() => {
        /**
         * GET itinerary의
         * "아직 일정이 없습니다" 404는
         * 전체 에러화면으로 보내지 않는다.
         */
      });

    return () => {
      cancelled = true;
    };
  }, [tripId, tripStatus]);

  /**
   * =========================================================
   * AI 대화를 한 번 주고받은 뒤 처리
   * =========================================================
   */
  const handleTurn = (reply) => {
    /**
     * 서버가 알려준 최신 여행 상태 반영
     */
    setTrip((prev) => ({
      ...prev,
      status: reply.tripStatus,
    }));

    /**
     * 사용자가 일정 생성을 원하는지
     */
    setWantsGeneration(reply.userWantsGeneration);

    /**
     * 대화 후 AI가 정리한 취향 다시 조회
     */
    getPreferences(tripId)
      .then(setPreference)
      .catch(() => {});
  };

  /**
   * =========================================================
   * 최신 일정 다시 불러오기
   * =========================================================
   *
   * 식당 후보/교체 API가 409를 반환하면
   * 일정 version이 이미 바뀌었다는 뜻이다.
   *
   * 따라서 옛 stop.id를 버리고
   * 최신 전체 일정을 다시 조회한다.
   */
  const reloadLatestItinerary = async () => {
    const latest = await getItinerary(tripId);

    setItinerary(latest);

    return latest;
  };

  /**
   * =========================================================
   * 일정 생성
   * =========================================================
   *
   * POST /api/trips/{tripId}/itinerary
   *
   * 서버는 약 7초 동안 동기적으로 생성한다.
   */
  const startGeneration = async () => {
    /**
     * 더블 클릭 방지
     */
    if (generatingRef.current) {
      return;
    }

    generatingRef.current = true;

    /**
     * 오버레이 진행 애니메이션을 처음부터 시작
     */
    setAttempt((n) => n + 1);

    setGeneration({
      status: "running",
      error: null,
    });

    try {
      /**
       * 일정 생성
       *
       * 성공 응답은 전체 일정
       */
      const data = await generateItinerary(tripId);

      setItinerary(data);

      /**
       * 생성 성공 시 서버에서도 GENERATED가 되므로
       * 프론트 상태도 즉시 동기화
       */
      setTrip((prev) => ({
        ...prev,
        status: "GENERATED",
      }));

      /**
       * 새 일정은 DAY1부터 보여준다.
       */
      setDayIndex(0);
      setSelectedOrder(null);
      setPanel("plan");

      /**
       * 혹시 열려있던 후보 패널 닫기
       */
      setCandidateState({
        open: false,
        loading: false,
        data: null,
        error: "",
      });

      setGeneration({
        status: "idle",
        error: null,
      });
    } catch (err) {
      /**
       * GeneratingOverlay에서
       * 상태 코드에 따라 에러 UI 표시
       *
       * 400
       * 409
       * 429
       * 503 등
       */
      setGeneration({
        status: "failed",
        error: {
          status: err.status,
          message: err.message,
        },
      });
    } finally {
      generatingRef.current = false;
    }
  };

  /**
   * =========================================================
   * 일정 다시 만들기
   * =========================================================
   *
   * 기존 일정은 삭제되지 않고 version이 +1 된다.
   */
  const handleRegenerate = () => {
    const ok = window.confirm(
      "일정을 다시 만들까요?\n새 버전이 만들어지고 이전 일정은 남아 있어요. 여행당 하루 5번까지 만들 수 있어요.",
    );

    if (ok) {
      startGeneration();
    }
  };

  /**
   * =========================================================
   * DAY 변경
   * =========================================================
   */
  const selectDay = (index) => {
    setDayIndex(index);

    /**
     * 이전 DAY에서 보고 있던 장소 상세 선택 해제
     */
    setSelectedOrder(null);

    /**
     * 식당 후보도 닫는다.
     */
    setCandidateState({
      open: false,
      loading: false,
      data: null,
      error: "",
    });

    setPanel("plan");
  };

  /**
   * =========================================================
   * 식당 후보 조회
   * =========================================================
   *
   * GET
   * /api/trips/{tripId}/itinerary/stops/{stopId}/candidates
   *
   * LUNCH / DINNER에서만 호출한다.
   */
  const openRestaurantCandidates = async (stop) => {
    /**
     * 서버의 최신 응답에는 stop.id가 있어야 한다.
     */
    if (!stop?.id) {
      setCandidateState({
        open: true,
        loading: false,
        data: null,
        error: "식당 항목 ID가 없어 후보를 불러올 수 없어요.",
      });

      return;
    }

    setCandidateState({
      open: true,
      loading: true,
      data: null,
      error: "",
    });

    try {
      const data = await getRestaurantCandidates(tripId, stop.id);

      setCandidateState({
        open: true,
        loading: false,
        data,
        error: "",
      });
    } catch (err) {
      /**
       * 409:
       *
       * 현재 화면의 일정보다 서버에 더 최신 version이 존재한다.
       *
       * 기존 stop.id를 계속 사용하면 다시 409가 나므로
       * 최신 일정 전체를 다시 조회한다.
       */
      if (err.status === 409) {
        try {
          await reloadLatestItinerary();
        } catch {
          // 최신 일정 조회 실패는 아래 메시지로 처리
        }
      }

      setCandidateState({
        open: true,
        loading: false,
        data: null,
        error:
          err.status === 409
            ? "일정이 바뀌었어요. 최신 일정으로 다시 불러왔습니다. 다시 선택해주세요."
            : err.message,
      });
    }
  };

  /**
   * =========================================================
   * 식당 교체
   * =========================================================
   *
   * POST
   * /api/trips/{tripId}/itinerary/stops/{stopId}/replace
   *
   * body:
   * {
   *   restaurantId
   * }
   */
  const handleReplaceRestaurant = async (restaurantId) => {
    /**
     * 현재 선택 DAY
     */
    const day = itinerary?.days?.[dayIndex];

    /**
     * stop.id가 교체마다 바뀌므로
     * selectedOrder를 기준으로 최신 stop을 다시 찾는다.
     */
    const stop = day?.stops?.find((item) => item.order === selectedOrder);

    /**
     * stop이 없거나 이미 교체 중이면 중복 요청하지 않는다.
     */
    if (!stop?.id || replacingId != null) {
      return;
    }

    setReplacingId(restaurantId);

    try {
      /**
       * 성공 응답:
       * 새 version의 전체 일정
       */
      const updated = await replaceRestaurant(tripId, stop.id, restaurantId);

      /**
       * 중요:
       *
       * 교체 후 모든 stops[].id가 새로 발급되기 때문에
       * 기존 itinerary의 일부만 수정하면 안 된다.
       *
       * 서버가 내려준 전체 일정으로 갈아끼운다.
       */
      setItinerary(updated);

      /**
       * 서버에서 식당을 교체하면
       * 여행 상태는 EDITING으로 변경된다.
       */
      setTrip((prev) => ({
        ...prev,
        status: "EDITING",
      }));

      /**
       * selectedOrder는 그대로 유지된다.
       *
       * 예:
       * DAY2 order=3을 보고 있었다면
       * 새 version에서도 DAY2 order=3을 계속 선택한다.
       */

      /**
       * 교체가 끝났으므로 후보 패널 닫기
       */
      setCandidateState({
        open: false,
        loading: false,
        data: null,
        error: "",
      });
    } catch (err) {
      /**
       * 409:
       * 다른 곳에서 일정이 변경됐거나
       * 옛 stop.id를 사용한 상태
       */
      if (err.status === 409) {
        try {
          await reloadLatestItinerary();
        } catch {
          // 아래 에러 메시지 표시
        }

        setCandidateState({
          open: true,
          loading: false,
          data: null,
          error:
            "일정이 바뀌었어요. 최신 일정으로 다시 불러왔습니다. 다시 선택해주세요.",
        });
      } else {
        /**
         * 400 / 401 / 404 등
         */
        setCandidateState((prev) => ({
          ...prev,
          open: true,
          loading: false,
          error: err.message,
        }));
      }
    } finally {
      setReplacingId(null);
    }
  };

  /**
   * =========================================================
   * 초기 오류 화면
   * =========================================================
   */
  if (error) {
    return (
      <main style={{ padding: 40 }}>
        <p>{error}</p>

        <Link to="/trips">내 여행으로</Link>
      </main>
    );
  }

  /**
   * 여행 + 취향 데이터 최초 로딩
   */
  if (!trip || !preference) {
    return (
      <main style={{ padding: 40 }}>
        <p>불러오는 중...</p>
      </main>
    );
  }

  /**
   * =========================================================
   * 렌더링용 데이터 계산
   * =========================================================
   */

  const days = tripDays(trip);

  const constraints = preference.constraints ?? [];

  const hasItinerary = itinerary != null;

  /**
   * 서버는 일정 생성 가능 상태를 검증하지 않으므로
   * 버튼 활성화 여부를 프론트에서 판단한다.
   */
  const canGenerate = trip.status === "READY_TO_GENERATE" || wantsGeneration;

  const generating = generation.status === "running";

  /**
   * 현재 선택된 DAY
   */
  const currentDay = hasItinerary ? itinerary.days[dayIndex] : null;

  /**
   * 선택된 stop
   *
   * stop.id가 아닌 order 기준
   */
  const selectedStop =
    currentDay && selectedOrder != null
      ? currentDay.stops.find((stop) => stop.order === selectedOrder)
      : null;

  /**
   * 현재 stop 다음 장소
   *
   * 상세 정보나 이동 안내에 사용
   */
  const nextStop = selectedStop
    ? (currentDay.stops.find((stop) => stop.order === selectedStop.order + 1) ??
      null)
    : null;

  /**
   * 일정 탭일 때만 timeline 표시
   */
  const showTimeline = hasItinerary && panel === "plan";

  return (
    <div className="app planner-v2">
      {/* =====================================================
          상단 헤더
      ====================================================== */}
      <header className="app-head">
        <Brand />

        <div className="trip">
          <b>{trip.title}</b>

          <span>
            {days[0]} — {days[days.length - 1]}
            {" · "}
            {STATUS_LABELS[trip.status]}
          </span>
        </div>

        <div className="actions">
          <Link to="/trips">내 여행</Link>

          {hasItinerary ? (
            /**
             * 일정이 이미 있으면 새 version 생성
             */
            <button
              type="button"
              disabled={generating}
              onClick={handleRegenerate}
            >
              일정 다시 만들기
            </button>
          ) : (
            /**
             * 아직 일정이 없으면 최초 생성
             */
            <button
              type="button"
              className="finish"
              disabled={!canGenerate || generating}
              onClick={startGeneration}
            >
              일정 만들기
            </button>
          )}

          <i>{user?.nickname?.charAt(0) ?? "?"}</i>
        </div>
      </header>

      {/* =====================================================
          플래너 상단 탭
      ====================================================== */}
      <nav className="planner-tools">
        <button
          type="button"
          className={panel === "plan" ? "active" : ""}
          onClick={() => setPanel("plan")}
        >
          일정
        </button>

        {hasItinerary && (
          <button
            type="button"
            className={panel === "taste" ? "active" : ""}
            onClick={() => setPanel("taste")}
          >
            파악한 취향
          </button>
        )}
      </nav>

      {/* =====================================================
          DAY 선택 탭
      ====================================================== */}
      <nav className="days">
        {hasItinerary
          ? itinerary.days.map((day, index) => (
              <button
                key={day.dayNumber}
                type="button"
                className={index === dayIndex ? "active" : ""}
                onClick={() => selectDay(index)}
              >
                DAY {day.dayNumber}
                <span>{day.zoneLabel}</span>
              </button>
            ))
          : days.map((label, index) => (
              <button
                key={label}
                type="button"
                className={index === 0 ? "active" : ""}
                disabled
              >
                DAY {index + 1}
                <span>{label}</span>
              </button>
            ))}
      </nav>

      {/* =====================================================
          메인 플래너
          지도 / 일정 상세 / AI 채팅
      ====================================================== */}
      <main className="workspace">
        {/* ===================================================
            왼쪽 지도

            서버 일정의:
            accommodation.lat/lng
            stops[].lat/lng

            를 사용한다.

            실제 도로 polyline 데이터는 서버에 없으므로
            현재는 좌표끼리 직선으로 연결한다.
        ==================================================== */}
        <ItineraryMap
          accommodation={itinerary?.accommodation}
          day={currentDay}
          selectedOrder={selectedOrder}
          onSelectStop={(order) => {
            /**
             * 지도 핀 클릭 →
             * 해당 stop 상세정보 열기
             */
            setSelectedOrder(order);

            /**
             * 다른 식당 후보 패널이 열려있으면 닫는다.
             */
            setCandidateState({
              open: false,
              loading: false,
              data: null,
              error: "",
            });

            setPanel("plan");
          }}
        />

        {/* ===================================================
            중앙 일정 / 상세 / 후보 영역
        ==================================================== */}
        {showTimeline ? (
          selectedStop ? (
            /**
             * 현재 장소를 선택한 상태
             */
            candidateState.open ? (
              /**
               * 식당 후보 목록
               */
              <RestaurantCandidates
                data={candidateState.data}
                loading={candidateState.loading}
                error={candidateState.error}
                replacingId={replacingId}
                onReplace={handleReplaceRestaurant}
                onClose={() =>
                  setCandidateState({
                    open: false,
                    loading: false,
                    data: null,
                    error: "",
                  })
                }
              />
            ) : (
              /**
               * 장소 상세정보
               */
              <PlaceDetail
                stop={selectedStop}
                nextStop={nextStop}
                onBack={() => {
                  setSelectedOrder(null);

                  setCandidateState({
                    open: false,
                    loading: false,
                    data: null,
                    error: "",
                  });
                }}
                /**
                 * LUNCH / DINNER에서
                 * "다른 식당 보기"를 누르면 실행
                 */
                onOpenCandidates={() => openRestaurantCandidates(selectedStop)}
                /**
                 * alternatives[0] 등의
                 * 이전 식당으로 되돌리기
                 */
                onReplaceAlternative={handleReplaceRestaurant}
                replacingId={replacingId}
              />
            )
          ) : (
            /**
             * 아무 장소도 선택하지 않은 상태 →
             * DAY 전체 timeline
             */
            <DayTimeline
              key={currentDay.dayNumber}
              day={currentDay}
              /**
               * 첫 번째 stop의 경로보기는
               * accommodation을 출발지로 사용
               */
              accommodation={itinerary?.accommodation}
              onOpenDetail={(stop) => {
                setSelectedOrder(stop.order);

                setCandidateState({
                  open: false,
                  loading: false,
                  data: null,
                  error: "",
                });
              }}
            />
          )
        ) : (
          /**
           * ===================================================
           * 파악한 취향 탭
           * ===================================================
           */
          <section className="detail">
            <header>
              <b>지금까지 파악한 취향</b>
            </header>

            <div className="body">
              {constraints.length === 0 ? (
                <p>AI와 대화하면 여기에 여행 취향이 정리됩니다.</p>
              ) : (
                <div className="tags">
                  {constraints.map((constraint, index) => (
                    <span key={index}>
                      {CATEGORY_LABELS[constraint.category] ??
                        constraint.category}
                      {" · "}
                      {constraint.description}
                    </span>
                  ))}
                </div>
              )}

              <div className="facts">
                <p>
                  <span>첫날 도착</span>

                  <b>{formatTime(preference.arrivalTime)}</b>
                </p>

                <p>
                  <span>마지막 날 출발</span>

                  <b>{formatTime(preference.departureTime)}</b>
                </p>

                <p>
                  <span>식비 비중</span>

                  <b>
                    {Math.round((preference.foodBudgetRatio ?? 0.4) * 100)}%
                  </b>
                </p>
              </div>

              {preference.summary && <p>{preference.summary}</p>}

              <div className="conflict-note">
                <b>안내</b>

                <span>
                  일정은 대화가 끝난 뒤 실제 식당·관광지 데이터로 만들어집니다.
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================
            우측 AI 채팅
        ==================================================== */}
        <ChatPanel
          tripId={tripId}
          initialPrompt={initialPrompt}
          initialReady={trip.status === "READY_TO_GENERATE"}
          /**
           * 일정 생성 후 또는 EDITING 상태에서는
           * 서버가 취향 채팅 POST를 409 처리하므로
           * 프론트에서도 입력을 잠근다.
           */
          locked={hasItinerary || HAS_ITINERARY.includes(trip.status)}
          onTurn={handleTurn}
          onGenerate={startGeneration}
        />
      </main>

      {/* =====================================================
          일정 생성 로딩 / 실패 오버레이
      ====================================================== */}
      {generation.status !== "idle" && (
        <GeneratingOverlay
          key={attempt}
          error={generation.error}
          onRetry={startGeneration}
          onClose={() =>
            setGeneration({
              status: "idle",
              error: null,
            })
          }
        />
      )}
    </div>
  );
}
