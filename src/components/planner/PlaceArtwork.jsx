import { useState } from 'react';
import { placeArtwork } from '../../utils/placeArtwork';

export default function PlaceArtwork({ place, type = 'ATTRACTION', className = '' }) {
  const src = placeArtwork(place, type);
  const [failedSource, setFailedSource] = useState(null);
  const fallback = `/assets/ui-v2/${type === 'ATTRACTION' ? 'pin' : 'restaurant'}.svg`;
  return <img className={`place-artwork ${className}`} src={failedSource === src ? fallback : src} alt="" aria-hidden="true" loading="lazy" draggable={false} onError={() => setFailedSource(src)} />;
}
