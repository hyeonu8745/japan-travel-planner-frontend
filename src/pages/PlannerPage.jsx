import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPreferences } from "../api/chat";
import { getTrip } from "../api/trips";
import { getUser } from "../auth/token";
import Brand from "../components/Brand";
import ChatPanel from "../components/planner/ChatPanel";

const CATEGORY_LABELS = {
  FOOD_PREFER: "좋아하는 음식",
  FOOD_AVOID: "피할 음식",
  ATMOSPHERE: "분위기",
  MOBILITY: "이동",
  SMOKING: "흡연",
  SCHEDULE: "일정",
  ETC: "기타",
};

const STATUS_LABELS = {
  CONDITIONS_SET: "조건 입력 완료",
  PREFERENCE_GATHERING: "취향 대화 중",
  READY_TO_GENERATE: "일정 생성 대기",
  GENERATED: "일정 완성",
  EDITING: "일정 수정 중",
};

function parseDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function tripDays(trip) {
  const start = parseDate(trip.startDate);
  const end = parseDate(trip.endDate);
  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(`${d.getMonth() + 1}월 ${d.getDate()}일`);
  }
  return days;
}

function formatTime(value) {
  return value ? value.slice(0, 5) : "모름";
}

export default function PlannerPage() {
  const { tripId } = useParams();
  const user = getUser();
  const [trip, setTrip] = useState(null);
  const [preference, setPreference] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getTrip(tripId), getPreferences(tripId)])
      .then(([tripData, preferenceData]) => {
        setTrip(tripData);
        setPreference(preferenceData);
      })
      .catch((err) => setError(err.message));
  }, [tripId]);

  // 대화를 한 번 주고받을 때마다: 여행 상태 반영 + 정리본 다시 불러오기
  const handleTurn = (reply) => {
    setTrip((prev) => ({ ...prev, status: reply.tripStatus }));
    getPreferences(tripId)
      .then(setPreference)
      .catch(() => {});
  };

  if (error) {
    return (
      <main style={{ padding: 40 }}>
        <p>{error}</p>
        <Link to="/trips">내 여행으로</Link>
      </main>
    );
  }
  if (!trip || !preference) {
    return (
      <main style={{ padding: 40 }}>
        <p>불러오는 중...</p>
      </main>
    );
  }

  const days = tripDays(trip);
  const constraints = preference.constraints ?? [];

  return (
    <div className="app planner-v2">
      <header className="app-head">
        <Brand />
        <div className="trip">
          <b>{trip.title}</b>
          <span>
            {days[0]} — {days[days.length - 1]} · {STATUS_LABELS[trip.status]}
          </span>
        </div>
        <div className="actions">
          <Link to="/trips">내 여행</Link>
          <i>{user?.nickname?.charAt(0) ?? "?"}</i>
        </div>
      </header>

      <nav className="planner-tools">
        <button type="button" className="active">
          일정
        </button>
      </nav>

      <nav className="days">
        {days.map((label, index) => (
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

      <main className="workspace">
        <section className="map">
          <div className="map-info">
            <span>지도</span>
            <b>일정 생성 후 표시</b>
            <small>숙소에서 출발하는 하루 동선이 이곳에 그려집니다.</small>
          </div>
        </section>

        <section className="detail">
          <header>
            <b>지금까지 파악한 취향</b>
          </header>
          <div className="body">
            {constraints.length === 0 ? (
              <p>AI와 대화하면 여기에 여행 취향이 정리됩니다.</p>
            ) : (
              <div className="tags">
                {constraints.map((c, index) => (
                  <span key={index}>
                    {CATEGORY_LABELS[c.category] ?? c.category} ·{" "}
                    {c.description}
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
                <b>{Math.round((preference.foodBudgetRatio ?? 0.4) * 100)}%</b>
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

        <ChatPanel
          tripId={tripId}
          initialReady={trip.status === "READY_TO_GENERATE"}
          onTurn={handleTurn}
        />
      </main>
    </div>
  );
}
