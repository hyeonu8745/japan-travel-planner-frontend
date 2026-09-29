import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isLoggedIn } from "./token";

/** 로그인해야 볼 수 있는 페이지들을 감싸는 문지기 */
export default function RequireAuth() {
  const location = useLocation();

  if (!isLoggedIn()) {
    // 로그인 후 원래 가려던 곳으로 돌려보내기 위해 주소를 같이 넘김
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
