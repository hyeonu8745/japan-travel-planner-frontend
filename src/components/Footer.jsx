import { Link } from "react-router-dom";

export default function Footer() {
  return <footer className="data-footer" aria-label="데이터 출처 안내">
    <p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a><Link className="data-sources-link" to="/data-sources">데이터 출처</Link><span className="data-footer-brand">© 2026 TabiMate</span></p>
    <p>노선·운임·소요 시간은 참고용이에요. 정확한 정보는 각 교통 기관에서 확인하세요.</p>
  </footer>;
}
