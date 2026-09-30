import { apiRequest } from "./client";

export function sendChatMessage(tripId, content) {
  return apiRequest(`/api/trips/${tripId}/chat/messages`, {
    method: "POST",
    body: { content },
  });
}

export function getChatHistory(tripId) {
  return apiRequest(`/api/trips/${tripId}/chat/messages`);
}

export function getPreferences(tripId) {
  return apiRequest(`/api/trips/${tripId}/preferences`);
}
