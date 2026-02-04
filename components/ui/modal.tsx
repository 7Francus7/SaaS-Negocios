"use client";

import * as React from "react";
import { X } from "lucide-react";

interface ModalProps {
       isOpen: boolean;
       onClose: () => void;
       title: string;
       children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
       if (!isOpen) return null;

       return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in">
                     <div
                            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                            role="dialog"
                            aria-modal="true"
                     >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                   <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                                   <button
                                          onClick={onClose}
                                          className="text-gray-400 hover:text-gray-500 transition-colors rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   >
                                          <X className="h-5 w-5" />
                                   </button>
                            </div>
                            <div className="p-6">
                                   {children}
                            </div>
                     </div>
              </div>
       );
}
