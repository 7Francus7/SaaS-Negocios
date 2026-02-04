"use client";

import { useActionState, useEffect, useState } from "react";
import { login } from "@/app/actions/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, LayoutDashboard, Sparkles } from "lucide-react";

export function LoginPage() {
       const [state, action, isPending] = useActionState(login, null);
       const router = useRouter();

       useEffect(() => {
              if (state?.success) {
                     if (state.godMode) {
                            // Special redirect for God Mode
                            router.push("/dashboard?view=god");
                     } else {
                            router.push("/dashboard");
                     }
              }
       }, [state, router]);

       return (
              <div className="w-full h-screen flex overflow-hidden bg-gray-50">
                     {/* Left Side - Image/Branding */}
                     <div className="hidden lg:flex w-1/2 relative bg-slate-900 text-white flex-col items-center justify-center p-12 overflow-hidden">
                            {/* Background Image with Overlay */}
                            <div className="absolute inset-0 z-0">
                                   <Image
                                          src="/login-bg.png"
                                          alt="SaaS Background"
                                          fill
                                          className="object-cover opacity-60"
                                          priority
                                   />
                                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/20" />
                            </div>

                            {/* Content */}
                            <div className="relative z-10 w-full max-w-lg space-y-8">
                                   <div className="space-y-2">
                                          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                                                 Despensa SaaS
                                          </h1>
                                          <p className="max-w-[600px] text-gray-300 md:text-xl">
                                                 La evolución de tu sistema de gestión. Potencia tu negocio con nuestra plataforma en la nube.
                                          </p>
                                   </div>

                                   <div className="grid gap-4">
                                          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10 transform transition-all hover:scale-105 hover:bg-white/15">
                                                 <div className="p-2 bg-blue-500/20 rounded-lg">
                                                        <LayoutDashboard className="w-6 h-6 text-blue-300" />
                                                 </div>
                                                 <div>
                                                        <h3 className="font-semibold">Dashboard en Tiempo Real</h3>
                                                        <p className="text-sm text-gray-400">Monitorea tus ventas y stock al instante.</p>
                                                 </div>
                                          </div>

                                          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10 transform transition-all hover:scale-105 hover:bg-white/15">
                                                 <div className="p-2 bg-purple-500/20 rounded-lg">
                                                        <Sparkles className="w-6 h-6 text-purple-300" />
                                                 </div>
                                                 <div>
                                                        <h3 className="font-semibold">Gestión Inteligente</h3>
                                                        <p className="text-sm text-gray-400">Automatiza procesos y reduce errores.</p>
                                                 </div>
                                          </div>
                                   </div>
                            </div>
                     </div>

                     {/* Right Side - Login Form */}
                     <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative z-20 bg-white">
                            <div className="w-full max-w-sm space-y-6">
                                   <div className="space-y-2 text-center">
                                          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Bienvenido de nuevo</h2>
                                          <p className="text-gray-500">Ingresa tus credenciales para acceder</p>
                                   </div>

                                   <form action={action} className="space-y-4">
                                          <div className="space-y-2">
                                                 <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                                                        Email
                                                 </label>
                                                 <div className="relative">
                                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                        <input
                                                               id="email"
                                                               name="email"
                                                               placeholder="hola@ejemplo.com"
                                                               type="email"
                                                               autoCapitalize="none"
                                                               autoComplete="email"
                                                               autoCorrect="off"
                                                               className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                                        />
                                                 </div>
                                          </div>

                                          <div className="space-y-2">
                                                 <div className="flex items-center justify-between">
                                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                                               Contraseña
                                                        </label>
                                                        <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                                               ¿Olvidaste tu contraseña?
                                                        </a>
                                                 </div>
                                                 <div className="relative">
                                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                        <input
                                                               id="password"
                                                               name="password"
                                                               type="password"
                                                               placeholder="••••••••"
                                                               className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                                        />
                                                 </div>
                                          </div>

                                          {state?.error && (
                                                 <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100 flex items-center gap-2">
                                                        <span>⚠️</span> {state.error}
                                                 </div>
                                          )}

                                          <button
                                                 disabled={isPending}
                                                 className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-white hover:bg-gray-900/90 h-10 w-full shadow-lg hover:shadow-xl transition-all"
                                          >
                                                 {isPending ? (
                                                        <>
                                                               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                               Ingresando...
                                                        </>
                                                 ) : (
                                                        "Ingresar al Sistema"
                                                 )}
                                          </button>
                                   </form>

                                   <div className="text-center text-sm text-gray-500">
                                          ¿No tienes una cuenta?{" "}
                                          <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                                                 Contactar Ventas
                                          </a>
                                   </div>
                            </div>

                            <div className="absolute bottom-4 text-xs text-gray-400">
                                   © 2024 Despensa SaaS. Todos los derechos reservados.
                            </div>
                     </div>
              </div>
       );
}
