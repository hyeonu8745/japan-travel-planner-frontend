import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { login, signup } from "../api/auth";
import { isLoggedIn, saveAuth } from "../auth/token";
import Brand from "../components/Brand";

const errorStyle = { color: "#d64545", fontSize: "0.78rem", margin: "4px 0 0" };

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login"); // "login" | "signup"

  // 이미 로그인한 상태면 내 여행으로
  if (isLoggedIn()) {
    return <Navigate to="/trips" replace />;
  }

  // 로그인 후 원래 가려던 페이지가 있으면 그곳으로
  const redirectTo = location.state?.from ?? "/trips";

  return (
    <div className="auth-page">
      <Brand className="auth-brand" />
      <main className="auth-shell">
        <section className="auth-art">
          <small>WELCOME BACK</small>
          <h1>
            다음 여행도
            <br />
            대화로 가볍게.
          </h1>
          <p>저장한 일정과 포스터를 언제든 다시 열어보세요.</p>
          <div className="passport">
            <span>TOKYO BETA JOURNEY</span>
            <b>旅</b>
            <small>YOUR NEXT STORY STARTS HERE</small>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              로그인
            </button>
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => setMode("signup")}
            >
              회원가입
            </button>
          </div>

          {mode === "login" ? (
            <LoginForm
              onSuccess={() => navigate(redirectTo, { replace: true })}
            />
          ) : (
            <SignupForm
              onSuccess={() => navigate("/trips/new", { replace: true })}
            />
          )}

          <p className="auth-note">
            현재 이메일 로그인으로 도쿄 베타 서비스를 이용할 수 있습니다.
          </p>
        </section>
      </main>
    </div>
  );
}

function LoginForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login({ email, password });
      saveAuth({ ...result, email: email.trim().toLowerCase() });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>다시 만나서 반가워요</h2>
      <p>저장한 여행을 이어서 계획해 보세요.</p>
      <form onSubmit={handleSubmit}>
        <label>
          이메일
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p style={errorStyle}>{error}</p>}
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}

function SignupForm({ onSuccess }) {
  const [form, setForm] = useState({ nickname: "", email: "", password: "" });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form);
      // 가입 직후 같은 정보로 자동 로그인
      const result = await login({
        email: form.email,
        password: form.password,
      });
      saveAuth({ ...result, email: form.email.trim().toLowerCase() });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>여행을 저장해 보세요</h2>
      <p>가입하고 만든 일정과 포스터를 한곳에서 관리하세요.</p>
      <form onSubmit={handleSubmit}>
        <label>
          닉네임
          <input
            required
            maxLength={20}
            placeholder="2~20자"
            value={form.nickname}
            onChange={update("nickname")}
          />
        </label>
        <label>
          이메일
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={update("email")}
          />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            required
            minLength={8}
            maxLength={64}
            autoComplete="new-password"
            placeholder="영문과 숫자를 포함해 8자 이상"
            value={form.password}
            onChange={update("password")}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            required
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          이용약관과 개인정보 처리방침에 동의합니다.
        </label>
        {error && <p style={errorStyle}>{error}</p>}
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "가입 중..." : "무료로 시작하기"}
        </button>
      </form>
    </div>
  );
}
