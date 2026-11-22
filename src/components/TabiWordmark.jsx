import { Link } from "react-router-dom";
import "../styles/publicTravel.css";

export default function TabiWordmark() {
  return <Link className="tabi-wordmark" to="/" aria-label="타비메이트 홈"><strong>타비</strong><small>TabiMate</small></Link>;
}
