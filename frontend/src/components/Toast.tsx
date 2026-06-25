import React, { useState, useEffect } from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  text: string;
}

let toastCounter = 0;
const listeners = new Set<(msg: ToastMessage) => void>();

export const showToast = (text: string, type: ToastMessage["type"] = "info") => {
  const id = String(++toastCounter);
  listeners.forEach((cb) => cb({ id, type, text }));
};

export const toast = {
  success: (text: string) => showToast(text, "success"),
  error: (text: string) => showToast(text, "error"),
  info: (text: string) => showToast(text, "info"),
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleNewToast = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 4000);
    };

    listeners.add(handleNewToast);
    return () => {
      listeners.delete(handleNewToast);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
      {toasts.map((t) => {
        const styles = {
          success: "border-brand-green bg-obsidian-card text-brand-green shadow-flatGreen",
          error: "border-brand-rose bg-obsidian-card text-brand-rose shadow-flatRose",
          info: "border-brand-cyan bg-obsidian-card text-brand-cyan shadow-flatAccent",
        };

        const prefix = {
          success: "✓ SYSTEM_OK",
          error: "▲ SYSTEM_ERR",
          info: "ℹ SYSTEM_MSG",
        };

        return (
          <div
            key={t.id}
            className={`pointer-events-auto border-2 px-4 py-3 font-mono text-[11px] max-w-sm flex flex-col space-y-1 transform transition-all duration-300 translate-y-0 opacity-100 ${styles[t.type]}`}
          >
            <span className="font-bold tracking-widest">{prefix[t.type]}</span>
            <span className="text-slate-100 font-sans text-xs">{t.text}</span>
          </div>
        );
      })}
    </div>
  );
};
