import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLatestPoster, getPosterImage } from '../api/itineraryExtras';
import { HAS_ITINERARY } from '../utils/tripStatus';
import '../styles/api1012.css';
import '../styles/archivePreview.css';

const statusLabels = { GENERATING: '그리는 중', DONE: '포스터 준비 완료', FAILED: '일부 생성 실패' };

function ArchiveCard({ trip }) {
  const dialog = useRef(null);
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let url;
    async function load() {
      let poster;
      try {
        poster = await getLatestPoster(trip.id, { signal });
      } catch (err) {
        if (!signal.aborted) setResult({ error: err.status === 404 ? '' : err.message });
        return;
      }
      if (signal.aborted) return;
      setResult({ poster });
      const cover = poster?.pages?.find(page => page.kind === 'COVER' && page.status === 'DONE');
      if (!cover) return;
      try {
        const blob = await getPosterImage(trip.id, poster.id, cover.pageNo, { signal });
        if (signal.aborted) return;
        url = URL.createObjectURL(blob);
        setResult({ poster, url });
      } catch {
        if (!signal.aborted) setResult({ poster, error: '표지를 불러오지 못했어요. 포스터 화면에서 다시 확인해 주세요.' });
      }
    }
    load();
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [trip.id]);

  const status = result?.poster ? statusLabels[result.poster.status] || '포스터' :
    !result ? '상태 확인 중…' : result.error ? '' : '아직 만든 포스터가 없어요';
  return <li className="archive-entry">
    {result?.url && <button type="button" className="archive-thumb" aria-label={trip.title + ' 표지 크게 보기'} onClick={() => dialog.current.showModal()}>
      <img src={result.url} alt="" />
    </button>}
    <div><b>{trip.title}</b>{status && <small>{status}</small>}
      {result?.error && <p role="alert">{result.error}</p>}
      <Link className="archive-action" to={`/trips/${trip.id}/poster`}>
        {result?.poster ? '포스터 열기' : result && !result.error ? '포스터 만들기' : '포스터 화면'} <span aria-hidden="true">→</span>
      </Link>
    </div>
    {result?.url && <dialog ref={dialog} className="archive-dialog" aria-label={trip.title + ' 표지 미리보기'}>
      <header><strong>{trip.title}</strong><form method="dialog"><button className="archive-action">닫기</button></form></header>
      <img src={result.url} alt={trip.title + ' 여행 포스터 표지'} />
    </dialog>}
  </li>;
}

export default function PosterArchive({ trips }) {
  const available = trips.filter(trip => HAS_ITINERARY.includes(trip.status));
  return <section className="poster-archive tab-pane">
    <header><div><h2>여행 포스터</h2><p>표지를 누르면 크게 볼 수 있어요.</p></div></header>
    {!available.length && <p>일정을 준비한 뒤 포스터를 만들 수 있어요.</p>}
    <ul className="poster-archive-links">{available.map(trip => <ArchiveCard key={trip.id} trip={trip} />)}</ul>
  </section>;
}
