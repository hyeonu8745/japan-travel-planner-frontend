const TOKEN_KEY = "tabimate.accessToken";
const USER_KEY = "tabimate.user";

export function saveAuth({ accessToken, userId, nickname, email }) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify({ userId, nickname, email }));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** 토큰의 만료 시각(exp)을 읽어서 이미 지났는지 확인 */
function isTokenExpired(token) {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return json.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  if (isTokenExpired(token)) {
    clearAuth();
    return false;
  }
  return true;
}
