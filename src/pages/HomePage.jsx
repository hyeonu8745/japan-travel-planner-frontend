import Footer from "../components/Footer";
import PublicHeader from "../components/PublicHeader";
import { useToast } from "../components/toastContext";

export default function HomePage() {
  const showToast = useToast();

  return (
    <>
      <PublicHeader />
      <main style={{ padding: 40 }}>
        <h1>메인</h1>
        <button
          type="button"
          onClick={() => showToast("토스트 확인용 메시지입니다.")}
        >
          토스트 테스트
        </button>
      </main>
      <Footer />
    </>
  );
}
