import PanelIcon from './PanelIcon';
import PlaceArtwork from './PlaceArtwork';
import { VERDICT_LABELS, krwRange, mealStop } from '../../utils/budgetPresentation';
import '../../styles/budgetPosterDesign.css';

export default function BudgetPanel({ budget, loading, error, onRetry, itinerary, busy, onOpenMeal }) {
  const rate = itinerary?.exchangeRate ?? { krwPerYen: budget?.krwPerYen, date: budget?.exchangeRateDate, sourceLabel: budget?.exchangeRateSourceLabel };
  const rateValue = rate?.krwPerYen ?? itinerary?.krwPerYen;
  const hasRate = Number.isFinite(rateValue) && rateValue > 0;
  const unknown = budget?.verdict === 'UNKNOWN';
  return <section className="detail budget-panel" aria-labelledby="budget-title">
    <header className="budget-heading"><div><small>TRAVEL FOOD BUDGET</small><h1 id="budget-title">여행 식비</h1><p>식사에 얼마나 쓸지, 날짜별로 살펴보세요.</p></div><span className="budget-heading-icon"><PanelIcon name="food"/></span></header>
    <div className="budget-content">
      {loading && <div className="budget-state" role="status"><PanelIcon name="clock"/><p>최신 일정의 식비를 계산하고 있어요…</p></div>}
      {error && <div className="budget-state" role="alert"><p>{error}</p><button type="button" onClick={onRetry}>다시 불러오기</button></div>}
      {!loading && !error && budget && <>
        {hasRate && <section className="budget-exchange budget-rate-card" aria-label="기준 환율"><span className="budget-rate-icon"><PanelIcon name="card"/></span><div className="budget-rate-amount"><small>기준 환율</small><b>100엔 = {Math.round(rateValue * 100).toLocaleString('ko-KR')}원</b></div><div className="budget-rate-source"><b>{[rate?.date?.replaceAll('-', '.'), rate?.sourceLabel || '고정 환율'].filter(Boolean).join(' · ')}</b><p>실제 환전에는 수수료가 붙을 수 있어요.</p></div></section>}
        <section className="budget-overview" aria-label="예상 식비"><div className="budget-overview-top"><span>예상 식비</span><b className={`food-verdict verdict-${budget.verdict?.toLowerCase()}`}>{VERDICT_LABELS[budget.verdict] || VERDICT_LABELS.UNKNOWN}</b></div>
          <strong className="budget-total">{unknown ? '확인 어려움' : krwRange(budget.food?.minKrw, budget.food?.maxKrw)}</strong>
          <div className="budget-overview-meta"><span><PanelIcon name="people"/>{budget.travelers}명 기준</span><span><PanelIcon name="food"/>점심·저녁</span></div>
          {budget.travelers > 1 && <p className="budget-per-person">1인 {unknown ? '확인 어려움' : krwRange(budget.perPerson?.minKrw, budget.perPerson?.maxKrw)}</p>}
        </section>
        {['MAYBE_OVER','OVER'].includes(budget.verdict) && <div className="budget-caution"><PanelIcon name="info"/><p>아래 식당의 상세를 확인하고 다른 식당으로 바꿀 수 있어요.</p></div>}
        <section className="budget-explanation" aria-label="계산 기준"><h2><PanelIcon name="info"/>식비 계산 기준</h2><p>일정에 포함된 점심·저녁 식당의 1인 예산 범위(타베로그)를 합산하고, 인원수와 기준 환율을 반영했어요.</p><p>{budget.note}</p>{(!budget.note?.includes('아침') || !budget.note?.includes('간식')) && <p>아침·간식은 포함하지 않았어요.</p>}<p>{budget.food?.unknownMeals > 0 ? `예산 정보가 없는 식당 ${budget.food.unknownMeals}곳은 빠졌어요` : '예산 정보가 없는 식당은 합계에서 제외돼요.'}</p></section>
        <section className="budget-day-section" aria-labelledby="budget-days-title"><div className="budget-section-title"><h2 id="budget-days-title"><PanelIcon name="calendar"/>날짜별 식비</h2><small>날짜 합계는 일행 전체 기준</small></div>
          <div className="budget-day-list">{budget.days?.map((day,index) => <details className="budget-day-card" key={day.dayNumber} open={index === 0}>
            <summary><span className="budget-day-number">{String(day.dayNumber).padStart(2,'0')}</span><span className="budget-day-date"><b>DAY {day.dayNumber}</b><small>{day.date}</small></span><span className="budget-day-total">{krwRange(day.minKrw,day.maxKrw)}<small>일행 전체</small></span><span className="budget-day-chevron" aria-hidden="true">⌄</span></summary>
            <ul>{day.meals?.map((meal,mealIndex) => {
              const stop = mealStop(itinerary,day.dayNumber,meal);
              const price = meal.budgetText && meal.budgetText !== '-' ? meal.budgetText : '예산 정보 없음';
              return <li className="budget-meal" key={`${meal.type}-${mealIndex}`}><span className="budget-meal-art"><PlaceArtwork type={meal.type} place={{...stop?.restaurant,...meal}}/></span><div className="budget-meal-copy"><small>{meal.type === 'LUNCH' ? '점심' : meal.type === 'DINNER' ? '저녁' : meal.type}</small><b>{meal.nameKo || meal.name}</b>{meal.nameKo && <span>{meal.name}</span>}<p>{price}<em>1인 기준</em></p></div>{stop && <button type="button" disabled={busy} onClick={()=>onOpenMeal(day.dayNumber,stop.order)} aria-label={`${meal.nameKo || meal.name} 상세 보기`}>상세 <span aria-hidden="true">↗</span></button>}</li>;
            })}</ul>
          </details>)}</div>
        </section>

      </>}
    </div>
  </section>;
}
