import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import PublicHeader from "../components/PublicHeader";

export default function NotFoundPage() {
  return (
    <>
      <PublicHeader />
      <main className="guide">
        <section className="guide-hero">
          <span>404</span>
          <h1>페이지를 찾을 수 없습니다.</h1>
          <p>주소가 바뀌었거나 삭제된 페이지일 수 있어요.</p>
          <Link className="new-trip" to="/">
            메인으로 돌아가기
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
