import { useEffect, useState } from "react";

// 서버는 한 번의 요청으로 모두 처리하고, 진행 상태를 따로 알려주지 않는다.
// 1~4단계(계산, 약 1초)는 빠르게 넘기고, 5단계(AI 설명, 가장 오래 걸림)는 응답이 올 때까지 머문다.
const STEPS = [
  {
    title: "숙소 위치 확인",
    doing: "일정의 출발점을 확인하고 있어요.",
    done: "일정의 출발점을 확인했어요.",
    at: 0,
  },
  {
    title: "날짜별 지역 배정",
    doing: "가까운 지역끼리 날짜별로 묶고 있어요.",
    done: "가까운 지역끼리 날짜별로 묶었어요.",
    at: 500,
  },
  {
    title: "관광지·식당 후보 선정",
    doing: "조건에 맞는 장소 후보를 비교하고 있어요.",
    done: "조건에 맞는 장소를 골랐어요.",
    at: 1000,
  },
  {
    title: "이동 동선 최적화",
    doing: "이동 시간과 방문 순서를 계산하고 있어요.",
    done: "이동 시간과 방문 순서를 계산했어요.",
    at: 1700,
  },
  {
    title: "일정 설명 작성",
    doing: "날짜별 일정 설명을 정리하고 있어요.",
    done: "날짜별 일정 설명을 정리했어요.",
    at: 2500,
  },
];

/**
 * 일정 생성 중 / 실패 화면
 * - error가 없으면 진행 화면, 있으면 실패 화면
 * - 429(하루 생성 횟수 초과)는 다시 시도해도 같아서 재시도 버튼을 숨긴다
 */
export default function GeneratingOverlay({ error, onRetry, onClose }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (error) return undefined;
    const timers = STEPS.slice(1).map((s, i) =>
      setTimeout(() => setStep(i + 1), s.at),
    );
    return () => timers.forEach(clearTimeout);
  }, [error]);

  if (error) {
    const canRetry = error.status !== 429;
    return (
      <section className="schedule-generating-overlay" aria-live="polite">
        <div className="schedule-generating-card failed-card">
          <span className="ai-orbit fail-icon">!</span>
          <small>GENERATION FAILED</small>
          <h2>일정을 완성하지 못했어요</h2>
          <p>{error.message}</p>
          <div className="failed-actions">
            {canRetry && (
              <button
                type="button"
                className="primary-action"
                onClick={onRetry}
              >
                다시 시도
              </button>
            )}
            <button type="button" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="schedule-generating-overlay" aria-live="polite">
      <div className="schedule-generating-card">
        <span className="ai-orbit">✦</span>
        <small>AI ITINERARY GENERATION</small>
        <h2>여행 일정을 만들고 있어요</h2>
        <p>
          입력한 조건과 실제 장소 데이터를 조합하고 있습니다.
          <br />
          보통 10초 안팎으로 걸려요.
        </p>
        <ol>
          {STEPS.map((s, i) => {
            const state = i < step ? "done" : i === step ? "current" : "";
            return (
              <li key={s.title} className={state}>
                <i>{state === "done" ? "✓" : i + 1}</i>
                <div>
                  <b>{s.title}</b>
                  <span>{state === "done" ? s.done : s.doing}</span>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="generation-progress">
          <i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <strong>
          {step + 1} / {STEPS.length} 단계 진행 중
        </strong>
      </div>
    </section>
  );
}
