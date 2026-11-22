import { Link, useLocation, useNavigate } from "react-router-dom";
import { createTrip } from "../api/trips";
import TabiWordmark from "../components/TabiWordmark";
import "../styles/setupPostcards.css";
import TripConditionsForm from "../components/TripConditionsForm";

export default function TripSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const carriedPrompt = location.state?.prompt; // 메인에서 들고 온 요청

  const handleSubmit = async (payload) => {
    const trip = await createTrip(payload);
    navigate(`/trips/${trip.id}/planner`, {
      state: { initialPrompt: carriedPrompt },
    });
  };

  return (
    <div className="setup-postcards">
      <header className="tabi-header setup-bar">
        <TabiWordmark />
        <Link to="/trips">내 여행</Link>
      </header>
      <main className="setup-spread">
        <div className="setup-cover">
          <p className="setup-phase">여행 조건 · 2 / 3</p>
          <h1>여행 조건 입력</h1>
          <p>머물 도시와 날짜를 고르면 타비가 예산과 이동 시간을 고려해 일정을 짜요.</p>
          <img src="/assets/postcards/japan-postcards.jpg" alt="" />
          <nav aria-label="입력 항목 바로가기">
            <a href="#setup-basics">일정과 예산</a>
            <a href="#setup-destination">여행지와 숙소</a>
            <a href="#setup-preferences">여행 취향</a>
          </nav>
        </div>
        <section className="setup-sheet" aria-label="여행 조건 양식">
          <TripConditionsForm
            initialValues={location.state?.destination}
            submitLabel="조건 저장하고 시작하기 →"
            onSubmit={handleSubmit}
          />
        </section>
      </main>
    </div>
  );
}
