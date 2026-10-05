import { apiRequest } from "./client";

/** 일정 만들기. 다시 부르면 새 버전이 쌓인다 */
export function generateItinerary(tripId) {
  return apiRequest(`/api/trips/${tripId}/itinerary`, { method: "POST" });
}

/** 가장 최근 버전의 일정 */
export function getItinerary(tripId) {
  return apiRequest(`/api/trips/${tripId}/itinerary`);
}

/** 점심/저녁 식당 후보 조회 */
export function getRestaurantCandidates(tripId, stopId) {
  return apiRequest(
    `/api/trips/${tripId}/itinerary/stops/${stopId}/candidates`,
  );
}

/** 식당 교체. 성공하면 새 버전의 전체 일정 반환 */
export function replaceRestaurant(tripId, stopId, restaurantId) {
  return apiRequest(`/api/trips/${tripId}/itinerary/stops/${stopId}/replace`, {
    method: "POST",
    body: { restaurantId },
  });
}
