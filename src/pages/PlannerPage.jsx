import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTrip } from "../api/trips";

export default function PlannerPage() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getTrip(tripId)
      .then(setTrip)
      .catch((err) => setError(err.message));
  }, [tripId]);

  if (error)
    return (
      <main style={{ padding: 40 }}>
        <p>{error}</p>
        <Link to="/trips">내 여행으로</Link>
      </main>
    );
  if (!trip)
    return (
      <main style={{ padding: 40 }}>
        <p>불러오는 중...</p>
      </main>
    );

  return (
    <main style={{ padding: 40 }}>
      <h1>{trip.title}</h1>
      <p>
        {trip.startDate} ~ {trip.endDate} · {trip.travelers}명 ·{" "}
        {trip.travelPace}
      </p>
      <p>플래너 화면은 AI 일정 생성과 함께 채워질 예정입니다.</p>
      <Link to="/trips">내 여행으로</Link>
    </main>
  );
}
