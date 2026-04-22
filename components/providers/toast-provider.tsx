"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
       id: string;
       message: string;
       type: ToastType;
}

interface ToastContextType {
       toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
       const context = useContext(ToastContext);
       if (!context) {
              throw new Error("useToast must be used within a ToastProvider");
       }
       return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
       const [toasts, setToasts] = useState<Toast[]>([]);

       const removeToast = useCallback((id: string) => {
              setToasts((prev) => prev.filter((t) => t.id !== id));
       }, []);

       const toast = useCallback((message: string, type: ToastType = "info") => {
              const id = Math.random().toString(36).substring(2, 9);
              setToasts((prev) => [...prev, { id, message, type }]);

              // Auto remove after 3 seconds
              setTimeout(() => {
                     removeToast(id);
              }, 3000);
       }, [removeToast]);

       return (
              <ToastContext.Provider value={{ toast }}>
                     {children}
                     <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none p-4 sm:p-0">
                            {toasts.map((t) => (
                                   <div
                                          key={t.id}
                                          className={cn(
                                                 "pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-lg border toast-slide-in",
                                                 t.type === "success" && "bg-white border-emerald-100 text-emerald-900 shadow-emerald-50",
                                                 t.type === "error" && "bg-white border-red-100 text-red-900 shadow-red-50",
                                                 t.type === "warning" && "bg-white border-orange-100 text-orange-900 shadow-orange-50",
                                                 t.type === "info" && "bg-white border-blue-100 text-blue-900 shadow-blue-50"
                                          )}
                                   >
                                          <div className={cn(
                                                 "shrink-0 rounded-full p-1",
                                                 t.type === "success" && "bg-emerald-100 text-emerald-600",
                                                 t.type === "error" && "bg-red-100 text-red-600",
                                                 t.type === "warning" && "bg-orange-100 text-orange-600",
                                                 t.type === "info" && "bg-blue-100 text-blue-600"
                                          )}>
                                                 {t.type === "success" && <CheckCircle2 className="h-4 w-4" />}
                                                 {t.type === "error" && <AlertCircle className="h-4 w-4" />}
                                                 {t.type === "warning" && <AlertTriangle className="h-4 w-4" />}
                                                 {t.type === "info" && <Info className="h-4 w-4" />}
                                          </div>
                                          <p className="text-sm font-medium flex-1">{t.message}</p>
                                          <button
                                                 onClick={() => removeToast(t.id)}
                                                 className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                                          >
                                                 <X className="h-4 w-4" />
                                          </button>
                                   </div>
                            ))}
                     </div>
              </ToastContext.Provider>
       );
}
