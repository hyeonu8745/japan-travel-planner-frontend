import { useEffect, useRef, useState } from 'react';
import { getRainPlan } from '../../api/weather';
import { displayName } from '../../utils/itineraryPresentation';
import WeatherIcon from './WeatherIcon';
import { canApplyRainPlan } from '../../utils/weatherPresentation';

export default function RainPlanDialog({tripId,dayNumber,onClose,onApply}) {
  const dialog = useRef(null), applying = useRef(false);
  const [plan,setPlan] = useState(null), [error,setError] = useState(''), [loading,setLoading] = useState(true), [saving,setSaving] = useState(false), [retry,setRetry] = useState(0);
  useEffect(()=>{ const element=dialog.current; element.showModal(); element.querySelector('#rain-plan-title')?.focus({preventScroll:true}); return ()=>element.close(); },[]);
  useEffect(()=>{
    const controller = new AbortController();
    Promise.resolve().then(async()=>{
      if(controller.signal.aborted)return;
      setLoading(true);setError('');setPlan(null);
      try { const data=await getRainPlan(tripId,dayNumber,{signal:controller.signal});if(!controller.signal.aborted)setPlan(data); }
      catch(err){if(!controller.signal.aborted)setError(err.message);}
      finally {if(!controller.signal.aborted)setLoading(false);}
    });
    return ()=>controller.abort();
  },[tripId,dayNumber,retry]);
  const apply=async()=>{
    if(applying.current || !canApplyRainPlan(plan))return;
    applying.current=true;setSaving(true);setError('');
    try{await onApply(dayNumber,plan.version);}
    catch(err){setError(err.message);if([400,409].includes(err.status))setPlan(null);}
    finally{applying.current=false;setSaving(false);}
  };
  return <dialog ref={dialog} className="rain-plan-dialog" aria-labelledby="rain-plan-title" onCancel={event=>{event.preventDefault();if(!applying.current)onClose();}}>
    <header><div className="rain-plan-top"><small>RAINY DAY ALTERNATIVE</small><button type="button" disabled={saving} onClick={onClose} aria-label="비 오는 날 대안 닫기"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div className="rain-plan-heading"><span className="rain-plan-weather"><WeatherIcon condition="RAIN"/></span><div><h2 id="rain-plan-title" tabIndex={-1}>비가 와도, 여행은 계속</h2><p>DAY {dayNumber} · 비 오는 날 대안 일정</p></div></div></header>
    <div className="rain-plan-body">{loading && <p role="status">실내 대안을 찾고 있어요…</p>}{error && <div className="rain-plan-error" role="alert"><p>{error}</p><button type="button" disabled={saving} onClick={()=>setRetry(value=>value+1)}>대안 다시 확인</button></div>}
    {plan && <><p className="rain-plan-message"><span aria-hidden="true">☂</span><span>{plan.message}</span></p>{plan.swaps?.length>0 && <section className="rain-plan-swaps"><div className="rain-plan-section-heading"><h3>이렇게 바뀌어요</h3><span>{plan.swaps.length}곳 변경</span></div><ul>{plan.swaps.map((swap,index)=><li key={`${swap.stopId}:${index}`}><div className="rain-plan-from"><small>기존 장소</small><p>{displayName(swap.from)}</p></div><span className="rain-plan-arrow" aria-hidden="true">→</span><div className="rain-plan-to"><small>대안 장소</small><b>{displayName(swap.to)}</b>{swap.to?.nameKo && swap.to?.name && <span>{swap.to.name}</span>}</div></li>)}</ul></section>}
    {plan.keptOutdoor?.length>0 && <div className="rain-plan-kept"><h3>야외 장소로 남는 곳</h3><p>{plan.keptOutdoor.join(' · ')}</p></div>}
    {plan.warnings?.length>0 && <ul className="rain-plan-warnings">{plan.warnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul>}
    {plan.stops?.length>0 && <section className="rain-plan-preview"><div className="rain-plan-section-heading"><h3>하루 일정 미리보기</h3>{plan.stops.some(stop=>stop.swapped) && <span className="rain-plan-key"><i aria-hidden="true"/>변경된 장소</span>}</div><ol>{plan.stops.map((stop,index)=>{const swap=stop.swapped?plan.swaps?.find(item=>item.order===stop.order):null;return <li key={`${stop.order}:${index}`} className={stop.swapped?'is-swapped':''}><time>{stop.arrival?.slice(0,5)}{stop.departure && <span>{stop.departure.slice(0,5)}</span>}</time><span className="rain-plan-dot" aria-hidden="true"/><div className="rain-plan-stop"><small>{stop.type==='LUNCH'?'점심':stop.type==='DINNER'?'저녁':'관광지'} · {stop.order}{stop.swapped && <em>변경</em>}</small><b>{displayName(stop)}</b>{stop.nameKo && stop.name && <span>{stop.name}</span>}{swap && <span className="rain-plan-previous">{displayName(swap.from)} 대신</span>}</div></li>;})}</ol></section>}</>}
    </div><footer><p>미리보기예요. 적용하면 이 날 일정만 바뀌어요.</p><div><button type="button" disabled={saving} onClick={onClose}>닫기</button>{canApplyRainPlan(plan) && <button className="rain-plan-apply" type="button" disabled={loading||saving} onClick={apply}>{saving?'일정 바꾸는 중…':<>이 날 일정 바꾸기 <span aria-hidden="true">→</span></>}</button>}</div></footer>
  </dialog>;
}
