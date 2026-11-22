import { logout } from "../api/auth";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getUser, isLoggedIn } from "../auth/token";
import TabiWordmark from "./TabiWordmark";

export default function PublicHeader() {
  const location = useLocation();
  const inGuide = location.pathname === "/guide";
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const user = getUser();

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <header className="tabi-header">
      <TabiWordmark />
      <nav>
        <Link to="/guide" aria-current={inGuide && !location.hash ? "page" : undefined}>이용 방법</Link>
        <Link to="/guide#criteria" aria-current={inGuide && location.hash === "#criteria" ? "page" : undefined}>추천 기준</Link>
        <NavLink to="/trips">내 여행</NavLink>
      </nav>
      <div>
        {loggedIn ? (
          <>
            <button type="button" className="tabi-login" onClick={handleLogout}>
              {user?.nickname}님 · 로그아웃
            </button>
            <Link className="tabi-start" to="/trips/new">
              새 여행 만들기
            </Link>
          </>
        ) : (
          <>
            <Link className="tabi-login" to="/auth">
              로그인
            </Link>
            <Link className="tabi-start" to="/auth" state={{ from: "/trips/new" }}>
              무료로 시작하기
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
