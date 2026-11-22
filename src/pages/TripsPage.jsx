import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyTrips, deleteTrip } from "../api/trips";
import { DELETE_TRIP_MESSAGE } from "../utils/tripEditing";
import { getUser } from "../auth/token";
import PosterArchive from "../components/PosterArchive";
import { HAS_ITINERARY, STATUS_LABELS } from "../utils/tripStatus";
import PublicHeader from "../components/PublicHeader";
import "../styles/accountPostcards.css";

const INTEREST_LABELS = {
  FOOD: "현지 음식",
  TRADITIONAL: "전통 명소",
  SHOPPING: "쇼핑",
  NIGHT_VIEW: "야경",
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
  const [deletingId, setDeletingId] = useState(null);
  const deletingRef = useRef(false);

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

  const handleDelete = async (id) => {
    if (deletingRef.current || !window.confirm(DELETE_TRIP_MESSAGE)) return;
    deletingRef.current = true;
    setDeletingId(id);
    try {
      await deleteTrip(id);
      setTrips((previous) => previous.filter((trip) => trip.id !== id));
      setError("");
      navigate("/trips", { replace: true });
    } catch (err) { setError(err.message); }
    finally { deletingRef.current = false; setDeletingId(null); }
  };

  const upcomingCount = trips.filter((trip) => !isPast(trip)).length;
  const visibleTrips = trips.filter((trip) => matchesFilter(trip, filter));

  return (
    <div className="account-paper">
      <PublicHeader />
      <main className="trip-main journey-shelf">
        <header className="shelf-cover">
          <div>
            <h1>내 여행</h1>
            <p>{user?.nickname ? user.nickname + "님의 " : ""}여행 일정과 포스터를 모아봤어요.</p>
            {user?.email && <small>{user.email}</small>}
          </div>
          <img src="/assets/postcards/japan-postcards.jpg" alt="" />
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
            <b>{trips.filter((trip) => HAS_ITINERARY.includes(trip.status)).length}</b>
            <span>포스터를 만들 수 있는 여행</span>
          </div>
        </section>

        <nav className="content-tabs">
          <button
            type="button"
            aria-pressed={tab === "journeys"}
            className={tab === "journeys" ? "active" : ""}
            onClick={() => setTab("journeys")}
          >
            여행 일정
          </button>
          <button
            type="button"
            aria-pressed={tab === "posters"}
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
                  aria-pressed={filter === f.key}
                  className={filter === f.key ? "active" : ""}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </nav>

            {loading && <p>불러오는 중...</p>}
            {error && <p style={{ color: "#d64545" }}>{error}</p>}

            {!loading && (
              <section className="trip-grid">
                {visibleTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} onDelete={handleDelete} deletingId={deletingId} />
                ))}
                <Link className="empty-trip" to="/trips/new">
                  <b>＋</b>
                  <h3>새로운 일본 여행</h3>
                  <p>여행할 도시와 가고 싶은 곳을 골라보세요.</p>
                </Link>
              </section>
            )}
          </section>
        ) : (
          <PosterArchive trips={trips}/>
        )}
      </main>
    </div>
  );
}

function TripCard({ trip, onDelete, deletingId }) {
  const past = isPast(trip);
  const completed = COMPLETED_STATUSES.includes(trip.status);
  const interests = (trip.interests ?? [])
    .map((i) => INTEREST_LABELS[i])
    .join(" · ");

  return (
    <article className="trip-card">
      <div className="trip-cover japan">
        <span>{dDayLabel(trip)}</span>
        <h2>{trip.baseCityLabel || trip.regionLabel || "JAPAN"}</h2>
        <p>{interests || "일본 여행"}</p>
      </div>
      <div className="trip-content">
        <div>
          <span className={`status ${past || completed ? "done" : "planning"}`}>
            {past ? "여행 완료" : STATUS_LABELS[trip.status]}
          </span>
        </div>
        <h3>{trip.title}</h3>
        {trip.baseCityLabel && <p>기준 도시: {trip.baseCityLabel}</p>}
        <p>
          {formatRange(trip)} ·{" "}
          {trip.travelers === 1 ? "혼자" : `${trip.travelers}명`}
        </p>
        <footer>
          <button type="button" className="trip-delete danger-action" disabled={deletingId != null} onClick={() => onDelete(trip.id)}>{deletingId === trip.id ? "삭제 중..." : "여행 삭제"}</button>
          <Link to={`/trips/${trip.id}/planner`}>
            {completed ? "일정 보기" : "계속 계획하기"}
          </Link>
          {HAS_ITINERARY.includes(trip.status) && (
            <Link to={`/trips/${trip.id}/poster`}>AI 포스터 생성</Link>
          )}
        </footer>
      </div>
    </article>
  );
}
