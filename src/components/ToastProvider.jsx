import { useCallback, useRef, useState } from "react";
import { ToastContext } from "./toastContext";

/** 앱 전체를 감싸서, 어디서든 showToast("메시지")로 알림을 띄울 수 있게 함 */
export default function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const showToast = useCallback((text) => {
    setMessage(text);
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 2500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className={`toast ${visible ? "show" : ""}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </ToastContext.Provider>
  );
}
