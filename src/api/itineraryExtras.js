import { apiRequest } from './client';

export const confirmItinerary = (tripId) => apiRequest(`/api/trips/${tripId}/itinerary/confirm`, { method: 'POST' });
export const getItineraryBudget = (tripId, options) => apiRequest(`/api/trips/${tripId}/itinerary/budget`, options);
export const getExcludedRestaurants = (tripId, options) => apiRequest(`/api/trips/${tripId}/excluded-restaurants`, options);
export const allowRestaurantAgain = (tripId, restaurantId) => apiRequest(`/api/trips/${tripId}/excluded-restaurants/${restaurantId}`, { method: 'DELETE' });
export const createPoster = (tripId) => apiRequest(`/api/trips/${tripId}/posters`, { method: 'POST' });
export const getLatestPoster = (tripId, options) => apiRequest(`/api/trips/${tripId}/posters/latest`, { cache: 'no-store', ...options });
export const getPosterImage = (tripId, posterId, pageNo, options) => apiRequest(`/api/trips/${tripId}/posters/${posterId}/pages/${pageNo}/image`, { ...options, responseType: 'blob' });
