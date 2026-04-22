"use client";

import React, { useState, useEffect } from "react";
import { Monitor, Smartphone, Download, CheckCircle, Info, Laptop, Check } from "lucide-react";
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
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Escritorio y Acceso Directo</h1>
                            <p className="text-gray-500 font-medium text-lg">Configurá el sistema con su logo profesional en tu pantalla.</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* PWA / Real App - RECOMMENDED */}
                            <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-1 rounded-[3rem] shadow-2xl shadow-blue-200 group">
                                   <div className="bg-white p-8 md:p-12 rounded-[2.8rem] flex flex-col md:flex-row items-center gap-8">
                                          <div className="w-32 h-32 bg-blue-50 rounded-[2rem] flex items-center justify-center shrink-0 border-4 border-blue-100 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                                 <img src="/icon.png" alt="Logo" className="w-24 h-24 rounded-2xl shadow-lg" />
                                          </div>

                                          <div className="flex-1 text-center md:text-left">
                                                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                                        <CheckCircle className="w-3 h-3" /> Recomendado
                                                 </div>
                                                 <h2 className="text-3xl font-black text-gray-900 mb-2">Instalar Aplicación Oficial</h2>
                                                 <p className="text-gray-500 font-medium mb-6">
                                                        Al instalar la "App", se creará un icono real en tu escritorio y barra de tareas **con el logo de la empresa**.
                                                        Es la forma más profesional de usar el sistema.
                                                 </p>

                                                 <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                                                        <div>
                                                               <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3">En Windows (Chrome/Edge)</h4>
                                                               <ul className="text-xs text-gray-600 font-bold space-y-2">
                                                                      <li className="flex gap-2">
                                                                             <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] shrink-0">1</div>
                                                                             <span>Buscá el icono <Download className="w-3 h-3 inline mx-1" /> al final de la barra de direcciones (donde escribís la web).</span>
                                                                      </li>
                                                                      <li className="flex gap-2">
                                                                             <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] shrink-0">2</div>
                                                                             <span>Hacé clic en **"Instalar SAAS Negocios"**.</span>
                                                                      </li>
                                                               </ul>
                                                        </div>
                                                        <div>
                                                               <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3">En Celular (Android/iOS)</h4>
                                                               <ul className="text-xs text-gray-600 font-bold space-y-2">
                                                                      <li className="flex gap-2">
                                                                             <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">1</div>
                                                                             <span>Tocá los 3 puntos (o botón compartir) del navegador.</span>
                                                                      </li>
                                                                      <li className="flex gap-2">
                                                                             <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">2</div>
                                                                             <span>Elegí **"Instalar aplicación"** o **"Añadir a inicio"**.</span>
                                                                      </li>
                                                               </ul>
                                                        </div>
                                                 </div>
                                          </div>
                                   </div>
                            </div>

                            {/* Windows Desktop Shortcut - LEGACY */}
                            <div className={cn(
                                   "bg-white p-8 rounded-[2.5rem] border transition-all duration-300 flex flex-col items-center text-center",
                                   platform === "windows" ? "border-blue-200 shadow-xl shadow-blue-50 ring-1 ring-blue-50" : "border-gray-100 shadow-sm opacity-80"
                            )}>
                                   <div className="w-20 h-20 bg-slate-50 text-slate-600 rounded-3xl flex items-center justify-center mb-6 rotate-3">
                                          <Laptop className="w-10 h-10" />
                                   </div>

                                   <h2 className="text-2xl font-black text-gray-900 mb-2">Acceso Simple</h2>
                                   <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-[200px] mx-auto">
                                          Si no quieres instalar la app, descarga este archivo directo.
                                   </p>

                                   <div className="mt-auto w-full space-y-4">
                                          <Button
                                                 onClick={handleDownloadShortcut}
                                                 className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-2xl h-14 font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                          >
                                                 <Download className="w-5 h-5 mr-3" />
                                                 Descargar Archivo
                                          </Button>
                                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                 Formato Universal .URL
                                          </p>
                                   </div>
                            </div>

                            {/* Benefits */}
                            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-center relative overflow-hidden">
                                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                                   <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                                          <Check className="w-6 h-6 text-blue-400" /> Beneficios
                                   </h3>
                                   <ul className="space-y-4">
                                          <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                                 <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                                 Acceso instantáneo con un clic
                                          </li>
                                          <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                                 <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                                 Pantalla completa sin barras de navegador
                                          </li>
                                          <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                                 <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                                 Icono profesional con el logo de tu empresa
                                          </li>
                                   </ul>
                            </div>
                     </div>
              </div>
       );
}
