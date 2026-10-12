import { clearAuth, getToken } from "../auth/token";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** 서버가 보낸 { message } 와 상태 코드를 담는 에러 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * 모든 API 호출이 거치는 공통 함수
 * - JSON 변환, 토큰 첨부, 에러 메시지 정리, 401 처리
 */
export async function apiRequest(
  path,
  { method = "GET", body, auth = true, signal, cache, responseType = "json" } = {},
) {
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (auth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      cache,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      0,
      "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
    );
  }

  // 로그인이 필요한 요청에서 401 → 토큰 삭제 후 로그인 화면으로
  if (response.status === 401 && auth) {
    const data = await response.json().catch(() => null);
    clearAuth();
    window.location.href = "/auth";
    throw new ApiError(401, data?.message ?? "로그인이 필요합니다.");
  }

  if (response.status === 204) return null;
  if (response.ok && responseType === "blob") return response.blob();

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.message ?? "요청을 처리하지 못했습니다.",
    );
  }
  return data;
}
