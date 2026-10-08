import { apiRequest } from "./client";

// Google details and photo references are transient: fetch on each detail opening.
export function getAttractionDetails(attractionId, { signal } = {}) {
  return apiRequest(`/api/attractions/${attractionId}/details`, {
    signal, cache: "no-store",
  });
}

export function getAttractionPhoto(attractionId, name, { signal, maxWidthPx = 800 } = {}) {
  const params = new URLSearchParams({ name, maxWidthPx: String(maxWidthPx) });
  return apiRequest(`/api/attractions/${attractionId}/photo?${params}`, {
    signal, cache: "no-store",
  });
}
