import { useCallback, useEffect, useRef, useState } from 'react';
import DayPage from "../components/DayPage";
import { getItinerary } from "../api/itinerary";
import TabiWordmark from "../components/TabiWordmark";
import PanelIcon from "../components/planner/PanelIcon";
import "../styles/budgetPosterDesign.css";
import { Link, useParams } from 'react-router-dom';
import { getTrip } from '../api/trips';
import { createPoster, getLatestPoster, getPosterImage, getItineraryBudget } from '../api/itineraryExtras';
import { HAS_ITINERARY } from '../utils/tripStatus';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import '../styles/api1012.css';
import '../styles/posterViewer.css';
import '../styles/postcardStudio.css';

const STYLES = [{value:'WATERCOLOR', label:'수채화', hint:'부드러운 여행 그림'}, {value:'RETRO', label:'레트로', hint:'빈티지 여행 포스터'}, {value:'MINIMAL', label:'미니멀', hint:'간결하고 차분하게'}, {value:'STICKER', label:'스티커', hint:'여행의 조각을 모아서'}];
const STATUS = { GENERATING: '포스터를 그리고 있어요', DONE: '포스터가 준비됐어요', FAILED: '일부 포스터를 만들지 못했어요' };

function PosterImage({ tripId, posterId, page, onReady }) {
  const [retry, setRetry] = useState(0);
  const identity = `${posterId}:${page.pageNo}`;
  useEffect(() => {
    const controller = new AbortController(); let url;
    Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      onReady(identity, null);
      try {
        const blob = await getPosterImage(tripId, posterId, page.pageNo, { signal: controller.signal });
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        const value = { blob, url, pageNo: page.pageNo }; onReady(identity, value);
      } catch (err) { if (!controller.signal.aborted) { onReady(identity, { error: err.message, retry: () => setRetry(value => value + 1) }); } }
    });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); onReady(identity, null); };
  }, [tripId, posterId, page.pageNo, identity, retry, onReady]);
  return null;
}

export default function PosterPage() {
  const { tripId } = useParams();
  const [itinerary, setItinerary] = useState(null);
  const [budget, setBudget] = useState(null);
  useEffect(() => { let active = true; getItineraryBudget(tripId).then(value => { if (active) setBudget(value); }).catch(() => { if (active) setBudget(null); }); return () => { active = false; }; }, [tripId]);
  useEffect(() => { let active = true; getItinerary(tripId).then(value => { if (active) setItinerary(value); }).catch(() => { if (active) setItinerary(null); }); return () => { active = false; }; }, [tripId]);
  const [trip, setTrip] = useState(null), [poster, setPoster] = useState(null);
  const [loading, setLoading] = useState(true), [creating, setCreating] = useState(false), [printing, setPrinting] = useState(false);
  const [error, setError] = useState(''), [retry, setRetry] = useState(0), [images, setImages] = useState({});
  const creatingRef = useRef(false), epoch = useRef(0), zoomDialog = useRef(null);
  const pdfPagesRef = useRef(null);
  const pdfBusyRef = useRef(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });
  const [selected, setSelected] = useState(null);
  const [style, setStyle] = useState('WATERCOLOR'), [character, setCharacter] = useState('');
  const optionsDisabled = loading || creating || poster?.status === 'GENERATING';
  const serverPages = [...(poster?.pages ?? [])].sort((a, b) => a.pageNo - b.pageNo);
  const decoration = serverPages.find(page => page.kind === 'DECORATION');
  const backgroundUrl = decoration && images[`${poster.id}:${decoration.pageNo}`]?.url;
  const pages = [
    ...serverPages.filter(page => page.kind !== 'DECORATION').map(page => ({ ...page, key: `image-${page.pageNo}` })),
    ...(poster ? itinerary?.days ?? [] : []).map(day => ({ kind: 'DAY', day, key: `day-${day.dayNumber}`, status: 'DONE' })),
  ];
  const current = pages.find(page => page.key === selected) || pages[0];
  const currentIndex = pages.indexOf(current);
  const currentImage = current?.kind !== 'DAY' && current ? images[`${poster.id}:${current.pageNo}`] : null;
  const pageTitle = page => page.kind === 'COVER' ? '일러스트 지도' : page.kind === 'DAY' ? `상세 일정표 DAY ${page.day.dayNumber}` : '상세 일정표';
  const pageState = page => page.status === 'DONE' ? '준비 완료' : page.status === 'FAILED' || poster?.status === 'FAILED' ? '생성 실패' : '그리는 중';
  const download = () => { if (!currentImage?.url) return; const a = document.createElement('a'); a.href = currentImage.url; a.download = `tabimate-poster-${current.pageNo}.png`; document.body.append(a); a.click(); a.remove(); };
  const imageReady = useCallback((identity, image) => setImages((previous) => {
    if (previous[identity] === image) return previous;
    const next = { ...previous }; if (image) next[identity] = image; else delete next[identity]; return next;
  }), []);
  useEffect(() => {
    const controller = new AbortController(), request = ++epoch.current;
    Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true); setError(''); setPoster(null); setTrip(null); setStyle('WATERCOLOR'); setCharacter('');
      const [t, p] = await Promise.allSettled([getTrip(tripId), getLatestPoster(tripId, { signal: controller.signal })]);
      if (controller.signal.aborted || request !== epoch.current) return;
      if (t.status === 'fulfilled') setTrip(t.value); else setError(t.reason.message);
      if (p.status === 'fulfilled') { setPoster(p.value); setStyle(STYLES.some(option => option.value === p.value?.style) ? p.value.style : 'WATERCOLOR'); setCharacter(p.value?.character ?? ''); } else if (p.reason.status !== 404) setError(p.reason.message);
      setLoading(false);
    });
    return () => { controller.abort(); epoch.current += 1; };
  }, [tripId, retry]);
  useEffect(() => {
    if (poster?.status !== 'GENERATING') return undefined;
    const controller = new AbortController(), request = epoch.current; let timer;
    const poll = async () => {
      try {
        const latest = await getLatestPoster(tripId, { signal: controller.signal });
        if (controller.signal.aborted || request !== epoch.current) return;
        setPoster(latest); setError('');
        if (latest.status === 'GENERATING') timer = setTimeout(poll, 5000);
      } catch (err) { if (!controller.signal.aborted && request === epoch.current) setError(err.message); }
    };
    timer = setTimeout(poll, 5000);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [tripId, poster?.id, poster?.status]);
  const generate = async () => {
    if (creatingRef.current || loading || poster?.status === 'GENERATING') return;
    const description = character.trim();
    if (description.length > 50) { setError('캐릭터 설명은 50자 이하로 입력해주세요.'); return; }
    creatingRef.current = true; setCreating(true); setError(''); const request = epoch.current;
    try { const created = await createPoster(tripId, { style, ...(description ? { character: description } : {}) }); if (request === epoch.current) setPoster(created); }
    catch (err) { if (request === epoch.current) setError(err.message); }
    finally { creatingRef.current = false; if (request === epoch.current) setCreating(false); }
  };
  const donePages = poster?.pages?.filter(page => page.status === 'DONE' && page.kind !== 'DECORATION') ?? [];
  const covers = serverPages.filter(page => page.kind === 'COVER');
  const coverImages = covers.map(page => images[`${poster.id}:${page.pageNo}`]);
  const decorationImage = decoration && images[`${poster.id}:${decoration.pageNo}`];
  const canPrint = Boolean(itinerary?.days?.length && covers.length && covers.every((page, index) => page.status === 'DONE' && coverImages[index]?.blob) && poster?.status !== 'GENERATING' && (!decoration || decoration.status === 'FAILED' || decorationImage?.url || decorationImage?.error));
  const print = async () => {
    if (pdfBusyRef.current || !canPrint) return;
    pdfBusyRef.current = true;
    setPrinting(true);
    setError('');
    const total = covers.length + itinerary.days.length;
    setPdfProgress({ current: 0, total });
    try {
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let completed = 0;
      for (const image of coverImages) {
        if (completed) pdf.addPage();
        const bytes = new Uint8Array(await image.blob.arrayBuffer());
        pdf.addImage(bytes, undefined, 0, 0, 210, 297);
        setPdfProgress({ current: ++completed, total });
      }
      const dayNodes = pdfPagesRef.current?.querySelectorAll('.day-page') ?? [];
      if (dayNodes.length !== itinerary.days.length) throw new Error('일정표를 준비하지 못했어요. 다시 시도해주세요.');
      for (const node of dayNodes) {
        const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
        setPdfProgress({ current: ++completed, total });
      }
      const filename = (trip?.title || '나의 여행').replace(/[\\/:*?"<>|]/g, '_');
      pdf.save(`${filename}_포스터.pdf`);
    } catch (err) {
      setError(err.message || 'PDF를 만들지 못했어요. 다시 시도해주세요.');
    } finally {
      pdfBusyRef.current = false;
      setPrinting(false);
    }
  };
  return <div className="poster-studio postcard-studio">
    <header className="tabi-header poster-nav"><TabiWordmark /><nav aria-label="여행 메뉴">
      <Link to="/trips">내 여행</Link>
      <Link to={`/trips/${tripId}/planner`}>일정으로 돌아가기</Link>
    </nav></header>
    <main className="poster-page">
    <header className="poster-studio-heading"><div><h1>{trip?.title || '나의 여행'} 포스터</h1><p>그림 지도와 하루별 상세 일정표를 한 파일로 간직하세요.</p></div>
      <img className="studio-scenery" src="/assets/postcards/japan-postcards.jpg" alt="" />
    </header>
    <details className="studio-settings" key={poster ? 'existing' : 'new'} open={!poster}>
      <summary>포스터 스타일과 캐릭터</summary>
    <div className="poster-customization">
      <fieldset className="poster-style-picker" disabled={optionsDisabled}><legend>포스터 스타일</legend><div>{STYLES.map(option => <label key={option.value} className={`poster-style-choice${style === option.value ? ' is-selected' : ''}`}><input type="radio" name="poster-style" value={option.value} checked={style === option.value} onChange={() => setStyle(option.value)}/><span><b>{option.label}</b><small>{option.hint}</small></span></label>)}</div></fieldset>
      <div className="poster-character-field"><label htmlFor="poster-character">캐릭터 <span>(선택)</span></label><div className="poster-character-input"><input id="poster-character" type="text" value={character} maxLength={50} disabled={optionsDisabled} placeholder="예) 안경 쓴 회색 고양이" aria-describedby="poster-character-help" onChange={event => setCharacter(event.target.value)}/><span>{character.length}/50</span></div><p id="poster-character-help">기존 캐릭터 이름 대신 생김새를 설명해주세요. 비워두면 AI가 자유롭게 그려요.</p></div>
    </div>
    </details>
    <div className="poster-controls"><div className="poster-primary-controls"><button className="poster-create" type="button" disabled={loading || creating || !HAS_ITINERARY.includes(trip?.status) || poster?.status === 'GENERATING' || poster?.remainingToday === 0} onClick={generate}><PanelIcon name="pin"/>{creating ? '요청 중…' : poster?.status === 'GENERATING' ? '포스터 만드는 중…' : poster ? '포스터 다시 만들기' : '포스터 만들기'}</button><span className="poster-remaining">{poster?.remainingToday != null ? `남은 횟수 ${poster.remainingToday}회 · 24시간에 3회` : '24시간에 3회까지 · 남은 횟수는 생성 후 표시돼요'}</span></div><button type="button" className="poster-print" disabled={!canPrint || printing} onClick={print}><PanelIcon name="card"/>{printing ? `PDF 만드는 중… (${pdfProgress.current}/${pdfProgress.total})` : 'PDF로 저장 (전체)'}</button></div>
    {!loading && trip && !HAS_ITINERARY.includes(trip.status) && <p>일정을 먼저 만들어주세요.</p>}

    {poster?.stale && <p className="poster-notice poster-stale">일정이 바뀌었어요. 포스터를 다시 만들까요?</p>}
    {loading && <p role="status">포스터를 불러오고 있어요…</p>}
    {error && <div className="poster-error" role="alert"><p>{error}</p><button type="button" disabled={creating} onClick={() => setRetry((value) => value + 1)}>상태 다시 확인</button></div>}
    {poster && <p className="poster-result-options">현재 포스터 · {STYLES.find(option => option.value === poster.style)?.label || (poster.style ? poster.style : '수채화')} · {poster.character || '캐릭터 AI 자유'}</p>}
    {poster && <p className={`poster-generation-status${poster.status === "GENERATING" ? " is-generating" : ""}`} role="status">{STATUS[poster.status] || poster.status}{poster.status === 'GENERATING' && ' · 한 장에 수십 초에서 1분 이상 걸릴 수 있어요.'}</p>}
    {poster?.errorMessage && <p className="poster-error" role="alert">{poster.errorMessage}</p>}
    {poster?.status === 'FAILED' && donePages.length > 0 && <p>완성된 장은 저장하거나 PDF로 출력할 수 있어요.</p>}
    {!loading && !error && !poster && <section className="poster-empty"><span className="poster-empty-paper"><PanelIcon name="pin"/></span><div><h2>첫 여행 포스터를 만들어보세요</h2><p>지도 다음 장부터는 하루씩 상세 일정표가 이어져요.</p></div></section>}
    {(poster?.pages ?? []).filter(page => page.status === 'DONE').map(page => <PosterImage key={`${tripId}:${poster.id}:${page.pageNo}`} tripId={tripId} posterId={poster.id} page={page} onReady={imageReady}/>)}
    {current && <div className="poster-workspace">
      <section className="poster-active-view" aria-label="선택한 포스터">
        <div className="poster-sheet-label"><span>{String(currentIndex + 1).padStart(2,'0')}</span><div><b>{pageTitle(current)}</b><small>{currentIndex + 1}번째 장</small></div><em className={current.status === 'DONE' ? 'is-done' : pageState(current) === '생성 실패' ? 'is-failed' : ''}>{pageState(current)}</em></div>
        <div className="poster-active-view-paper">{current.kind === "DAY" ? <div className="poster-day-preview"><DayPage day={current.day} title={trip?.title} pageNo={currentIndex + 1} backgroundUrl={backgroundUrl} budget={budget} isFirst={current.day === itinerary?.days?.[0]} isLast={current.day === itinerary?.days?.at(-1)} /></div> : currentImage?.url ? <img src={currentImage.url} alt={`${current.pageNo}장 ${pageTitle(current)}`}/> : currentImage?.error ? <div className="poster-placeholder" role="alert"><p>{currentImage.error}</p><button type="button" onClick={currentImage.retry}>이미지 다시 불러오기</button></div> : <div className="poster-placeholder" role="status">{current.status === 'DONE' ? '이미지를 불러오고 있어요…' : pageState(current) === '생성 실패' ? '이 장을 만들지 못했어요' : `${current.pageNo}장을 그리고 있어요…`}</div>}</div>
        <div className="poster-viewer-footer"><div className="poster-pagination"><button type="button" aria-label="이전 포스터" disabled={currentIndex <= 0} onClick={() => setSelected(pages[currentIndex-1].key)}>←</button><span>{currentIndex+1} / {pages.length}</span><button type="button" aria-label="다음 포스터" disabled={currentIndex >= pages.length-1} onClick={() => setSelected(pages[currentIndex+1].key)}>→</button></div><div className="poster-save-controls">{current.kind !== "DAY" && <><button type="button" disabled={!currentImage?.url} onClick={() => zoomDialog.current.showModal()}>크게 보기 ↗</button>{current.kind === "COVER" && <button type="button" className="poster-download" disabled={!currentImage?.url} onClick={download}>PNG 저장 ↓</button>}</>}</div></div>
      </section>
      <aside className="poster-collection" aria-label="포스터 구성"><header><h2>포스터 구성</h2><span>{pages.length}장</span></header><div className="poster-thumbnail-list">{pages.map((page, index) => { const image = images[`${poster.id}:${page.pageNo}`]; return <button type="button" key={page.key} className={`poster-thumbnail${page.key === current.key ? ' is-selected' : ''}`} aria-pressed={page.key === current.key} onClick={() => setSelected(page.key)}><span className="poster-thumbnail-art">{page.kind === "DAY" ? backgroundUrl ? <img src={backgroundUrl} alt="" /> : <span>상세 일정표</span> : image?.url ? <img src={image.url} alt=""/> : <PanelIcon name="pin"/>}</span><span className="poster-thumbnail-copy"><small>{String(index + 1).padStart(2,'0')}</small><b>{pageTitle(page)}</b><span className={page.status === 'DONE' ? 'is-done' : pageState(page) === '생성 실패' ? 'is-failed' : ''}>{pageState(page)}</span></span><span className="poster-thumbnail-arrow">›</span></button>; })}</div><p className="poster-collection-note">지도 다음 장부터는 하루씩 상세 일정표예요. PDF로 저장하면 전부 한 파일로 받아져요.</p></aside>
    </div>}
    <div className="poster-pdf-pages" ref={pdfPagesRef} aria-hidden="true">
      {itinerary?.days?.map((day, index) => <div className="poster-pdf-page" key={day.dayNumber}><DayPage day={day} title={trip?.title} pageNo={covers.length + index + 1} backgroundUrl={backgroundUrl} budget={budget} isFirst={index === 0} isLast={index === itinerary.days.length - 1} /></div>)}
    </div>
    <p className="poster-notice">AI가 그린 그림이라 글자나 그림이 일정과 조금 다를 수 있어요. 정확한 시각·장소는 일정 화면을 기준으로 해 주세요.</p>
    <dialog ref={zoomDialog} className="poster-zoom" aria-label="포스터 크게 보기"><div className="poster-zoom-toolbar"><b>{current?.pageNo}장 · {current && pageTitle(current)}</b><button type="button" onClick={() => zoomDialog.current.close()} autoFocus>닫기 ×</button></div>{currentImage?.url && <img src={currentImage.url} alt={`${current.pageNo}장 ${pageTitle(current)}`}/>}</dialog>
  </main></div>;
}
