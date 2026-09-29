import { apiRequest } from "./client";

export function signup({ email, password, nickname }) {
  return apiRequest("/api/auth/signup", {
    method: "POST",
    body: { email, password, nickname },
    auth: false,
  });
}

export function login({ email, password }) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}
