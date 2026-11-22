import { directionsUrl } from './itineraryFormat.js';

export function externalUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function travelMapsUrl(travel, from, to) {
  // An explicit null means the server could not determine the origin.
  if (travel && 'mapsUrl' in travel) return externalUrl(travel.mapsUrl);
  return directionsUrl(from, to, travel?.mode);
}

export function stationName(original, korean) {
  return korean && korean !== original ? `${korean}(${original})` : original;
}
