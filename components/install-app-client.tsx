"use client";

import React, { useState, useEffect } from "react";
import { Monitor, Smartphone, Download, CheckCircle, Info, ArrowRight, Laptop, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function InstallAppClient() {
       const [platform, setPlatform] = useState<"windows" | "mobile" | "unknown">("unknown");

       useEffect(() => {
              const userAgent = window.navigator.userAgent.toLowerCase();
              if (userAgent.indexOf("win") !== -1) {
                     setPlatform("windows");
              } else if (userAgent.indexOf("android") !== -1 || userAgent.indexOf("iphone") !== -1 || userAgent.indexOf("ipad") !== -1) {
                     setPlatform("mobile");
              }
       }, []);

       const handleDownloadShortcut = () => {
              const url = window.location.origin;
              const name = "SAAS Negocios";

              // Creating a .url file content for Windows
              const fileContent = `[InternetShortcut]\nURL=${url}\nIconIndex=0`;
              const blob = new Blob([fileContent], { type: "text/plain" });
              const downloadUrl = window.URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = downloadUrl;
              link.download = `${name}.url`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(downloadUrl);
       };

       return (
              <div className="max-w-4xl mx-auto space-y-8 pb-20">
                     <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Acceso Directo</h1>
                            <p className="text-gray-500 font-medium text-lg">Instalá el sistema en tu PC o celular para un acceso más rápido.</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Windows Desktop Shortcut */}
                            <div className={cn(
                                   "bg-white p-8 rounded-[2.5rem] border transition-all duration-300 flex flex-col items-center text-center",
                                   platform === "windows" ? "border-blue-200 shadow-xl shadow-blue-50 ring-1 ring-blue-50" : "border-gray-100 shadow-sm opacity-80"
                            )}>
                                   <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 rotate-3">
                                          <Laptop className="w-10 h-10" />
                                   </div>

                                   <h2 className="text-2xl font-black text-gray-900 mb-2">PC con Windows</h2>
                                   <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-[200px] mx-auto">
                                          Descargá un acceso directo para tu escritorio de Windows.
                                   </p>

                                   <div className="mt-auto w-full space-y-4">
                                          <Button
                                                 onClick={handleDownloadShortcut}
                                                 className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-200 active:scale-95"
                                          >
                                                 <Download className="w-5 h-5 mr-3" />
                                                 Descargar Acceso
                                          </Button>
                                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                 Formato .URL (Seguro)
                                          </p>
                                   </div>
                            </div>

                            {/* Mobile / PWA */}
                            <div className={cn(
                                   "bg-white p-8 rounded-[2.5rem] border transition-all duration-300 flex flex-col items-center text-center",
                                   platform === "mobile" ? "border-emerald-200 shadow-xl shadow-emerald-50 ring-1 ring-emerald-50" : "border-gray-100 shadow-sm opacity-80"
                            )}>
                                   <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 -rotate-3">
                                          <Smartphone className="w-10 h-10" />
                                   </div>

                                   <h2 className="text-2xl font-black text-gray-900 mb-2">Celular / Tablet</h2>
                                   <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-[200px] mx-auto">
                                          Añadí la app a tu pantalla de inicio como una aplicación real.
                                   </p>

                                   <div className="mt-auto w-full bg-gray-50 p-5 rounded-2xl border border-gray-100 text-left">
                                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                 <Info className="w-3 h-3" /> Instrucciones
                                          </h4>
                                          <ol className="text-xs text-gray-600 font-bold space-y-2">
                                                 <li className="flex gap-2">
                                                        <span className="text-emerald-500">1.</span>
                                                        <span>Tocá los 3 puntos (o botón compartir) de tu navegador.</span>
                                                 </li>
                                                 <li className="flex gap-2">
                                                        <span className="text-emerald-500">2.</span>
                                                        <span>Buscá "Instalar aplicación" o "Añadir a pantalla de inicio".</span>
                                                 </li>
                                                 <li className="flex gap-2">
                                                        <span className="text-emerald-500">3.</span>
                                                        <span>¡Listo! Ya tenés el sistema como una App.</span>
                                                 </li>
                                          </ol>
                                   </div>
                            </div>
                     </div>

                     {/* Extra Help section */}
                     <div className="bg-slate-900 p-10 rounded-[3rem] text-white overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] -mr-32 -mt-32" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                                   <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                                          <Monitor className="w-8 h-8 text-blue-400" />
                                   </div>
                                   <div>
                                          <h3 className="text-xl font-bold mb-1">¿Sabías que podés usar Chrome como App?</h3>
                                          <p className="text-slate-400 text-sm font-medium">
                                                 En Chrome para PC, podés ir al icono de "Instalar" que aparece al final de la barra de direcciones.
                                          </p>
                                   </div>
                                   <div className="md:ml-auto">
                                          <div className="px-5 py-2 bg-white/10 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest">
                                                 Recomendado
                                          </div>
                                   </div>
                            </div>
                     </div>
              </div>
       );
}
