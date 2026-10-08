import { useCallback, useEffect, useRef, useState } from "react";
import { getAttractionDetails, getAttractionPhoto } from "../../api/attractions";

const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function externalUrl(value) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

function Author({ author }) {
  if (!author) return null;
  const content = <>
    {externalUrl(author.photoUri) && <img className="google-author-avatar" src={author.photoUri} alt="" loading="lazy" referrerPolicy="no-referrer" />}
    <span>{author.name}</span>
  </>;
  return externalUrl(author.uri)
    ? <a className="google-author" href={author.uri} target="_blank" rel="noopener noreferrer">{content}</a>
    : <span className="google-author">{content}</span>;
}

function CurrentPhoto({ attractionId, photo, onExpired, onReload }) {
  const [state, setState] = useState({ loading: true, uri: null, error: "" });
  const frameRef = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let started = false;
    // Defer one microtask so StrictMode's discarded mount does not make a paid request.
    const load = () => {
      if (started || !active) return;
      started = true;
      Promise.resolve().then(async () => {
        if (!active) return;
        try {
          const result = await getAttractionPhoto(attractionId, photo.name, { signal: controller.signal });
          const uri = externalUrl(result.photoUri);
          if (active) setState({ loading: false, uri, error: uri ? "" : "사진 주소가 없어요." });
        } catch (error) {
          if (!active || error.name === "AbortError") return;
          if (error.status === 404 && onExpired()) return;
          setState({ loading: false, uri: null, error: error.message });
        }
      });
    };
    // The first photo can be below the fold on mobile; only resolve its URL once visible.
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); load(); }
    });
    if (observer) observer.observe(frameRef.current);
    else load();
    return () => { active = false; observer?.disconnect(); controller.abort(); };
  }, [attractionId, photo.name, onExpired]);

  return <figure className="google-place-photo">
    <div className="google-photo-frame" ref={frameRef} aria-busy={state.loading}>
      {state.loading && <p role="status">사진을 불러오고 있어요...</p>}
      {state.error && <div role="status"><p>{state.error}</p><button type="button" onClick={onReload}>상세 새로 불러오기</button></div>}
      {state.uri && <img src={state.uri} alt="관광지 사진" referrerPolicy="no-referrer" onError={() => setState({ loading: false, uri: null, error: "사진을 표시하지 못했어요. 상세를 새로 불러와주세요." })} />}
    </div>
    {state.uri && photo.authors?.length > 0 && <figcaption>
      <span>사진 작성자</span>
      {photo.authors.map((author, index) => <Author key={index} author={author} />)}
    </figcaption>}
  </figure>;
}

export default function AttractionDetails({ attractionId, fallbackName, visitDate, children }) {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [attempt, setAttempt] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const refreshedExpiredPhoto = useRef(false);

  const reload = useCallback(() => {
    refreshedExpiredPhoto.current = false;
    setState({ loading: true, data: null, error: "" });
    setAttempt((value) => value + 1);
  }, []);
  const handleExpiredPhoto = useCallback(() => {
    if (refreshedExpiredPhoto.current) return false;
    refreshedExpiredPhoto.current = true;
    setState({ loading: true, data: null, error: "" });
    setAttempt((value) => value + 1);
    return true;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      if (attractionId == null) {
        setState({ loading: false, data: null, error: "이 장소는 상세 정보가 없어요." });
        return;
      }
      try {
        const data = await getAttractionDetails(attractionId, { signal: controller.signal });
        if (active) setState({ loading: false, data, error: "" });
      } catch (error) {
        if (active && error.name !== "AbortError") setState({ loading: false, data: null, error: error.message });
      }
    });
    // Nothing is persisted or shared with other detail sessions.
    return () => { active = false; controller.abort(); };
  }, [attractionId, attempt]);

  const details = state.data;
  const photos = details?.photos ?? [];
  const index = Math.min(photoIndex, Math.max(photos.length - 1, 0));
  const photo = photos[index];
  const visitDay = visitDate ? WEEKDAYS[new Date(`${visitDate}T12:00:00`).getDay()] : null;

  return <section className="google-attraction-details" aria-label="관광지 상세 정보" aria-busy={state.loading}>
    <header><h2>관광지 상세 정보</h2><span className="google-attribution">{details?.attribution ?? "Google Maps"}</span></header>
    {state.loading && <p className="google-detail-state" role="status">장소 정보를 불러오고 있어요...</p>}
    {state.error && <div className="google-detail-state" role="status"><p>{state.error}</p><button type="button" onClick={reload}>다시 불러오기</button></div>}
    {details && <>
      {photo && <div className="google-photo-gallery">
        <CurrentPhoto key={`${attempt}-${index}-${photo.name}`} attractionId={attractionId} photo={photo} onExpired={handleExpiredPhoto} onReload={reload} />
        {photos.length > 1 && <nav aria-label="장소 사진 넘기기">
          <button type="button" disabled={index === 0} onClick={() => setPhotoIndex(index - 1)}>← 이전 사진</button>
          <span aria-live="polite">{index + 1} / {photos.length}</span>
          <button type="button" disabled={index === photos.length - 1} onClick={() => setPhotoIndex(index + 1)}>다음 사진 →</button>
        </nav>}
      </div>}
      <h3>{details.localizedName || details.name || fallbackName}</h3>
      {details.localizedName && details.name !== details.localizedName && <p className="google-original-name">{details.name}</p>}
      {(details.rating != null || details.userRatingCount != null) && <p className="google-place-rating">
        {details.rating != null && <b>★ {details.rating}</b>}
        {details.userRatingCount != null && <span>리뷰 {details.userRatingCount.toLocaleString()}개</span>}
      </p>}
      {details.summary && <p className="google-place-summary">{details.summary}</p>}
      {children}
      {details.openingHours?.length > 0 && <section className="google-opening-hours">
        <h4>영업시간</h4>
        <ul>{details.openingHours.map((hours, line) => <li key={line} className={visitDay && hours.startsWith(visitDay) ? "is-visit-day" : ""}>
          {hours}{visitDay && hours.startsWith(visitDay) && <span>방문 요일</span>}
        </li>)}</ul>
      </section>}
      {externalUrl(details.websiteUri) && <a className="google-website-link" href={details.websiteUri} target="_blank" rel="noopener noreferrer">공식 사이트 ↗</a>}
      <section className="google-place-reviews">
        <h4>리뷰</h4>
        {details.reviewNotice && <p className="google-review-notice">{details.reviewNotice}</p>}
        {!details.reviews?.length && <p>표시할 리뷰가 없어요.</p>}
        {details.reviews?.map((review, reviewIndex) => <article key={reviewIndex}>
          <header><Author author={review.author} /><div>{review.rating != null && <b>★ {review.rating}</b>}{review.relativeTime && <span>{review.relativeTime}</span>}</div></header>
          {review.translated && <span className="google-translated">번역됨</span>}
          {review.text && <p>{review.text}</p>}
          {review.translated && review.originalText && <details><summary>원문 보기</summary><p lang={review.originalLanguage || undefined}>{review.originalText}</p></details>}
          {externalUrl(review.googleMapsUri) && <a href={review.googleMapsUri} target="_blank" rel="noopener noreferrer">리뷰 원문 보기 ↗</a>}
        </article>)}
      </section>
      <footer><span className="google-attribution">{details.attribution}</span>{externalUrl(details.googleMapsUri) && <a href={details.googleMapsUri} target="_blank" rel="noopener noreferrer">Google 지도에서 보기 ↗</a>}</footer>
    </>}
    {!details && children}
  </section>;
}
