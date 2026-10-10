import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import PublicHeader from "../components/PublicHeader";
import { ATTRACTION_SCOPE, RESTAURANT_SCOPE } from "../utils/serviceScope";

export default function GuidePage() {
  const location = useLocation();

  // "/guide#criteria"로 들어오면 추천 기준 위치로 스크롤
  useEffect(() => {
    if (location.hash) {
      document
        .querySelector(location.hash)
        ?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <>
      <PublicHeader />
      <main className="guide">
        <section className="guide-hero">
          <span>HOW IT WORKS</span>
          <h1>
            검색은 줄이고,
            <br />
            여행의 맥락은 더 깊게.
          </h1>
          <p>
            원하는 여행을 말하면 AI가 후보를 비교하고, 이동 가능한 일정으로
            정리합니다.
            <br />{ATTRACTION_SCOPE}<br />{RESTAURANT_SCOPE}
          </p>
        </section>

        <section className="flow">
          <article>
            <b>01</b>
            <div>
              <span>대화 시작</span>
              <h2>평소 말하듯 여행을 설명하세요.</h2>
              <p>
                날짜와 숙소만 정해도 괜찮아요. 동행, 예산, 좋아하는 음식, 걷는
                속도까지 알려주면 더 정교해집니다.
              </p>
              <div className="example-chat">
                “10월 도쿄 3박 4일, 혼자 가고 작은 식당과 오래된 골목을 좋아해.
                하루에 너무 많이 걷고 싶지는 않아.”
              </div>
            </div>
          </article>
          <article>
            <b>02</b>
            <div>
              <span>일정 검토</span>
              <h2>지도와 대화를 함께 보며 조정하세요.</h2>
              <p>
                장소를 누르면 추천 이유와 다음 장소까지 가는 방법을 확인할 수
                있습니다.
              </p>
              <Link to="/trips/new">새 여행 만들기 →</Link>
            </div>
          </article>
          <article>
            <b>03</b>
            <div>
              <span>AI 이미지 생성</span>
              <h2>일정을 확정하면 포스터는 자동으로.</h2>
              <p>
                확정한 일정과 핵심 지역, 분위기를 바탕으로 AI가 여행 포스터를
                만들고, 상세 일정과 함께 PDF로 내려받을 수 있습니다.
              </p>
            </div>
          </article>
        </section>

        <section className="criteria" id="criteria">
          <div>
            <small>RECOMMENDATION STANDARD</small>
            <h2>
              무엇을 기준으로
              <br />
              추천하나요?
            </h2>
            <p>
              단순히 별점이 높은 곳을 나열하지 않고 실제 일정에 넣어도 괜찮은지
              함께 판단합니다.
            </p>
          </div>
          <div className="criteria-grid">
            <article>
              <b>01</b>
              <h3>리뷰 신뢰도</h3>
              <p>
                평점만이 아니라 리뷰 수를 함께 보고, 리뷰가 적어 평점이 부풀려진
                곳을 걸러냅니다.
              </p>
            </article>
            <article>
              <b>02</b>
              <h3>이동 효율</h3>
              <p>
                하루를 한 동네로 묶고, 숙소에서 출발해 이동 시간이 가장 짧은
                순서로 방문합니다.
              </p>
            </article>
            <article>
              <b>03</b>
              <h3>취향 적합도</h3>
              <p>
                대화에서 파악한 음식, 분위기, 여행 속도, 동행 특성에 맞춰 후보를
                고릅니다.
              </p>
            </article>
            <article>
              <b>04</b>
              <h3>운영 리스크</h3>
              <p>
                영업 상태, 휴무일, 날씨처럼 여행 당일 문제가 될 요소를
                점검합니다.
              </p>
            </article>
          </div>
          <p className="criteria-note">
            * 추천에 쓰는 장소는 모두 실제 데이터에서 가져오며, AI가 장소를 새로
            만들어내지 않습니다.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
