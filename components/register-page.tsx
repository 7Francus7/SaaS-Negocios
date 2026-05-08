"use client";

import { useActionState, useEffect } from "react";
import { register } from "@/app/actions/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RegisterPage() {
       const [state, action, isPending] = useActionState(register, null);
       const router = useRouter();

       useEffect(() => {
              if (state?.success) {
                     router.push("/onboarding");
              }
       }, [state, router]);

       return (
              <div className="w-full h-screen flex overflow-hidden bg-gray-50">
                     {/* Left Side - Branding */}
                     <div className="hidden lg:flex w-1/2 relative bg-slate-900 text-white flex-col items-center justify-center p-12 overflow-hidden">
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
                            <div className="relative z-10 w-full max-w-lg space-y-6">
                                   <div className="space-y-2">
                                          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                                                 Gestión de Despensas
                                          </h1>
                                          <p className="max-w-[600px] text-gray-300 md:text-xl">
                                                 Empezá hoy. Creá tu cuenta y comenzá a gestionar tu negocio en minutos.
                                          </p>
                                   </div>
                                   <ul className="space-y-3 text-gray-300 text-sm">
                                          <li className="flex items-center gap-2">
                                                 <span className="text-green-400 font-bold">✓</span> Stock, ventas y caja en un solo lugar
                                          </li>
                                          <li className="flex items-center gap-2">
                                                 <span className="text-green-400 font-bold">✓</span> Cuentas corrientes de clientes
                                          </li>
                                          <li className="flex items-center gap-2">
                                                 <span className="text-green-400 font-bold">✓</span> Punto de venta con lector de código de barras
                                          </li>
                                          <li className="flex items-center gap-2">
                                                 <span className="text-green-400 font-bold">✓</span> Reportes y estadísticas en tiempo real
                                          </li>
                                   </ul>
                            </div>
                     </div>

                     {/* Right Side - Register Form */}
                     <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative z-20 bg-white overflow-y-auto">
                            <div className="w-full max-w-sm space-y-6">
                                   <div className="space-y-2 text-center">
                                          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Crear tu cuenta</h2>
                                          <p className="text-gray-500">Completá los datos para empezar gratis</p>
                                   </div>

                                   <form action={action} className="space-y-4">
                                          <div className="space-y-2">
                                                 <label className="text-sm font-bold text-gray-900" htmlFor="name">
                                                        Tu nombre
                                                 </label>
                                                 <div className="relative">
                                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                                        <Input
                                                               id="name"
                                                               name="name"
                                                               placeholder="Juan Pérez"
                                                               type="text"
                                                               autoComplete="name"
                                                               className="pl-10"
                                                               required
                                                        />
                                                 </div>
                                          </div>

                                          <div className="space-y-2">
                                                 <label className="text-sm font-bold text-gray-900" htmlFor="storeName">
                                                        Nombre de tu negocio
                                                 </label>
                                                 <div className="relative">
                                                        <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                                        <Input
                                                               id="storeName"
                                                               name="storeName"
                                                               placeholder="Despensa El Sol"
                                                               type="text"
                                                               className="pl-10"
                                                               required
                                                        />
                                                 </div>
                                          </div>

                                          <div className="space-y-2">
                                                 <label className="text-sm font-bold text-gray-900" htmlFor="email">
                                                        Email
                                                 </label>
                                                 <div className="relative">
                                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                                        <Input
                                                               id="email"
                                                               name="email"
                                                               placeholder="juan@ejemplo.com"
                                                               type="email"
                                                               autoComplete="email"
                                                               className="pl-10"
                                                               required
                                                        />
                                                 </div>
                                          </div>

                                          <div className="space-y-2">
                                                 <label className="text-sm font-bold text-gray-900" htmlFor="password">
                                                        Contraseña
                                                 </label>
                                                 <div className="relative">
                                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                                        <Input
                                                               id="password"
                                                               name="password"
                                                               type="password"
                                                               placeholder="Mínimo 8 caracteres"
                                                               className="pl-10"
                                                               required
                                                               minLength={8}
                                                        />
                                                 </div>
                                          </div>

                                          <div className="space-y-2">
                                                 <label className="text-sm font-bold text-gray-900" htmlFor="confirmPassword">
                                                        Confirmar contraseña
                                                 </label>
                                                 <div className="relative">
                                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                                        <Input
                                                               id="confirmPassword"
                                                               name="confirmPassword"
                                                               type="password"
                                                               placeholder="Repetí tu contraseña"
                                                               className="pl-10"
                                                               required
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
                                                 {isPending ? "Creando cuenta..." : "Crear mi cuenta"}
                                          </Button>
                                   </form>

                                   <div className="text-center text-sm text-gray-900 font-medium">
                                          ¿Ya tenés cuenta?{" "}
                                          <a href="/" className="font-bold text-blue-700 hover:text-blue-800 underline decoration-blue-200 underline-offset-4 transition-colors">
                                                 Iniciar sesión
                                          </a>
                                   </div>
                            </div>

                            <div className="absolute bottom-4 text-xs text-gray-400">
                                   © 2024 Gestión de Despensas. Todos los derechos reservados.
                            </div>
                     </div>
              </div>
       );
}
