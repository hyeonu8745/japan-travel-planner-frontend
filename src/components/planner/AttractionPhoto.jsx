import { useState } from 'react';
import { externalUrl } from '../../utils/travelPresentation';

export default function AttractionPhoto({ photo, name, onError }) {
  const [failed, setFailed] = useState(false);
  const url = externalUrl(photo?.url);
  if (!url || failed) return null;
  const creditUrl = externalUrl(photo.credit);
  const licenseUrl = externalUrl(photo.licenseUrl);
  const image = <img src={url} alt={name || '관광지 사진'} loading="lazy" referrerPolicy="no-referrer" onError={() => { setFailed(true); onError?.(); }} />;
  return <figure className="attraction-local-photo">
    {creditUrl ? <a href={creditUrl} target="_blank" rel="noopener noreferrer" aria-label={(name || '관광지') + ' 원본 사진 보기'}>{image}</a> : image}
    <figcaption>
      {photo.artist ? <span>📷 {photo.artist}{photo.license && <> · {licenseUrl ? <a href={licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a> : photo.license}</>}</span>
        : creditUrl && <a href={creditUrl} target="_blank" rel="noopener noreferrer">원본 사진</a>}
    </figcaption>
  </figure>;
}
