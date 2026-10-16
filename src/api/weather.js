import { apiRequest } from './client';

export const getTripWeather = (tripId, options) => apiRequest(`/api/trips/${tripId}/weather`, options);
export const getRainPlan = (tripId, dayNumber, options) => apiRequest(`/api/trips/${tripId}/itinerary/days/${dayNumber}/rain-plan`, { cache:'no-store', ...options });
export const applyRainPlan = (tripId, dayNumber, version) => apiRequest(`/api/trips/${tripId}/itinerary/days/${dayNumber}/rain-plan`, { method:'POST', body:{version} });
