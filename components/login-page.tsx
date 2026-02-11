"use client";

import { useActionState, useEffect, useState } from "react";
import { login } from "@/app/actions/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, LayoutDashboard, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginPage() {
       const [state, action, isPending] = useActionState(login, null);
       const router = useRouter();

       useEffect(() => {
              if (state?.success) {
                     if (state.godMode) {
                            // Special redirect for God Mode
                            localStorage.setItem('godMode', 'true');
                            router.push("/dashboard?view=god");
                     } else {
                            // CRITICAL: Ensure we clear any admin state for normal users
                            localStorage.removeItem('godMode');
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
                                                 Gestión de Despensas
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
                                                 <label className="text-sm font-bold text-gray-900 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                                                        Email
                                                 </label>
                                                 <div className="relative">
                                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                                        <Input
                                                               id="email"
                                                               name="email"
                                                               placeholder="hola@ejemplo.com"
                                                               type="email"
                                                               autoCapitalize="none"
                                                               autoComplete="email"
                                                               autoCorrect="off"
                                                               className="pl-10"
                                                        />
                                                 </div>
                                          </div>

                                          <div className="space-y-2">
                                                 <div className="flex items-center justify-between">
                                                        <label className="text-sm font-bold text-gray-900 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                                               Contraseña
                                                        </label>
                                                        <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                                               ¿Olvidaste tu contraseña?
                                                        </a>
                                                 </div>
                                                 <div className="relative">
                                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                                        <Input
                                                               id="password"
                                                               name="password"
                                                               type="password"
                                                               placeholder="••••••••"
                                                               className="pl-10"
                                                        />
                                                 </div>
                                          </div>

                                          {state?.error && (
                                                 <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                                        <span>⚠️</span> {state.error}
                                                 </div>
                                          )}

                                          <Button
                                                 type="submit"
                                                 className="w-full shadow-lg hover:shadow-xl transition-all"
                                                 isLoading={isPending}
                                          >
                                                 {isPending ? "Ingresando..." : "Ingresar al Sistema"}
                                          </Button>
                                   </form>

                                   ¿No tienes una cuenta?{" "}
                                   <a
                                          href="https://wa.me/5493435456247?text=Hola,%20me%20interesa%20contratar%20el%20sistema%20de%20Gestión%20de%20Despensas"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-medium text-blue-600 hover:text-blue-500"
                                   >
                                          Contactar Ventas
                                   </a>
                            </div>

                            <div className="absolute bottom-4 text-xs text-gray-400">
                                   © 2024 Gestión de Despensas. Todos los derechos reservados.
                            </div>
                     </div>
              </div>
       );
}
