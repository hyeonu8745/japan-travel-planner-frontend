import { apiRequest } from "./client";

export function getRestaurantDetails(id, { signal } = {}) {
  return apiRequest(`/api/restaurants/${id}/details`, { signal, cache: "no-store" });
}

export function getRestaurantPhoto(id, name, { signal, maxWidthPx = 800 } = {}) {
  const params = new URLSearchParams({ name, maxWidthPx: String(maxWidthPx) });
  return apiRequest(`/api/restaurants/${id}/photo?${params}`, { signal, cache: "no-store" });
}
