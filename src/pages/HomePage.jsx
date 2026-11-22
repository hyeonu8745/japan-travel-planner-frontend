import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn } from "../auth/token";
import useRegions from "../hooks/useRegions";
import PublicHeader from "../components/PublicHeader";

import "../styles/postcardHome.css";

const steps = [
  ["hotel", "여행 조건 입력", "도시와 날짜, 인원, 예산을 정해요."],
  ["ai-spark", "취향과 스타일 선택", "좋아하는 음식과 걷고 싶은 동네를 알려주세요."],
  ["generate", "일정 자동 구성", "취향과 동선에 맞춰 하루 일정을 짜요."],
  ["confirm", "수정하고 완성하기", "장소를 바꾸고 여행 포스터로 간직해요."],
];
const landmarkNames = new Map([
  ["도쿄", "Tokyo"], ["오사카", "Osaka"], ["교토", "Kyoto"], ["후쿠오카", "Fukuoka"],
]);

const cityIllustrations = new Map([
  ["요코하마", "waterfront"], ["가마쿠라", "temple"], ["하코네", "onsen"],
  ["가와구치코", "lake"], ["고베", "cruise"], ["나라", "park"],
  ["나고야", "castle"], ["가나자와", "garden"], ["다카야마", "historic-town"],
  ["히로시마", "memorial"], ["벳푸", "onsen"], ["유후인", "ryokan"],
  ["삿포로", "tower"], ["오타루", "river"], ["나하", "island"],
]);

function cityImage(label) {
  const landmark = landmarkNames.get(label);
  if (landmark) return `/assets/postcards/${landmark.toLowerCase()}.jpg`;
  const illustration = cityIllustrations.get(label) ?? "landmark";
  return `/assets/attractions-v2/${illustration}.png`;
}

const SUGGESTIONS = ["부모님과 편안한 일본 여행", "골목 산책과 로컬 맛집 위주로"];

export default function HomePage() {
  const posterDialog = useRef(null);
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const catalogue = useRegions(loggedIn);
  const cityCount = catalogue.regions.reduce((sum, region) => sum + region.cities.length, 0);
  const [prompt, setPrompt] = useState("");

  const startJourney = (destination) => {
    const state = { prompt: prompt.trim() || undefined, destination };
    if (loggedIn) navigate("/trips/new", { state });
    else navigate("/auth", { state: { ...state, from: "/trips/new" } });
  };
  const [cityCode, setCityCode] = useState("");
  const cities = catalogue.regions.flatMap(region =>
    region.cities.map(city => ({ ...city, region: region.code }))
  );
  const featured = [...landmarkNames.keys()].map(label => cities.find(city => city.label === label)).filter(Boolean);
  const quickCities = [...featured, ...cities.filter(city => !featured.includes(city))].slice(0, 4);
  const otherCities = cities.filter(city => !quickCities.includes(city));
  const explorerCities = quickCities.slice(0, 3);
  const handleStart = event => {
    event.preventDefault();
    const city = cities.find(item => item.code === cityCode);
    startJourney(city && { region: city.region, baseCity: city.code });
  };

  return (
    <>
      <PublicHeader />
      <main className="tabi-public postcard-home">
        <section className="tabi-intro">
          <div>
            <small className="postcard-kicker">JAPAN TRIP PLANNER</small>
            <h1>이번 여행은<br /><em>어느 도시로?</em></h1>
            <p>타비와 함께라면, 일본 여행 준비가 더 쉽고 즐거워요.<br />도시 선택부터 일정, 비용, 포스터까지 한 번에 계획해보세요.</p>
            <form onSubmit={handleStart}>
              {cities.length > 0 && <div className="postcard-cities">
                {quickCities.map(city => {
                  const englishName = landmarkNames.get(city.label);
                  return <button className="postcard-city" key={city.code} type="button" aria-pressed={city.code === cityCode} onClick={() => setCityCode(city.code)}>
                    <img src={cityImage(city.label)} alt="" />
                    <span><strong>{city.label}</strong>{englishName && <small lang="en">{englishName}</small>}</span>
                  </button>;
                })}
                {otherCities.length > 0 && <select aria-label="다른 도시 선택" value={otherCities.some(city => city.code === cityCode) ? cityCode : ""} onChange={event => setCityCode(event.target.value)}>
                  <option value="">다른 도시</option>
                  {otherCities.map(city => <option key={city.code} value={city.code}>{city.label}</option>)}
                </select>}
              </div>}
              <button className="postcard-start">일본 여행 계획 세우기　→</button>
              <details className="postcard-request"><summary>여행 요청 미리 적기</summary>
                <input aria-label="여행 요청" value={prompt} onChange={event => setPrompt(event.target.value)} maxLength={1000} placeholder="예: 골목 산책과 로컬 맛집 위주로" />
                <div className="tabi-examples">{SUGGESTIONS.map(text => <button key={text} type="button" onClick={() => setPrompt(text)}>{text}</button>)}</div>
              </details>
            </form>
          </div>
          <figure className="postcard-art">
            <img src="/assets/postcards/japan-postcards.jpg" alt="후지산과 벚꽃 앞에 펼쳐 놓은 도쿄와 교토 여행 엽서" />
            <button type="button" aria-haspopup="dialog" onClick={() => posterDialog.current.showModal()}>실제 여행 포스터 보기 <span aria-hidden="true">↗</span></button>
          </figure>
          <dialog ref={posterDialog} className="tabi-poster-dialog" aria-labelledby="poster-heading">
            <header><h2 id="poster-heading">오사카 4박 5일 · 여행 포스터 예시</h2>
              <form method="dialog"><button>닫기</button></form>
            </header>
            <img loading="lazy" src="/assets/posters/osaka-map.jpg" alt="오사카 여행 지도 · 1~2일차" />
            <img loading="lazy" src="/assets/posters/osaka-day2.jpg" alt="2일차 교토 당일치기 상세 일정표 · 방문 시각, 이동 경로와 1인 비용 요약" />
          </dialog>
        </section>
        <ol className="postcard-steps" aria-label="여행 계획 과정">
          {steps.map(([icon, heading, detail], index) => <li key={icon}>
            <img src={`/assets/ui-v2/${icon}.svg`} alt="" />
            <div><strong>{index + 1}. {heading}</strong><p>{detail}</p></div>
          </li>)}
        </ol>
        <section className="destination-explorer" aria-labelledby="destination-title">
          <header><div><h2 id="destination-title">도시 탐색하기</h2><p>일본의 매력적인 도시들을 만나보세요.</p></div>
            {catalogue.data && <span>{catalogue.regions.length}개 권역 · {cityCount}개 도시</span>}
          </header>
          {!loggedIn ? <div className="destination-signin"><p>로그인하면 여행할 권역과 도시, 당일치기 후보를 볼 수 있어요.</p><button type="button" onClick={() => navigate('/auth', { state: { from: '/', prompt } })}>로그인하고 도시 둘러보기 →</button></div> : catalogue.loading ? <p role="status">여행할 도시를 불러오고 있어요…</p> : catalogue.error ? <div role="alert"><p>{catalogue.error}</p><button type="button" onClick={catalogue.reload}>도시 다시 불러오기</button></div> : <>
            <div className="city-scenes">{explorerCities.map(city => {
              const english = landmarkNames.get(city.label);
              const scene = ["Tokyo", "Osaka", "Kyoto"].includes(english)
                ? `/assets/postcards/${english.toLowerCase()}-scene.jpg`
                : cityImage(city.label);
              return <button type="button" className="city-scene" key={city.code}
                onClick={() => startJourney({ region: city.region, baseCity: city.code })}>
                <img src={scene} alt="" />
                <span><strong>{city.label}</strong>{english && <small lang="en">{english}</small>}</span>
                <i aria-hidden="true">→</i>
              </button>;
            })}</div>
            <details className="all-city-scenes"><summary>
              <span className="when-closed">모든 도시 보기</span>
              <span className="when-open">도시 목록 접기</span>
            </summary>
            <div className="destination-grid">{catalogue.regions.map(region => <article className="destination-card" key={region.code}>
            <div className="destination-card-top"><span aria-hidden="true">✦</span><h3>{region.label}</h3><small>{region.cities.length}개 도시</small></div>
            <div className="destination-city-list">{region.cities.map(city => (
              <button key={city.code} type="button" onClick={() => startJourney({ region: region.code, baseCity: city.code })}>
                <img src={cityImage(city.label)} alt="" width="42" height="42" loading="lazy" />
                <b>{city.label}</b>
                <span>{city.dayTrips?.length ? '당일치기도 함께' : '이 도시에서 머물기'}</span>
                <i aria-hidden="true">↗</i>
              </button>
            ))}</div>
            <p>{region.airports.map(airport => airport.label).join(' · ')}</p>
          </article>)}</div></details></>}
        </section>
        <div className="tabi-links">
          <Link to="/guide"><strong>이용 방법 ↗</strong><span>취향 대화부터 여행 포스터까지</span></Link>
          <Link to="/guide#criteria"><strong>추천 기준 ↗</strong><span>내 일정에 이 장소가 담긴 이유</span></Link>
        </div>
      </main>
    </>
  );
}
