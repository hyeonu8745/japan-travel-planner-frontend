import PanelIcon from './PanelIcon';
import { krwRange } from '../../utils/budgetPresentation';
import { yenAmount, yenRange, passRecommendation } from '../../utils/transportBudget';

export function TransportBudgetCard({ transport, travelers }) {
  const total = transport.total;
  return <section className="budget-overview budget-transport-card" aria-label="교통비 추정"><div className="budget-overview-top"><span>교통비(추정)</span><PanelIcon name="TRANSIT"/></div><strong className="budget-total">{Number.isFinite(total?.minKrw) && Number.isFinite(total?.maxKrw) ? `약 ${krwRange(total.minKrw,total.maxKrw)}` : '확인 어려움'}</strong><div className="budget-overview-meta"><span><PanelIcon name="people"/>{travelers}명 기준</span></div>{travelers > 1 && <p className="budget-per-person">1인 {krwRange(transport.perPerson?.minKrw,transport.perPerson?.maxKrw)}</p>}{transport.rentalCar && <p className="budget-rental-note">렌터카 비용은 포함 안 됨</p>}</section>;
}

export function TransportBudgetDetails({ transport }) {
  const { subway, airport } = transport;
  const passes = subway?.passes ?? [];
  return <section className="budget-transport-details" aria-labelledby="transport-details-title"><div className="budget-section-title"><h2 id="transport-details-title"><PanelIcon name="TRANSIT"/>교통비 상세</h2><small>아래 요금은 1인 기준</small></div>
    {subway && <div className="budget-transport-box"><h3>지하철 <span>{subway.legs}구간</span></h3><div className="budget-transport-line"><span>일반 요금 합계</span><b>{yenRange(subway.minYen,subway.maxYen)}</b></div>{passes.length > 0 && <><div className="budget-pass-badges">{passes.map((pass,index) => <span key={index}>{passRecommendation(pass,passes.length === 1 ? subway.savingsYen : null)}</span>)}</div>{passes.length > 1 && Number.isFinite(subway.savingsYen) && subway.savingsYen > 0 && <p className="budget-pass-savings">패스 조합으로 총 {yenAmount(subway.savingsYen)} 절약</p>}<div className="budget-transport-line"><span>패스 구매 비용</span><b>{yenAmount(subway.passCost)}</b></div></>}<div className="budget-transport-line is-final"><span>{passes.length ? '패스 반영 후' : '예상 지하철 요금'}</span><b>{yenRange(subway.finalMinYen,subway.finalMaxYen)}</b></div></div>}
    {airport && <div className="budget-transport-box"><h3>공항 이동</h3>{['arrival','departure'].map(direction => { const leg = airport[direction]; return leg && <div className="budget-airport-leg" key={direction}><h4>{direction === 'arrival' ? '도착' : '출발'} · {{NRT:'나리타 공항',HND:'하네다 공항'}[leg.airport] || leg.airport}</h4><div className="budget-transport-line"><span>{leg.cheapLabel}</span><b>{yenAmount(leg.cheapYen)}</b></div><div className="budget-transport-line"><span>{leg.fastLabel}</span><b>{yenAmount(leg.fastYen)}</b></div></div>; })}<div className="budget-transport-line is-final"><span>공항 이동 합계</span><b>{yenRange(airport.minYen,airport.maxYen)}</b></div></div>}
    {transport.days?.length > 0 && <details className="budget-transport-box budget-transport-days"><summary>날짜별 교통비 <small>1인 · 1일권 적용 전</small><span aria-hidden="true">⌄</span></summary><ul>{transport.days.map(day => <li key={day.dayNumber}><div><b>DAY {day.dayNumber}</b><small>{day.date} · {day.legs}구간</small></div><span>{yenRange(day.minYen,day.maxYen)}</span></li>)}</ul></details>}
    <div className="budget-explanation"><h3>교통비 계산 기준</h3>{transport.rentalCar && <p className="budget-rental-note">렌터카 비용은 포함 안 됨</p>}<p>{transport.note}</p></div>
  </section>;
}
