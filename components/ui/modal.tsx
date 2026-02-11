"use client";

import * as React from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
       isOpen: boolean;
       onClose: () => void;
       title: string;
       children: React.ReactNode;
       className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
       const [mounted, setMounted] = React.useState(false);

       React.useEffect(() => {
              setMounted(true);
       }, []);

       React.useEffect(() => {
              if (isOpen) {
                     document.body.style.overflow = "hidden";
                     const handleKeyDown = (e: KeyboardEvent) => {
                            if (e.key === "Escape") onClose();
                     };
                     window.addEventListener("keydown", handleKeyDown);
                     return () => {
                            document.body.style.overflow = "unset";
                            window.removeEventListener("keydown", handleKeyDown);
                     };
              }
       }, [isOpen, onClose]);

       if (!mounted || !isOpen) return null;

       return createPortal(
              <div
                     className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
                     onClick={(e) => {
                            if (e.target === e.currentTarget) onClose();
                     }}
                     role="dialog"
                     aria-modal="true"
              >
                     <div
                            className={cn(
                                   "bg-white rounded-xl shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]",
                                   className
                            )}
                     >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                                   <h2 className="text-lg font-bold text-gray-900 leading-none">{title}</h2>
                                   <button
                                          onClick={onClose}
                                          className="text-gray-400 hover:text-red-500 transition-colors rounded-full p-2 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                                          aria-label="Cerrar modal"
                                   >
                                          <X className="h-5 w-5" />
                                   </button>
                            </div>
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                   {children}
                            </div>
                     </div>
              </div>,
              document.body
       );
}
