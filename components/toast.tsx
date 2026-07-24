"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => toast(message, "success", duration), [toast]);
  const error = useCallback((message: string, duration?: number) => toast(message, "error", duration), [toast]);
  const info = useCallback((message: string, duration?: number) => toast(message, "info", duration), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const { type, message } = toast;

  const styles = {
    success: "border-brand-200 bg-brand-50 text-brand-900 dark:bg-brand-950 dark:border-brand-800 dark:text-brand-100",
    error: "border-red-200 bg-red-50 text-red-900 dark:bg-red-950 dark:border-red-900/50 dark:text-red-100",
    info: "border-accent-200 bg-accent-50 text-accent-950 dark:bg-accent-950/60 dark:border-accent-900/40 dark:text-accent-100",
  };

  const Icons = {
    success: <CheckCircle2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    info: <Info className="h-5 w-5 text-accent-600 dark:text-accent-400" />,
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-pop-in transition-all ${styles[type]}`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{Icons[type]}</div>
      <p className="flex-1 text-sm font-medium leading-5">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
