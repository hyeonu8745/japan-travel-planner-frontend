import { clearAuth, getSession, removeLegacyAuth, saveAuth } from "../auth/token.js";

const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "";
const AUTH_ENDPOINTS = new Set(["/api/auth/login", "/api/auth/refresh", "/api/auth/logout"]);
const RELOGIN = "다시 로그인해주세요.";
let refreshFlight;
let logoutFlight;
let initialization;

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function send(path, options, token) {
  const { method, body, signal, cache } = options;
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache,
      ...(AUTH_ENDPOINTS.has(path) ? { credentials: "include" } : {}),
    });
  } catch (error) {
    if (signal?.aborted || error.name === "AbortError") throw error;
    throw new ApiError(0, "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
  }
}

async function read(response, responseType) {
  if (response.status === 204) return null;
  if (response.ok && responseType === "blob") return response.blob();
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, data?.message ?? "요청을 처리하지 못했습니다.");
  }
  return data;
}

function refreshSession() {
  if (logoutFlight) return Promise.reject(new ApiError(401, RELOGIN));
  if (refreshFlight) return refreshFlight;
  const { version, user } = getSession();
  refreshFlight = (async () => {
    const response = await send("/api/auth/refresh", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 401) {
      const data = await response.json().catch(() => null);
      const message = data?.message ?? RELOGIN;
      if (getSession().version === version && !logoutFlight) clearAuth(user ? message : "");
      throw new ApiError(401, message);
    }
    const data = await read(response);
    if (getSession().version !== version || logoutFlight) throw new ApiError(401, RELOGIN);
    saveAuth({ ...data, email: user?.email }, { refreshed: true });
  })().finally(() => { refreshFlight = undefined; });
  return refreshFlight;
}

export function initializeSession() {
  if (!initialization) {
    removeLegacyAuth();
    initialization = refreshSession().catch(() => {
      // Without an established session, public pages remain available.
    });
  }
  return initialization;
}

export function logoutSession() {
  if (!logoutFlight) {
    const pendingRefresh = refreshFlight;
    logoutFlight = (async () => {
      await pendingRefresh?.catch(() => {});
      await send("/api/auth/logout", { method: "POST", signal: AbortSignal.timeout(10000) });
    })().catch(() => {
      // Always end the local session, even when the server is unavailable.
    }).finally(() => {
      clearAuth();
      logoutFlight = undefined;
    });
  }
  return logoutFlight;
}

export async function apiRequest(
  path,
  { method = "GET", body, auth = true, signal, cache, responseType = "json" } = {},
) {
  const protectedRequest = auth && !AUTH_ENDPOINTS.has(path);
  const options = { method, body, signal, cache };
  const original = getSession();
  let response = await send(path, options, protectedRequest ? original.accessToken : null);
  if (response.status === 401 && protectedRequest) {
    signal?.throwIfAborted();
    if (logoutFlight || original.version !== getSession().version) {
      throw new ApiError(401, RELOGIN);
    }
    // A slower 401 can arrive after the shared refresh has already finished.
    if (original.accessToken === getSession().accessToken) await refreshSession();
    signal?.throwIfAborted();
    const retry = getSession();
    if (logoutFlight || retry.version !== original.version || !retry.accessToken) {
      throw new ApiError(401, RELOGIN);
    }
    response = await send(path, options, retry.accessToken);
    if (response.status === 401) {
      if (!logoutFlight && getSession().version === retry.version) clearAuth(RELOGIN);
      throw new ApiError(401, RELOGIN);
    }
  }
  return read(response, responseType);
}
