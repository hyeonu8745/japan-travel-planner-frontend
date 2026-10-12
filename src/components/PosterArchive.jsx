import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLatestPoster } from '../api/itineraryExtras';
import { HAS_ITINERARY } from '../utils/tripStatus';
import '../styles/api1012.css';

export default function PosterArchive({ trips }) {
  const [results, setResults] = useState({});
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(trips.filter((trip) => HAS_ITINERARY.includes(trip.status)).map(async (trip) => {
      try { return [trip.id, { poster: await getLatestPoster(trip.id, { signal: controller.signal }) }]; }
      catch (err) { return [trip.id, { error: err.status === 404 ? '' : err.message }]; }
    })).then((entries) => { if (!controller.signal.aborted) setResults(Object.fromEntries(entries)); });
    return () => controller.abort();
  }, [trips]);
  const available = trips.filter((trip) => HAS_ITINERARY.includes(trip.status));
  return <section className="poster-archive tab-pane"><header><div><small>AI POSTER ARCHIVE</small><h2>여행 포스터</h2><p>여행별로 포스터를 확인하고 만들 수 있어요.</p></div></header>
    {!available.length && <p>일정을 준비한 뒤 포스터를 만들 수 있어요.</p>}
    <ul className="poster-archive-links">{available.map((trip) => <li key={trip.id}><b>{trip.title}</b><small>{results[trip.id]?.poster ? ({ GENERATING: '그리는 중', DONE: '포스터 준비 완료', FAILED: '일부 생성 실패' }[results[trip.id].poster.status] || '포스터 보기') : results[trip.id] ? '아직 만든 포스터가 없어요' : '상태 확인 중…'}</small>{results[trip.id]?.error && <p role="alert">{results[trip.id].error}</p>}<Link to={`/trips/${trip.id}/poster`}>포스터 보기 / 만들기 →</Link></li>)}</ul>
  </section>;
}
