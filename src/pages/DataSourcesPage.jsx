import PublicHeader from '../components/PublicHeader';

export default function DataSourcesPage() {
  return <>
    <PublicHeader />
    <main className="data-sources-page">
      <header><small>DATA SOURCES</small><h1>데이터 출처</h1><p>여행 일정에 사용하는 데이터와 사진의 출처입니다.</p></header>
      <dl>
        <div><dt>지도·노선·관광지 데이터</dt><dd><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a></dd></div>
        <div><dt>철도 노선 일부</dt><dd lang="ja">国土数値情報（鉄道データ）（国土交通省）を加工して作成</dd></div>
        <div><dt>날씨</dt><dd><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a></dd></div>
        <div><dt>환율</dt><dd>한국수출입은행<p>식비·교통비 화면에 적용한 환율의 출처와 기준 날짜를 표시합니다.</p></dd></div>
        <div><dt>장소 정보·평점·리뷰</dt><dd>Google<p>Google 사진에는 작성자를, 리뷰에는 작성자와 Google 리뷰 표시를 함께 제공합니다.</p></dd></div>
        <div><dt>관광지 사진</dt><dd>Wikimedia Commons<p>사진마다 작가·라이선스를 표시합니다. 라이선스 이름을 누르면 이용 조건을, 사진을 누르면 원본 페이지를 볼 수 있습니다.</p></dd></div>
      </dl>
      <p className="data-sources-reference">노선·운임·소요 시간은 참고용이에요. 정확한 정보는 각 교통 기관에서 확인하세요.</p>
    </main>
  </>;
}
