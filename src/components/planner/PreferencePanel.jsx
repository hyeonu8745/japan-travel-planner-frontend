import PanelIcon from './PanelIcon';
import { preferenceFoods } from '../../utils/preferenceArtwork';

const LABELS = { FOOD_PREFER: '좋아하는 음식', FOOD_AVOID: '피할 음식', ATMOSPHERE: '분위기', MOBILITY: '이동', SMOKING: '흡연', SCHEDULE: '일정', ETC: '기타' };
const formatTime = value => value ? value.slice(0, 5) : '모름';

function PreferenceGroup({ title, icon, items, tone = '', count = items.length, children }) {
  if (!items.length) return null;
  return <section className={`taste-group ${tone}`} aria-label={title}>
    <h3><PanelIcon name={icon} />{title}<span className="taste-count">{count}</span></h3>
    {children ?? <ul className="taste-items">{items.map((item, index) => <li key={index}>
      {['분위기·흡연', '이동·일정', '기타 취향'].includes(title) && <small>{LABELS[item.category] ?? '기타'}</small>}
      <p>{item.description}</p>
    </li>)}</ul>}
  </section>;
}

export default function PreferencePanel({ preference, onOpenChat }) {
  const constraints = preference.constraints ?? [];
  const liked = constraints.filter(item => item.category === 'FOOD_PREFER');
  const foods = [...new Map(liked.flatMap(item => preferenceFoods(item.description)).map(food => [food.key, food])).values()];
  const avoided = constraints.filter(item => item.category === 'FOOD_AVOID');
  const atmosphere = constraints.filter(item => ['ATMOSPHERE', 'SMOKING'].includes(item.category));
  const journey = constraints.filter(item => ['MOBILITY', 'SCHEDULE'].includes(item.category));
  const other = constraints.filter(item => !['FOOD_PREFER', 'FOOD_AVOID', 'ATMOSPHERE', 'SMOKING', 'MOBILITY', 'SCHEDULE'].includes(item.category));
  return <section className="detail taste-panel" aria-labelledby="taste-title">
    <header className="taste-heading"><small>TRAVEL PREFERENCES</small><h1 id="taste-title">파악한 취향</h1><p>대화에서 알려주신 취향을 정리했어요.</p></header>
    <div className="taste-content">
      {preference.summary && <section className="taste-summary" aria-label="Tabi AI 요약">
        <div><img src="/assets/ui-v2/ai-spark.svg" alt="" aria-hidden="true" /><span>Tabi AI 요약</span></div>
        <p>{preference.summary}</p>
      </section>}
      <dl className="taste-stats">
        <div><PanelIcon name="calendar" /><dt>첫날 도착</dt><dd>{formatTime(preference.arrivalTime)}</dd></div>
        <div><PanelIcon name="clock" /><dt>마지막 날 출발</dt><dd>{formatTime(preference.departureTime)}</dd></div>
        <div><PanelIcon name="card" /><dt>식비 비중</dt><dd>{Math.round((preference.foodBudgetRatio ?? 0.4) * 100)}<span>%</span></dd></div>
      </dl>
      {constraints.length === 0 && <div className="taste-empty"><img src="/assets/ui-v2/ai-spark.svg" alt="" aria-hidden="true" /><h2>어떤 여행을 좋아하세요?</h2><p>AI와 대화하면 좋아하는 음식과 여행 방식이<br />여기에 하나씩 정리돼요.</p></div>}
      <PreferenceGroup title="좋아하는 음식" icon="food" items={liked} count={foods.length || liked.length} tone="taste-liked">
        {foods.length > 0 && <ul className="taste-food-grid" data-count={foods.length}>{foods.map(food => <li key={food.key}><div className="taste-food-visual"><img src={`/assets/food-v2/${food.key}.png`} alt="" aria-hidden="true" loading="lazy" /></div><p>{food.label}</p></li>)}</ul>}
        <ul className="taste-food-descriptions" aria-label="대화에서 알려주신 음식 취향">{liked.map((item, index) => <li key={index}>{item.description}</li>)}</ul>
      </PreferenceGroup>
      <div className="taste-pair">
        <PreferenceGroup title="피할 음식" icon="food" items={avoided} tone="taste-avoid" />
        <PreferenceGroup title="분위기·흡연" icon="leaf" items={atmosphere} tone="taste-atmosphere" />
      </div>
      <PreferenceGroup title="이동·일정" icon="WALK" items={journey} tone="taste-journey" />
      <PreferenceGroup title="기타 취향" icon="pin" items={other} />
      <footer className="taste-note"><p>일정은 대화가 끝난 뒤 실제 식당·관광지 데이터로 만들어집니다.</p><button type="button" onClick={onOpenChat}>AI와 더 이야기하기 <span aria-hidden="true">↗</span></button></footer>
    </div>
  </section>;
}
