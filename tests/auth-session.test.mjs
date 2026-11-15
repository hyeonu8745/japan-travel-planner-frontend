import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest, initializeSession, logoutSession } from "../src/api/client.js";
import { getSession, saveAuth } from "../src/auth/token.js";

const session = (accessToken) => ({ accessToken, userId: 5, nickname: "여행자" });
const json = (data, status = 200) => Response.json(data, { status });
const expired = () => json({ message: "다시 로그인해주세요." }, 401);

test("restore from cookie once and remove both legacy storage entries", async () => {
  const removed = [];
  globalThis.window = Object.fromEntries(["localStorage", "sessionStorage"].map(key => [
    key, { removeItem: (name) => removed.push([key, name]) },
  ]));
  let calls = 0;
  globalThis.fetch = async (path, options) => {
    calls++;
    assert.equal(path, "/api/auth/refresh");
    assert.equal(options.credentials, "include");
    assert.equal(options.method, "POST");
    assert.equal(options.body, undefined);
    return json(session("restored"));
  };
  assert.equal(initializeSession(), initializeSession());
  await initializeSession();
  assert.equal(calls, 1);
  assert.equal(removed.length, 4);
  assert.equal(getSession().accessToken, "restored");
});

test("concurrent and late 401s share a refresh and replay the original request", async () => {
  saveAuth(session("old"));
  let unblockLate;
  const late = new Promise(resolve => { unblockLate = resolve; });
  let refreshes = 0;
  globalThis.fetch = async (path, options) => {
    if (path === "/api/auth/refresh") {
      assert.equal(options.credentials, "include");
      refreshes++;
      return json(session("new"));
    }
    assert.equal(options.method, "POST");
    assert.equal(options.body, '{"test":true}');
    if (options.headers.Authorization === "Bearer old") {
      if (path === "/late") await late;
      return expired();
    }
    assert.equal(options.headers.Authorization, "Bearer new");
    return json({ ok: true });
  };
  const request = (path) => apiRequest(path, { method: "POST", body: { test: true } });
  const delayed = request("/late");
  try {
    assert.deepEqual(await Promise.all([request("/a"), request("/b")]), [{ ok: true }, { ok: true }]);
  } finally {
    unblockLate();
  }
  assert.deepEqual(await delayed, { ok: true });
  assert.equal(refreshes, 1);
});

test("refresh rejection and retry rejection end the session without looping", async () => {
  for (const refreshSucceeds of [false, true]) {
    saveAuth(session("old"));
    const calls = [];
    globalThis.fetch = async (path) => {
      calls.push(path);
      return path === "/api/auth/refresh" && refreshSucceeds ? json(session("new")) : expired();
    };
    await assert.rejects(apiRequest("/trips"), { status: 401, message: "다시 로그인해주세요." });
    assert.deepEqual(calls, refreshSucceeds ? ["/trips", "/api/auth/refresh", "/trips"] : ["/trips", "/api/auth/refresh"]);
    assert.equal(getSession().user, null);
    assert.equal(getSession().message, "다시 로그인해주세요.");
  }
});

test("login errors retain the server message and never trigger refresh", async () => {
  for (const status of [400, 401, 429]) {
    let calls = 0;
    const message = "로그인 시도가 너무 많아요. 15분 뒤에 다시 시도해주세요.";
    globalThis.fetch = async (path, options) => {
      calls++;
      assert.equal(path, "/api/auth/login");
      assert.equal(options.credentials, "include");
      assert.equal(options.headers.Authorization, undefined);
      return json({ message }, status);
    };
    await assert.rejects(apiRequest("/api/auth/login", { method: "POST" }), { status, message });
    assert.equal(calls, 1);
  }
});

test("logout clears memory even on a network error and shares duplicate clicks", async () => {
  saveAuth(session("old"));
  let calls = 0;
  globalThis.fetch = async (path, options) => {
    calls++;
    assert.equal(path, "/api/auth/logout");
    assert.equal(options.credentials, "include");
    assert.equal(options.body, undefined);
    throw new TypeError("offline");
  };
  assert.equal(logoutSession(), logoutSession());
  await logoutSession();
  assert.equal(calls, 1);
  assert.equal(getSession().accessToken, null);
  assert.equal(getSession().user, null);
});

