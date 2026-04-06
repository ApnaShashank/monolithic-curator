"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "error" | "undo";
  duration?: number;
  onUndo?: () => void;
}

interface ToastContextType {
  showToast: (message: string, options?: Omit<Toast, "id" | "message">) => void;
  hideToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback((message: string, options?: Omit<Toast, "id" | "message">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = options?.duration || 5000;
    const type = options?.type || "info";

    setToasts((prev) => [...prev, { id, message, ...options, type, duration }]);

    timers.current[id] = setTimeout(() => {
      hideToast(id);
    }, duration);
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toasts }}>
      {children}
      
      {/* Toast Layer */}
      <div className="fixed bottom-24 md:bottom-8 right-4 md:right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto min-w-[280px] bg-[#0e0e0e] border border-white/[0.06] rounded-xl p-3.5 shadow-2xl shadow-black/50 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-right-4 duration-300"
          >
            <div className="flex items-center gap-2.5">
              <span className={`material-symbols-outlined text-[16px] ${
                toast.type === 'error' ? 'text-red-400/60' : 
                toast.type === 'success' ? 'text-green-400/60' : 'text-white/30'
              }`}>
                {toast.type === 'error' ? 'error' : 
                 toast.type === 'success' ? 'check_circle' : 
                 toast.type === 'undo' ? 'delete' : 'info'}
              </span>
              <span className="text-xs font-medium text-white/70">{toast.message}</span>
            </div>
            {toast.type === 'undo' && toast.onUndo && (
              <button
                onClick={() => {
                  toast.onUndo?.();
                  hideToast(toast.id);
                }}
                className="bg-white text-black text-[9px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-md hover:bg-white/90 transition-all shrink-0"
              >
                Undo
              </button>
            )}
            <button 
              onClick={() => hideToast(toast.id)}
              className="text-white/15 hover:text-white/40 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
