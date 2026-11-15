const LEGACY_KEYS = ["tabimate.accessToken", "tabimate.user"];
let session = { accessToken: null, user: null, message: "", version: 0 };
const listeners = new Set();

export function removeLegacyAuth() {
  for (const storage of ["localStorage", "sessionStorage"]) {
    try {
      for (const key of LEGACY_KEYS) window[storage].removeItem(key);
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  }
}

export const getSession = () => session;
export const getToken = () => session.accessToken;
export const getUser = () => session.user;
export const isLoggedIn = () => Boolean(getToken());
export function subscribeSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(next) {
  session = next;
  for (const listener of listeners) listener();
}

export function saveAuth({ accessToken, userId, nickname, email }, { refreshed = false } = {}) {
  publish({
    accessToken,
    user: { userId, nickname, email },
    message: "",
    version: session.version + (refreshed ? 0 : 1),
  });
}

export function clearAuth(message = "") {
  publish({ accessToken: null, user: null, message, version: session.version + 1 });
}
