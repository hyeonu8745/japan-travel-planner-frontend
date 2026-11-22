import { useEffect } from "react";
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
  ["비용 확인", "식비와 교통비(1일권, 당일치기 왕복 포함)를 엔과 원으로 계산해 드려요."],
  ["포스터와 인쇄용 일정표", "여행 지도 포스터를 그려 드리고, 상세 일정표는 인쇄하거나 PDF로 저장할 수 있어요."],
];
const examples = [
  [["conditions", "간사이 권역을 고른 뒤 도착·출발 공항과 비행기 시각을 입력해요."]],
  [["preferences", "채팅에 원하는 분위기를 말하면 ‘파악한 취향’에서 반영된 내용을 볼 수 있어요."]],
  [["generating", "일정을 요청하면 생성 진행 상황이 표시돼요."], ["day", "완성된 일정에서 날짜별 방문 순서와 이동 시간을 확인해요."], ["place", "장소의 ‘상세 보기’에서 방문 시각과 체류 시간을 확인해요."]],
  [["choices", "채팅으로 ‘2일차 점심 초밥 먹을래’라고 말하고 후보를 골라요."], ["changed", "선택한 식당과 다시 계산한 시간이 채팅에 표시돼요."]],
  [["route", "일정표에서 장소나 대중교통 이동 카드를 누르면 해당 구간이 지도에 강조돼요."]],
  [],
  [["poster", "스타일과 캐릭터를 정해 포스터를 만들고, 생성이 끝나면 ‘PDF로 저장 (전체)’를 눌러요."]],
];
const criteria = [
  ["관광지는 이렇게 골라요", ["그 도시의 대표 명소를 먼저 챙겨요.", "평점과 많이 알려진 정도를 함께 보되, 너무 유명한 곳만 몰리지 않게 조절해요.", "고른 관심사(전통 명소, 쇼핑, 야경, 음식)에 맞는 곳에 점수를 더 줘요.", "하루에 가는 곳 수는 여행 속도에 맞춰요. 숙소 도시 날은 3~5곳(야경 포함)이고, 당일치기 날은 2~3곳이에요.", "그날 문을 닫는 곳(연말연시 휴무, 계절 개방)은 빼요.", "하루를 다 쓰는 테마파크(USJ, 디즈니 등)는 그날 하나만 넣어요."]],
  ["식당은 이렇게 골라요", ["그날 동선 근처에서 평점이 높은 곳을 골라요.", "예산에 맞는 곳을 먼저 찾고, 없으면 조금 넓혀서 찾아요.", "먹고 싶다고 한 음식은 우선, 피하고 싶은 음식과 알레르기는 빼요.", "같은 음식이 며칠 연달아 나오지 않게 해요.", "방문하는 날이 정기 휴일인 곳, 서서 마시는 가게, 예약만 받는 곳은 빼요.", "근처에 고를 곳이 적으면 믿을 만한 체인점도 넣어요.", "식당마다 다른 후보 2곳을 같이 보여 드려요."]],
  ["쉬는 시간 카페", "점심과 저녁 사이, 오후 3시 전후에 동선 근처 카페 한 곳을 넣어요. 근처에 마땅한 곳이 없으면 체인 카페로 넣어요."],
  ["동선과 시간", ["하루는 가까운 지역끼리 묶고, 이동이 짧은 순서로 배치해요.", "걷기 부담이 적은 거리는 걷고, 멀면 대중교통으로 계산해요. 걷는 게 힘들다고 하면 걷는 기준을 줄여요.", "공항 도착·출발 시각, 짐 맡기기, 체크아웃 시간을 일정에 반영해요.", "당일치기 날은 왕복 이동 시간만큼 일찍 끝나고, 늦어지면 저녁은 숙소 도시에서 먹도록 안내해요."]],
  ["넣지 않는 곳", "폐업했거나 장기 휴관 중인 곳, 관광지로 보기 어려운 곳, 성인 시설, 그리고 일부 역사적으로 민감한 장소는 추천하지 않아요."],
  ["참고해 주세요", "이동 시간과 노선, 운임은 예상치예요. 영업시간과 휴무, 교통편은 방문 전에 한 번 더 확인해 주세요."],
];

function Content({ value }) {
  return Array.isArray(value) ? <ul>{value.map(item => <li key={item}>{item}</li>)}</ul> : <p>{value}</p>;
}

export default function GuidePage() {
  const showCriteria = useLocation().hash === "#criteria";
  useEffect(() => { window.scrollTo(0, 0); }, [showCriteria]);

  return <>
    <PublicHeader />
    <main className="tabi-public postcard-guide">
      <header className="guide-cover">
        <div><p className="guide-label">{showCriteria ? "추천 기준" : "이용 방법"}</p>
          <h1>{showCriteria ? "왜 이 장소를 골랐을까요?" : "여행 한 편이 만들어지는 과정"}</h1>
          <p>{showCriteria ? ATTRACTION_SCOPE : "여행 조건을 고르고, 타비와 이야기하며 하루씩 완성해요."}</p>
        </div>
        <img src={showCriteria ? "/assets/postcards/kyoto-scene.jpg" : "/assets/postcards/japan-postcards.jpg"} alt="" />
      </header>
      {showCriteria ? <div className="guide-topics">
        {criteria.map(([title, content], index) =>
          <details className="guide-topic" key={title} open={index === 0}>
            <summary><h2>{title}</h2></summary>
            <div><Content value={content} /></div>
          </details>
        )}
      </div> : <><nav className="guide-jumps" aria-label="이용 방법 단계">
        {steps.map(([title], i) => <button key={title} type="button" onClick={() => document.getElementById(`guide-step-${i}`)?.focus()}>{i + 1}. {title}</button>)}
      </nav><ol className="guide-route">
        {steps.map(([title, content, note], index) =>
          <li key={title} id={`guide-step-${index}`} tabIndex={-1}>
            <span className="guide-stop" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div><h2>{title}</h2><Content value={content} />{note && <aside>{note}</aside>}
              {examples[index].length > 0 && <div className="guide-examples">{examples[index].map(([image, caption]) =>
                <figure key={image}><a href={`/assets/guide/${image}.png`} target="_blank" rel="noreferrer" aria-label={`${caption} 원본 이미지 열기`}>
                  <img loading="lazy" src={`/assets/guide/${image}.png`} alt={caption} />
                </a><figcaption>{caption}</figcaption></figure>
              )}</div>}
            </div>
          </li>
        )}
      </ol></>}
      <div className="tabi-guide-actions"><Link to="/trips/new">새 여행 만들기 →</Link><Link to={showCriteria ? "/guide" : "/guide#criteria"}>{showCriteria ? "이용 방법 보기" : "추천 기준 보기"}</Link></div>
    </main>
  </>;
}
