import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearAuth, getUser, isLoggedIn } from "../auth/token";
import Brand from "./Brand";

export default function PublicHeader() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <header className="header">
      <Brand />
      <nav>
        <NavLink to="/guide" end>
          이용 방법
        </NavLink>
        <Link to="/guide#criteria">추천 기준</Link>
        <NavLink to="/trips">내 여행</NavLink>
      </nav>
      <div>
        {loggedIn ? (
          <>
            <button type="button" className="login-link" onClick={handleLogout}>
              {user?.nickname}님 · 로그아웃
            </button>
            <Link className="btn" to="/trips/new">
              새 여행 만들기
            </Link>
          </>
        ) : (
          <>
            <Link className="login-link" to="/auth">
              로그인
            </Link>
            <Link className="btn" to="/auth">
              무료로 시작하기
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
