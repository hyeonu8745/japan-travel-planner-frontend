import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import { ATTRACTION_SCOPE } from "../utils/serviceScope";

import "../styles/postcardGuide.css";

const steps = [
  ["여행 조건 입력", "권역과 숙소 도시를 고르고, 날짜·인원·예산·공항·비행기 시각을 적어요. 가고 싶은 근처 도시가 있으면 당일치기로 최대 3곳 고를 수 있어요.", "첫날과 마지막 날은 숙소 도시에서 보내요. 당일치기는 그 사이 날에 들어가요."],
  ["취향 대화", "채팅으로 먹고 싶은 것, 피하고 싶은 음식, 알레르기, 걷는 게 힘든지 같은 것을 편하게 말해 주세요. 두세 번 대화하면 일정을 만들 준비가 돼요."],
  ["일정 만들기", "하루마다 관광지, 점심, 쉬는 시간 카페, 저녁이 시간 순서대로 짜여요. 장소마다 고른 이유가 칩으로 붙어요. 예를 들면 대표 명소, 관심사, 걸어서 5분이에요."],
  ["마음대로 고치기", ["버튼으로 바꾸기, 빼기, 순서 바꾸기, 추가하기", "채팅으로 말하기 (예: 3일차 점심 라멘으로 바꿔 줘)", "비가 오는 날은 실내 대안 보기", "고칠 때마다 버전이 남아서 언제든 예전 일정으로 되돌릴 수 있어요"]],
  ["이동 확인", "구간마다 걷는 시간이나 대중교통 경로(탈 역, 노선, 갈아타는 역)가 나오고, Google 지도 길찾기로 바로 이어져요."],
  ["비용 확인", "플래너 상단에서 ‘식비·교통비’를 누르세요. 먼저 여행 전체 예상 금액을 보고, 날짜별 식비를 펼쳐 각 끼니의 예산을 확인하세요. 교통비에는 1일권과 당일치기 왕복 비용도 반영돼요."],
  ["포스터와 인쇄용 일정표", "여행 지도 포스터를 그려 드리고, 상세 일정표는 인쇄하거나 PDF로 저장할 수 있어요."],
];
const examples = [
  [["conditions", "간사이 권역을 고른 뒤 도착·출발 공항과 비행기 시각을 입력해요."]],
  [["preferences", "채팅에 원하는 분위기를 말하면 ‘파악한 취향’에서 반영된 내용을 볼 수 있어요."]],
  [["generating", "일정을 요청하면 생성 진행 상황이 표시돼요."], ["day", "완성된 일정에서 날짜별 방문 순서와 이동 시간을 확인해요."], ["place", "장소의 ‘상세 보기’에서 방문 시각과 체류 시간을 확인해요."]],
  [["choices", "채팅으로 ‘2일차 점심 초밥 먹을래’라고 말하고 후보를 골라요."], ["changed", "선택한 식당과 다시 계산한 시간이 채팅에 표시돼요."]],
  [["route", "일정표에서 장소나 대중교통 이동 카드를 누르면 해당 구간이 지도에 강조돼요."]],
  [["budget-overview", "예상 식비와 교통비를 각각 확인하고, 아래 ‘식비 + 교통비’에서 일행 전체의 예상 합계를 보세요."]],
  [["poster", "스타일과 캐릭터를 정해 포스터를 만들고, 생성이 끝나면 ‘PDF로 저장 (전체)’를 눌러요."]],
];
const criteria = [
  { name: "관광지", question: "어떤 관광지가 내 일정에 들어가나요?", rules: [
    ["장소 선택", "도시의 대표 명소를 먼저 챙겨요. 평점과 인지도를 함께 보고, 유명한 장소에만 일정이 몰리지 않게 조절해요."],
    ["내 관심사", "전통 명소, 쇼핑, 야경, 음식 중 내가 고른 관심사에 맞는 곳을 우선해요."],
    ["하루 방문 수", "숙소 도시에선 야경을 포함해 3~5곳, 당일치기에는 2~3곳을 여행 속도에 맞춰요."],
    ["운영 일정", "계절 개방이나 연말연시 휴무로 방문일에 닫는 곳은 제외해요. USJ나 디즈니처럼 하루를 보내는 테마파크는 그날 한 곳만 넣어요."],
  ] },
  { name: "식당", question: "점심과 저녁은 어떻게 고르나요?", rules: [
    ["동선과 예산", "방문할 장소 근처에서 평점이 높고 예산에 맞는 식당을 먼저 찾아요. 후보가 적으면 예산 범위를 조금 넓히거나 체인점도 살펴봐요."],
    ["음식 취향", "먹고 싶은 음식을 우선하고 같은 음식이 며칠씩 이어지지 않게 해요. 피할 음식과 알레르기는 식당 종류로 구분할 수 있는 범위에서 제외해요. 재료는 주문 전 가게에 확인해 주세요."],
    ["방문 조건", "방문일이 정기 휴일인 식당, 서서 마시는 가게, 예약만 받는 곳은 제외해요."],
    ["다른 선택지", "식당마다 다른 후보 2곳도 함께 보여드려요."],
  ] },
  { name: "쉬는 시간 카페", question: "카페는 언제 들르나요?", rules: [
    ["시간", "점심과 저녁 사이, 오후 3시 전후에 한 번 쉬어 가요."],
    ["위치", "그날 동선 가까이에서 카페를 찾아요. 근처에 마땅한 곳이 없으면 체인 카페를 넣어요."],
  ] },
  { name: "동선과 시간", question: "장소 순서와 이동 시간은 어떻게 정하나요?", rules: [
    ["방문 순서", "가까운 지역끼리 하루로 묶고 이동이 짧은 순서로 배치해요."],
    ["이동 수단", "가까우면 걷고 멀면 대중교통으로 계산해요. 걷기 힘들다고 알려주면 도보로 배정하는 거리를 줄여요."],
    ["첫날과 마지막 날", "비행기 도착·출발 시각, 짐 맡기기, 체크아웃 시간을 일정에 반영해요."],
    ["당일치기", "왕복 이동 시간을 남겨 두고 일정을 마쳐요. 복귀가 늦어지면 숙소 도시에서 저녁을 먹도록 안내해요."],
  ] },
  { name: "추천 제외 장소", question: "어떤 장소가 추천에서 빠지나요?", rules: [
    ["운영 상태", "폐업했거나 장기 휴관 중인 곳은 제외해요."],
    ["장소 성격", "관광지로 보기 어려운 곳, 성인 시설, 일부 역사적으로 민감한 장소는 추천하지 않아요."],
  ] },
];

function GuideImage({ src, alt, title }) {
  const dialog = useRef(null);
  const headingId = useId();
  return <>
    <button type="button" className="guide-image-trigger" aria-label={`${title} 크게 보기`}
      aria-haspopup="dialog" onClick={() => dialog.current.showModal()}>
      <img src={src} alt={alt} />
    </button>
    {createPortal(<dialog ref={dialog} className="tabi-poster-dialog guide-image-dialog" aria-labelledby={headingId}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current.close();
      }}>
      <header><h2 id={headingId}>{title}</h2>
        <form method="dialog"><button>닫기</button></form>
      </header>
      <img src={src} alt={alt} loading="lazy" />
    </dialog>, document.body)}
  </>;
}

function RecommendationGuide() {
  const [selected, select] = useState(0);
  const topic = criteria[selected];
  return <div className="criteria-reader">
    <nav aria-label="추천 기준 주제">{criteria.map(({ name }, index) =>
      <button key={name} type="button" aria-pressed={index === selected} onClick={() => select(index)}>{name}</button>
    )}</nav>
    <section className="criteria-sheet" aria-labelledby="criteria-question">
      <div><h2 id="criteria-question" aria-live="polite">{topic.question}</h2>
        <dl>{topic.rules.map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl>
      </div>
      {selected === 0 && <figure>
        <GuideImage src="/assets/guide/place.png" title="우메다 공중정원 전망대 상세 화면" alt="우메다 공중정원 전망대의 대표 명소와 관심사: 야경 표시" />
        <figcaption>우메다 공중정원 전망대에는 ‘대표 명소’와 ‘관심사: 야경’이 표시돼요. 장소 상세에서 내 일정에 들어간 이유를 확인하세요.</figcaption>
      </figure>}
      {selected === 1 && <figure>
        <GuideImage src="/assets/guide/restaurant.png" title="식당 리뷰 참고 표시 예시" alt="식당 이름과 사진, 주소를 흐린 예시 화면. 리뷰 참고 · 불친절 경험 옆에 다른 식당 보기 버튼이 있어요." />
        <figcaption>리뷰에서 불친절을 겪었다는 후기가 확인되면 ‘리뷰 참고 · 불친절 경험’이 표시돼요. 옆의 ‘다른 식당 보기’를 눌러 후보를 비교할 수 있어요.</figcaption>
      </figure>}
    </section>
    <aside><strong>방문 전 확인</strong> 이동 시간·노선·운임은 예상치예요. 영업시간과 휴무, 교통편은 출발 전에 한 번 더 확인해 주세요.</aside>
  </div>;
}

function Content({ value }) {
  return Array.isArray(value) ? <ul>{value.map(item => <li key={item}>{item}</li>)}</ul> : <p>{value}</p>;
}

const imageLabels = {
  generating: "생성 중", day: "하루 일정", place: "장소 상세",
  choices: "변경 후보 고르기", changed: "변경 결과 확인",
};

function GuideWalkthrough() {
  const [step, setStep] = useState(0);
  const [shot, setShot] = useState(0);
  const [title, content, note] = steps[step];
  const images = examples[step];
  const current = images[shot];
  function selectStep(index) {
    setStep(index);
    setShot(0);
  }

  return <div className="guide-reader">
    <nav aria-label="이용 방법 목차">
      {steps.map(([name], index) => <button key={name} aria-current={step === index ? "step" : undefined}
        onClick={() => selectStep(index)}><span>{String(index + 1).padStart(2, "0")}</span>{name}</button>)}
    </nav>
    <section className="guide-leaf" aria-labelledby="guide-step-title">
      <header><small>{step + 1} / {steps.length}단계</small>
        <h2 id="guide-step-title" aria-live="polite">{title}</h2></header>
      <Content value={content} />
      {note && <aside>{note}</aside>}
      {current && <div className="guide-frame">
        {images.length > 1 && <div className="guide-shot-options" role="group" aria-label="예시 화면 선택">
          {images.map(([key], index) => <button key={key} aria-pressed={shot === index}
            onClick={() => setShot(index)}>{imageLabels[key]}</button>)}
        </div>}
        <figure><GuideImage src={`/assets/guide/${current[0]}.png`} title={`${title} 예시`} alt={current[1]} />
          <figcaption>{current[1]}</figcaption></figure>
      </div>}
      <footer><button disabled={step === 0} onClick={() => selectStep(step - 1)}>← 이전 단계</button>
        {step < steps.length - 1 ? <button onClick={() => selectStep(step + 1)}>{steps[step + 1][0]} →</button>
          : <Link to="/trips/new">새 여행 만들기 →</Link>}</footer>
    </section>
  </div>;
}

export default function GuidePage() {
  const showCriteria = useLocation().hash === "#criteria";
  useEffect(() => { window.scrollTo(0, 0); }, [showCriteria]);

  return <>
    <PublicHeader />
    <main className="tabi-public postcard-guide">
      <header className="guide-cover">
        <div><p className="guide-label">{showCriteria ? "추천 기준" : "이용 방법"}</p>
          <h1>{showCriteria ? "왜 이 장소를 골랐을까요?" : "나만의 일본 여행 만들기"}</h1>
          <p>{showCriteria ? ATTRACTION_SCOPE : "처음이라면 여행 조건부터 시작하세요. 궁금한 단계만 골라 볼 수도 있어요."}</p>
        </div>
        <img src={showCriteria ? "/assets/postcards/kyoto-scene.jpg" : "/assets/postcards/japan-postcards.jpg"} alt="" />
      </header>
      {showCriteria ? <RecommendationGuide /> : <GuideWalkthrough />}
      <div className="tabi-guide-actions"><Link to="/trips/new">새 여행 만들기 →</Link><Link to={showCriteria ? "/guide" : "/guide#criteria"}>{showCriteria ? "이용 방법 보기" : "추천 기준 보기"}</Link></div>
    </main>
  </>;
}
