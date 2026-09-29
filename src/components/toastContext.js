import { createContext, useContext } from "react";

export const ToastContext = createContext(() => {});

/** 어디서든 const showToast = useToast(); showToast("메시지") */
export function useToast() {
  return useContext(ToastContext);
}
