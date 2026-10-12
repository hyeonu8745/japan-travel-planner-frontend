import { useCallback, useEffect, useRef, useState } from 'react';
import Brand from "../components/Brand";
import PanelIcon from "../components/planner/PanelIcon";
import "../styles/budgetPosterDesign.css";
import { Link, useParams } from 'react-router-dom';
import { getTrip } from '../api/trips';
import { createPoster, getLatestPoster, getPosterImage } from '../api/itineraryExtras';
import { HAS_ITINERARY } from '../utils/tripStatus';
import { printPosterPages } from '../utils/posterPrint';
import '../styles/api1012.css';
import '../styles/posterViewer.css';

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
  const [trip, setTrip] = useState(null), [poster, setPoster] = useState(null);
  const [loading, setLoading] = useState(true), [creating, setCreating] = useState(false), [printing, setPrinting] = useState(false);
  const [error, setError] = useState(''), [retry, setRetry] = useState(0), [images, setImages] = useState({});
  const creatingRef = useRef(false), epoch = useRef(0), zoomDialog = useRef(null);
  const [selected, setSelected] = useState(null);
  const pages = [...(poster?.pages ?? [])].sort((a,b) => a.pageNo - b.pageNo);
  const current = pages.find(page => page.pageNo === selected) || pages[0];
  const currentIndex = pages.indexOf(current);
  const currentImage = current && images[`${poster.id}:${current.pageNo}`];
  const pageTitle = page => page.kind === 'COVER' ? '일러스트 지도' : '상세 일정표';
  const pageState = page => page.status === 'DONE' ? '준비 완료' : page.status === 'FAILED' || poster.status === 'FAILED' ? '생성 실패' : '그리는 중';
  const download = () => { if (!currentImage?.url) return; const a = document.createElement('a'); a.href = currentImage.url; a.download = `tabimate-poster-${current.pageNo}.png`; document.body.append(a); a.click(); a.remove(); };
  const imageReady = useCallback((identity, image) => setImages((previous) => {
    if (previous[identity] === image) return previous;
    const next = { ...previous }; if (image) next[identity] = image; else delete next[identity]; return next;
  }), []);
  useEffect(() => {
    const controller = new AbortController(), request = ++epoch.current;
    Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true); setError(''); setPoster(null); setTrip(null);
      const [t, p] = await Promise.allSettled([getTrip(tripId), getLatestPoster(tripId, { signal: controller.signal })]);
      if (controller.signal.aborted || request !== epoch.current) return;
      if (t.status === 'fulfilled') setTrip(t.value); else setError(t.reason.message);
      if (p.status === 'fulfilled') setPoster(p.value); else if (p.reason.status !== 404) setError(p.reason.message);
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
    creatingRef.current = true; setCreating(true); setError(''); const request = epoch.current;
    try { const created = await createPoster(tripId); if (request === epoch.current) setPoster(created); }
    catch (err) { if (request === epoch.current) setError(err.message); }
    finally { creatingRef.current = false; if (request === epoch.current) setCreating(false); }
  };
  const donePages = poster?.pages?.filter((page) => page.status === 'DONE') ?? [];
  const readyImages = donePages.map((page) => images[`${poster.id}:${page.pageNo}`]).filter(image => image?.url);
  const print = async () => { setPrinting(true); setError(''); try { await printPosterPages(readyImages); } catch (err) { setError(err.message); } finally { setPrinting(false); } };
  const canPrint = donePages.length > 0 && readyImages.length === donePages.length && poster.status !== 'GENERATING';
  return <div className="poster-studio"><main className="poster-page">
    <div className="poster-studio-brand"><Brand/><Link className="poster-back" to={`/trips/${tripId}/planner`}>← 일정으로 돌아가기</Link></div>
    <header className="poster-studio-heading"><div><small>TRAVEL POSTER STUDIO</small><h1>{trip?.title || '나의 여행'} 포스터</h1><p>여행의 동선과 일정을 한 장씩 담았어요.</p></div><span className="poster-studio-emblem"><PanelIcon name="pin"/></span></header>
    <div className="poster-controls"><div className="poster-primary-controls"><button className="poster-create" type="button" disabled={loading || creating || !HAS_ITINERARY.includes(trip?.status) || poster?.status === 'GENERATING' || poster?.remainingToday === 0} onClick={generate}><PanelIcon name="pin"/>{creating ? '요청 중…' : poster?.status === 'GENERATING' ? '포스터 만드는 중…' : poster ? '포스터 다시 만들기' : '포스터 만들기'}</button><span className="poster-remaining">{poster?.remainingToday != null ? `남은 횟수 ${poster.remainingToday}회 · 24시간에 3회` : '24시간에 3회까지 · 남은 횟수는 생성 후 표시돼요'}</span></div><button type="button" className="poster-print" disabled={!canPrint || printing} onClick={print}><PanelIcon name="card"/>{printing ? '인쇄 준비 중…' : 'PDF로 저장 / 인쇄'}</button></div>
    {!loading && trip && !HAS_ITINERARY.includes(trip.status) && <p>일정을 먼저 만들어주세요.</p>}

    {poster?.stale && <p className="poster-notice poster-stale">일정이 바뀌었어요. 포스터를 다시 만들까요?</p>}
    {loading && <p role="status">포스터를 불러오고 있어요…</p>}
    {error && <div className="poster-error" role="alert"><p>{error}</p><button type="button" disabled={creating} onClick={() => setRetry((value) => value + 1)}>상태 다시 확인</button></div>}
    {poster && <p className={`poster-generation-status${poster.status === "GENERATING" ? " is-generating" : ""}`} role="status">{STATUS[poster.status] || poster.status}{poster.status === 'GENERATING' && ' · 한 장에 수십 초에서 1분 이상 걸릴 수 있어요.'}</p>}
    {poster?.errorMessage && <p className="poster-error" role="alert">{poster.errorMessage}</p>}
    {poster?.status === 'FAILED' && donePages.length > 0 && <p>완성된 장은 저장하거나 PDF로 출력할 수 있어요.</p>}
    {!loading && !error && !poster && <section className="poster-empty"><span className="poster-empty-paper"><PanelIcon name="pin"/></span><div><h2>첫 여행 포스터를 만들어보세요</h2><p>1장은 여행 동선을 담은 일러스트 지도,<br/>다음 장은 이틀씩 묶은 상세 일정표예요.</p></div></section>}
    {donePages.map(page => <PosterImage key={`${tripId}:${poster.id}:${page.pageNo}`} tripId={tripId} posterId={poster.id} page={page} onReady={imageReady}/>)}
    {current && <div className="poster-workspace">
      <section className="poster-active-view" aria-label="선택한 포스터">
        <div className="poster-sheet-label"><span>{String(current.pageNo).padStart(2,'0')}</span><div><b>{pageTitle(current)}</b><small>{current.pageNo}번째 장</small></div><em className={current.status === 'DONE' ? 'is-done' : pageState(current) === '생성 실패' ? 'is-failed' : ''}>{pageState(current)}</em></div>
        <div className="poster-active-view-paper">{currentImage?.url ? <img src={currentImage.url} alt={`${current.pageNo}장 ${pageTitle(current)}`}/> : currentImage?.error ? <div className="poster-placeholder" role="alert"><p>{currentImage.error}</p><button type="button" onClick={currentImage.retry}>이미지 다시 불러오기</button></div> : <div className="poster-placeholder" role="status">{current.status === 'DONE' ? '이미지를 불러오고 있어요…' : pageState(current) === '생성 실패' ? '이 장을 만들지 못했어요' : `${current.pageNo}장을 그리고 있어요…`}</div>}</div>
        <div className="poster-viewer-footer"><div className="poster-pagination"><button type="button" aria-label="이전 포스터" disabled={currentIndex <= 0} onClick={() => setSelected(pages[currentIndex-1].pageNo)}>←</button><span>{currentIndex+1} / {pages.length}</span><button type="button" aria-label="다음 포스터" disabled={currentIndex >= pages.length-1} onClick={() => setSelected(pages[currentIndex+1].pageNo)}>→</button></div><div className="poster-save-controls"><button type="button" disabled={!currentImage?.url} onClick={() => zoomDialog.current.showModal()}>크게 보기 ↗</button><button type="button" disabled={!currentImage?.url} onClick={download}>PNG 저장 ↓</button></div></div>
      </section>
      <aside className="poster-collection" aria-label="포스터 구성"><header><h2>포스터 구성</h2><span>{donePages.length} / {pages.length}장 준비</span></header><div className="poster-thumbnail-list">{pages.map(page => { const image = images[`${poster.id}:${page.pageNo}`]; return <button type="button" key={page.pageNo} className={`poster-thumbnail${page === current ? ' is-selected' : ''}`} aria-pressed={page === current} onClick={() => setSelected(page.pageNo)}><span className="poster-thumbnail-art">{image?.url ? <img src={image.url} alt=""/> : <PanelIcon name="pin"/>}</span><span className="poster-thumbnail-copy"><small>{String(page.pageNo).padStart(2,'0')}</small><b>{pageTitle(page)}</b><span className={page.status === 'DONE' ? 'is-done' : pageState(page) === '생성 실패' ? 'is-failed' : ''}>{pageState(page)}</span></span><span className="poster-thumbnail-arrow">›</span></button>; })}</div><p className="poster-collection-note">첫 장은 여행 동선을 담은 일러스트 지도,<br/>다음 장부터는 이틀씩 묶은 상세 일정표예요.</p></aside>
    </div>}
    <p className="poster-notice">AI가 그린 그림이라 글자나 그림이 일정과 조금 다를 수 있어요. 정확한 시각·장소는 일정 화면을 기준으로 해 주세요.</p>
    <dialog ref={zoomDialog} className="poster-zoom" aria-label="포스터 크게 보기"><div className="poster-zoom-toolbar"><b>{current?.pageNo}장 · {current && pageTitle(current)}</b><button type="button" onClick={() => zoomDialog.current.close()} autoFocus>닫기 ×</button></div>{currentImage?.url && <img src={currentImage.url} alt={`${current.pageNo}장 ${pageTitle(current)}`}/>}</dialog>
  </main></div>;
}
