import { useEffect, useRef } from "react";
import TripConditionsForm from "../TripConditionsForm";
import PanelIcon from "./PanelIcon";

export default function TripConditionsDialog({ conditions, busy, onClose, onSave }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const controls = () => [...dialog.querySelectorAll("button, input, select, textarea, a[href]")]
      .filter((element) => !element.disabled && !element.closest("fieldset:disabled"));

    controls()[0]?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="conditions-backdrop" onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section ref={dialogRef} className="conditions-editor setup-card profile-editor" role="dialog" aria-modal="true" aria-labelledby="conditions-title">
        <header>
          <div>
            <small>TRIP PROFILE</small>
            <h2 id="conditions-title">여행 조건 수정</h2>
            <p>여행의 기본 정보를 조정하세요.</p>
          </div>
          <PanelIcon name="luggage" className="profile-header-art" />
          <button type="button" disabled={busy} onClick={onClose} aria-label="여행 조건 닫기">×</button>
        </header>
        <TripConditionsForm initialValues={conditions} submitLabel="조건 저장하기" onSubmit={onSave} variant="planner" onCancel={onClose} />
      </section>
    </div>
  );
}
