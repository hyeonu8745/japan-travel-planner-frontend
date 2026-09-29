import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { getMyTrips } from "../api/trips";
import { clearAuth, getUser } from "../auth/token";
import Brand from "../components/Brand";

const INTEREST_LABELS = {
  FOOD: "현지 음식",
  TRADITIONAL: "전통 명소",
  SHOPPING: "쇼핑",
  NIGHT_VIEW: "야경",
};

const STATUS_LABELS = {
  CONDITIONS_SET: "조건 입력 완료",
  PREFERENCE_GATHERING: "취향 대화 중",
  READY_TO_GENERATE: "일정 생성 대기",
  GENERATED: "일정 완성",
  EDITING: "일정 수정 중",
};

const COMPLETED_STATUSES = ["GENERATED", "EDITING"];

const FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "PLANNING", label: "계획 중" },
  { key: "COMPLETED", label: "완성" },
  { key: "PAST", label: "지난 여행" },
];

/** 오늘 0시 기준 날짜 (시간 차이로 D-day가 흔들리지 않게) */
function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isPast(trip) {
  return parseDate(trip.endDate) < startOfToday();
}

function dDayLabel(trip) {
  const today = startOfToday();
  const start = parseDate(trip.startDate);
  const end = parseDate(trip.endDate);
  if (end < today) return "완료";
  if (start <= today) return "여행 중";
  const days = Math.round((start - today) / 86400000);
  return days === 0 ? "D-DAY" : `D-${days}`;
}

function formatRange(trip) {
  const [sy, sm, sd] = trip.startDate.split("-");
  const [, em, ed] = trip.endDate.split("-");
  return `${sy}.${sm}.${sd} — ${em}.${ed}`;
}

function matchesFilter(trip, filter) {
  if (filter === "ALL") return true;
  if (filter === "PAST") return isPast(trip);
  if (isPast(trip)) return false;
  const completed = COMPLETED_STATUSES.includes(trip.status);
  return filter === "COMPLETED" ? completed : !completed;
}

export default function TripsPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("journeys");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    getMyTrips()
      .then((data) =>
        setTrips(
          [...data].sort((a, b) => a.startDate.localeCompare(b.startDate)),
        ),
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  const upcomingCount = trips.filter((trip) => !isPast(trip)).length;
  const visibleTrips = trips.filter((trip) => matchesFilter(trip, filter));

  return (
    <div className="dashboard">
      <aside className="side">
        <Brand />
        <nav>
          <NavLink to="/trips" end>
            ▦ 내 여행
          </NavLink>
          <Link to="/trips/new">✦ 새 여행 만들기</Link>
          <a
            href="#posters"
            onClick={(e) => {
              e.preventDefault();
              setTab("posters");
            }}
          >
            ▤ 생성된 포스터
          </a>
        </nav>
        <div className="profile">
          <i>{user?.nickname?.charAt(0) ?? "?"}</i>
          <p>
            <b>{user?.nickname} 님</b>
            <span>{user?.email}</span>
          </p>
          <button type="button" onClick={handleLogout} title="로그아웃">
            ⎋
          </button>
        </div>
      </aside>

      <main className="trip-main">
        <header>
          <div>
            <small>MY JOURNEYS</small>
            <h1>내 여행</h1>
            <p>계획 중인 일정과 AI가 만든 여행 포스터를 한곳에서 관리하세요.</p>
          </div>
          <Link className="new-trip" to="/trips/new">
            ＋ 새 여행 만들기
          </Link>
        </header>

        <section className="trip-stats">
          <div>
            <b>{trips.length}</b>
            <span>전체 여행</span>
          </div>
          <div>
            <b>{upcomingCount}</b>
            <span>다가오는 여행</span>
          </div>
          <div>
            <b>0</b>
            <span>생성된 포스터</span>
          </div>
        </section>

        <nav className="content-tabs">
          <button
            type="button"
            className={tab === "journeys" ? "active" : ""}
            onClick={() => setTab("journeys")}
          >
            여행 일정
          </button>
          <button
            type="button"
            className={tab === "posters" ? "active" : ""}
            onClick={() => setTab("posters")}
          >
            생성된 포스터
          </button>
        </nav>

        {tab === "journeys" ? (
          <section className="tab-pane">
            <nav className="filter">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={filter === f.key ? "active" : ""}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </nav>

            {loading && <p>불러오는 중...</p>}
            {error && <p style={{ color: "#d64545" }}>{error}</p>}

            {!loading && !error && (
              <section className="trip-grid">
                {visibleTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
                <Link className="empty-trip" to="/trips/new">
                  <b>＋</b>
                  <h3>새로운 도쿄 여행</h3>
                  <p>도쿄에서 가고 싶은 지역을 AI에게 말해보세요.</p>
                </Link>
              </section>
            )}
          </section>
        ) : (
          <section className="poster-archive tab-pane">
            <header>
              <div>
                <small>AI POSTER ARCHIVE</small>
                <h2>생성된 포스터</h2>
                <p>일정이 완성되면 AI 여행 포스터를 만들 수 있어요.</p>
              </div>
              <span>총 0개</span>
            </header>
            <div className="poster-grid">
              <article className="poster-tile">
                <a
                  href="/assets/sapporo-ai-poster-example.png"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src="/assets/sapporo-ai-poster-example.png"
                    alt="여행 포스터 스타일 예시"
                  />
                </a>
                <div>
                  <span className="status example">스타일 예시</span>
                  <h3>일러스트 포스터 샘플</h3>
                  <p>포스터 스타일 참고용 · 생성 결과 아님</p>
                </div>
              </article>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function TripCard({ trip }) {
  const past = isPast(trip);
  const completed = COMPLETED_STATUSES.includes(trip.status);
  const interests = (trip.interests ?? [])
    .map((i) => INTEREST_LABELS[i])
    .join(" · ");

  return (
    <article className="trip-card">
      <div className="trip-cover tokyo">
        <span>{dDayLabel(trip)}</span>
        <h2>TOKYO</h2>
        <p>{interests || "도쿄 여행"}</p>
      </div>
      <div className="trip-content">
        <div>
          <span className={`status ${past || completed ? "done" : "planning"}`}>
            {past ? "여행 완료" : STATUS_LABELS[trip.status]}
          </span>
        </div>
        <h3>{trip.title}</h3>
        <p>
          {formatRange(trip)} ·{" "}
          {trip.travelers === 1 ? "혼자" : `${trip.travelers}명`}
        </p>
        <footer>
          <Link to={`/trips/${trip.id}/planner`}>
            {completed ? "일정 보기" : "계속 계획하기"}
          </Link>
          {completed && (
            <Link to={`/trips/${trip.id}/poster`}>AI 포스터 생성</Link>
          )}
        </footer>
      </div>
    </article>
  );
}
