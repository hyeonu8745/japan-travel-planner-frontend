import { stopKindLabel } from '../../utils/stopPresentation';
import { VERDICT_LABELS, exchangeRateText, krwRange } from '../../utils/budgetPresentation';

export default function BudgetSummary({ budget, loading, error, onRetry, itinerary }) {
  if (error) return <section className="food-budget" aria-label="식비 요약"><p role="alert">{error}</p><button type="button" onClick={onRetry}>식비 다시 불러오기</button></section>;
  if (loading || !budget) return <section className="food-budget" role="status">식비를 계산하고 있어요…</section>;
  const rate = itinerary?.exchangeRate ?? { krwPerYen: budget.krwPerYen, date: budget.exchangeRateDate, sourceLabel: budget.exchangeRateSourceLabel };
  const rateText = exchangeRateText(rate, itinerary?.krwPerYen);
  return <section className="food-budget" aria-label="예상 식비">
    <div className="food-budget-head"><div><small>FOOD BUDGET</small><h3>예상 식비 {budget.verdict === 'UNKNOWN' ? '확인 어려움' : krwRange(budget.food?.minKrw, budget.food?.maxKrw)} <span>({budget.travelers}명)</span></h3></div><b className={`food-verdict verdict-${budget.verdict?.toLowerCase()}`}>{VERDICT_LABELS[budget.verdict] || VERDICT_LABELS.UNKNOWN}</b></div>
    {budget.travelers > 1 && <p>1인 {budget.verdict === 'UNKNOWN' ? '확인 어려움' : krwRange(budget.perPerson?.minKrw, budget.perPerson?.maxKrw)}</p>}
    <p className="food-budget-note">{budget.note}</p>
    <p className="food-budget-note">점심·저녁 기준이며 아침은 포함하지 않았어요.</p>
    {budget.food?.unknownMeals > 0 && <p className="food-budget-unknown">예산 정보가 없는 식당 {budget.food.unknownMeals}곳은 빠졌어요</p>}
    {rateText && <p className="exchange-rate">{rateText}<small>대략적인 금액이며 실제 환전에는 수수료가 붙을 수 있어요.</small></p>}
    {['MAYBE_OVER', 'OVER'].includes(budget.verdict) && <p className="food-budget-unknown">비싼 식당을 바꾸려면 식당을 눌러 [다른 식당으로 바꾸기]를 선택해주세요.</p>}
    <details className="food-budget-days"><summary>날짜별 식비 보기</summary>{budget.days?.map((day) => <details key={day.dayNumber}>
      <summary>DAY {day.dayNumber} · {day.date}<b>{krwRange(day.minKrw, day.maxKrw)} <small>일행 전체</small></b></summary>
      <ul>{day.meals?.map((meal, index) => <li key={`${meal.type}-${index}`}><span>{stopKindLabel(meal.type)} · {meal.nameKo || meal.name}</span><b>{meal.budgetText || '정보 없음'} <small>1인 기준</small></b></li>)}</ul>
    </details>)}</details>
  </section>;
}
