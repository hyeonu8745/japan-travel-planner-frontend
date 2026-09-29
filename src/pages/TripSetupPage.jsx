import { Link, useNavigate } from "react-router-dom";
import { createTrip } from "../api/trips";
import Brand from "../components/Brand";
import TripConditionsForm from "../components/TripConditionsForm";

export default function TripSetupPage() {
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    const trip = await createTrip(payload);
    navigate(`/trips/${trip.id}/planner`);
  };

  return (
    <div className="setup-page">
      <header className="setup-head">
        <Brand />
        <div className="setup-steps" aria-label="여행 계획 단계">
          <span className="done">01 로그인</span>
          <i />
          <span className="active">02 여행 조건</span>
          <i />
          <span>03 AI 일정</span>
        </div>
        <Link to="/trips">내 여행</Link>
      </header>

      <main className="setup-main">
        <section className="setup-intro">
          <small>TRIP PROFILE</small>
          <p className="step-number">02 / 03</p>
          <h1>
            어떤 여행을
            <br />
            계획할까요?
          </h1>
          <p>
            여행 조건을 먼저 알려주면 AI가 예산과 이동 제약까지 고려해 더
            현실적인 일정을 만듭니다.
          </p>
          <div className="setup-summary">
            <span>입력 정보 활용</span>
            <ul>
              <li>장소와 맛집 후보 필터링</li>
              <li>날짜별 이동 동선 계산</li>
              <li>예산 및 일정 충돌 검사</li>
            </ul>
          </div>
        </section>

        <section className="setup-card">
          <header>
            <small>NEW JOURNEY</small>
            <h2>여행 조건 입력</h2>
            <p>나중에 플래너의 ‘여행 조건’ 메뉴에서 다시 수정할 수 있어요.</p>
          </header>
          <TripConditionsForm
            submitLabel="조건 저장하고 시작하기 →"
            onSubmit={handleSubmit}
          />
        </section>
      </main>
    </div>
  );
}
