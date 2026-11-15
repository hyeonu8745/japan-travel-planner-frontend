import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { initializeSession } from "./api/client";
import App from "./App.jsx";
import ToastProvider from "./components/ToastProvider.jsx";
import "./styles/global.css";

const root = createRoot(document.getElementById("root"));
root.render(<main role="status" style={{ padding: 32 }}>로그인 상태를 확인하고 있어요…</main>);
void initializeSession().then(() => {

  root.render(
    <StrictMode>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </StrictMode>,
  );
});

