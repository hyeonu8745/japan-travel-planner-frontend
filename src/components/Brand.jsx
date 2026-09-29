import { Link } from "react-router-dom";

/** 로고. className으로 페이지별 추가 스타일(auth-brand 등)을 붙일 수 있음 */
export default function Brand({ className = "" }) {
  return (
    <Link className={`brand ${className}`.trim()} to="/">
      <i>旅</i>TabiMate
    </Link>
  );
}
