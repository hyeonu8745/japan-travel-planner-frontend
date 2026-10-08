import { apiRequest } from "./client";

export function deleteItineraryStop(tripId, stopId) {
  return apiRequest(`/api/trips/${tripId}/itinerary/stops/${stopId}`, { method: "DELETE" });
}

export function reorderDay(tripId, dayNumber, stopIds, version) {
  return apiRequest(`/api/trips/${tripId}/itinerary/days/${dayNumber}/order`, {
    method: "PUT", body: { stopIds, version },
  });
}

export function getAttractionInsertionCandidates(tripId, dayNumber, position) {
  return apiRequest(`/api/trips/${tripId}/itinerary/days/${dayNumber}/attraction-candidates?position=${position}`);
}

export function addAttraction(tripId, dayNumber, attractionId, position, version) {
  return apiRequest(`/api/trips/${tripId}/itinerary/days/${dayNumber}/attractions`, {
    method: "POST", body: { attractionId, position, version },
  });
}

/** 일정 만들기 */
export function generateItinerary(tripId) {
  return apiRequest(`/api/trips/${tripId}/itinerary`, {
    method: "POST",
  });
}

/** 가장 최근 버전 일정 조회 */
export function getItinerary(tripId) {
  return apiRequest(`/api/trips/${tripId}/itinerary`);
}

/** 점심/저녁 식당 후보 조회 */
export function getRestaurantCandidates(tripId, stopId) {
  return apiRequest(
    `/api/trips/${tripId}/itinerary/stops/${stopId}/candidates`,
  );
}

/** 식당 교체 */
export function replaceRestaurant(tripId, stopId, restaurantId) {
  return apiRequest(`/api/trips/${tripId}/itinerary/stops/${stopId}/replace`, {
    method: "POST",
    body: { restaurantId },
  });
}

/** 관광지 후보 조회 */
export function getAttractionCandidates(tripId, stopId) {
  return apiRequest(
    `/api/trips/${tripId}/itinerary/stops/${stopId}/attraction-candidates`,
  );
}

/** 관광지 교체 */
export function replaceAttraction(tripId, stopId, attractionId) {
  return apiRequest(
    `/api/trips/${tripId}/itinerary/stops/${stopId}/replace-attraction`,
    {
      method: "POST",
      body: { attractionId },
    },
  );
}

/** 변경 이력 목록 */
export function getItineraryVersions(tripId) {
  return apiRequest(`/api/trips/${tripId}/itinerary/versions`);
}

/** 특정 버전 일정 조회 */
export function getItineraryVersion(tripId, versionNo) {
  return apiRequest(`/api/trips/${tripId}/itinerary/versions/${versionNo}`);
}

/** 특정 버전 복원 */
export function restoreItineraryVersion(tripId, versionNo) {
  return apiRequest(
    `/api/trips/${tripId}/itinerary/versions/${versionNo}/restore`,
    {
      method: "POST",
    },
  );
}
