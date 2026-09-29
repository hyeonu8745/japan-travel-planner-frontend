import { apiRequest } from "./client";

export function createTrip(trip) {
  return apiRequest("/api/trips", { method: "POST", body: trip });
}

export function getMyTrips() {
  return apiRequest("/api/trips");
}

export function getTrip(tripId) {
  return apiRequest(`/api/trips/${tripId}`);
}
