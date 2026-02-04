"use client";

import { useState } from "react";
import { completeOnboarding } from "@/app/actions/onboarding";
import { useRouter } from "next/navigation";
import { Store, Package, Rocket, CheckCircle2, Loader2 } from "lucide-react";

interface OnboardingWizardProps {
       initialStoreName?: string;
}

export function OnboardingWizard({ initialStoreName = "" }: OnboardingWizardProps) {
       const router = useRouter();
       const [step, setStep] = useState(1);
       const [loading, setLoading] = useState(false);

       const [formData, setFormData] = useState({
              storeName: initialStoreName,
              address: "",
              phone: "",
       });

       const handleComplete = async () => {
              setLoading(true);
              try {
                     await completeOnboarding(formData);
                     setStep(4); // Success step
                     setTimeout(() => {
                            router.push("/dashboard");
                            router.refresh();
                     }, 2000);
              } catch (error) {
                     console.error(error);
                     alert("Hubo un error al configurar tu negocio. Intentá de nuevo.");
              } finally {
                     setLoading(false);
              }
       };

       return (
              <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                     <div className="w-full max-w-2xl">
                            {/* Progress bar */}
                            <div className="mb-8">
                                   <div className="flex items-center justify-between mb-3">
                                          {[1, 2, 3].map((s) => (
                                                 <div key={s} className="flex items-center flex-1">
                                                        <div
                                                               className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s
                                                                             ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                                                             : "bg-gray-200 text-gray-400"
                                                                      }`}
                                                        >
                                                               {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                                                        </div>
                                                        {s < 3 && (
                                                               <div
                                                                      className={`flex-1 h-1 mx-2 rounded-full transition-all ${step > s ? "bg-blue-600" : "bg-gray-200"
                                                                             }`}
                                                               />
                                                        )}
                                                 </div>
                                          ))}
                                   </div>
                                   <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider px-2">
                                          <span className={step >= 1 ? "text-blue-600" : ""}>Tu Negocio</span>
                                          <span className={step >= 2 ? "text-blue-600" : ""}>Productos Demo</span>
                                          <span className={step >= 3 ? "text-blue-600" : ""}>¡Listo!</span>
                                   </div>
                            </div>

                            {/* Card */}
                            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-100">
                                   {step === 1 && (
                                          <div className="space-y-6">
                                                 <div className="text-center mb-8">
                                                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                               <Store className="w-8 h-8 text-blue-600" />
                                                        </div>
                                                        <h2 className="text-3xl font-black text-gray-900 mb-2">¡Bienvenido!</h2>
                                                        <p className="text-gray-500 font-medium">
                                                               Configuremos tu negocio en menos de 2 minutos
                                                        </p>
                                                 </div>

                                                 <div className="space-y-5">
                                                        <div>
                                                               <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                                                      Nombre de tu negocio *
                                                               </label>
                                                               <input
                                                                      type="text"
                                                                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-lg font-bold text-gray-900 placeholder:font-normal placeholder:text-gray-400"
                                                                      placeholder="Ej: Kiosco El Rayo"
                                                                      value={formData.storeName}
                                                                      onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                                                      autoFocus
                                                               />
                                                        </div>

                                                        <div>
                                                               <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                                                      Dirección (opcional)
                                                               </label>
                                                               <input
                                                                      type="text"
                                                                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                                      placeholder="Ej: Av. Corrientes 1234"
                                                                      value={formData.address}
                                                                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                               />
                                                        </div>

                                                        <div>
                                                               <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                                                      Teléfono (opcional)
                                                               </label>
                                                               <input
                                                                      type="tel"
                                                                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                                      placeholder="Ej: +54 9 11 1234-5678"
                                                                      value={formData.phone}
                                                                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                               />
                                                        </div>
                                                 </div>

                                                 <button
                                                        onClick={() => setStep(2)}
                                                        disabled={!formData.storeName.trim()}
                                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl text-lg shadow-xl shadow-blue-200 hover:shadow-2xl hover:shadow-blue-300 transition-all uppercase tracking-wide"
                                                 >
                                                        Continuar →
                                                 </button>
                                          </div>
                                   )}

                                   {step === 2 && (
                                          <div className="space-y-6">
                                                 <div className="text-center mb-8">
                                                        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                               <Package className="w-8 h-8 text-purple-600" />
                                                        </div>
                                                        <h2 className="text-3xl font-black text-gray-900 mb-2">Productos de Ejemplo</h2>
                                                        <p className="text-gray-500 font-medium">
                                                               Vamos a cargar productos demo para que puedas probar el sistema
                                                        </p>
                                                 </div>

                                                 <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-dashed border-blue-200">
                                                        <h3 className="font-black text-gray-900 mb-4 uppercase tracking-wide text-sm">
                                                               📦 Incluiremos:
                                                        </h3>
                                                        <ul className="space-y-3 text-sm font-medium text-gray-700">
                                                               <li className="flex items-center gap-3">
                                                                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                                      <span><strong>8 productos populares</strong> (Coca-Cola, Pepsi, Lays, Alfajores, etc.)</span>
                                                               </li>
                                                               <li className="flex items-center gap-3">
                                                                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                                                      <span><strong>4 categorías</strong> (Bebidas, Snacks, Cigarrillos, Almacén)</span>
                                                               </li>
                                                               <li className="flex items-center gap-3">
                                                                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                                                      <span><strong>2 clientes de ejemplo</strong> con cuenta corriente</span>
                                                               </li>
                                                               <li className="flex items-center gap-3">
                                                                      <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                                                                      <span><strong>Caja abierta</strong> lista para vender</span>
                                                               </li>
                                                        </ul>
                                                 </div>

                                                 <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5">
                                                        <p className="text-sm font-bold text-yellow-900 flex items-start gap-3">
                                                               <span className="text-2xl">💡</span>
                                                               <span>
                                                                      Estos datos son solo para que explores el sistema. Podés editarlos o eliminarlos cuando quieras.
                                                               </span>
                                                        </p>
                                                 </div>

                                                 <div className="flex gap-3">
                                                        <button
                                                               onClick={() => setStep(1)}
                                                               className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-5 rounded-2xl text-lg transition-all uppercase tracking-wide"
                                                        >
                                                               ← Volver
                                                        </button>
                                                        <button
                                                               onClick={() => setStep(3)}
                                                               className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black py-5 rounded-2xl text-lg shadow-xl shadow-purple-200 hover:shadow-2xl hover:shadow-purple-300 transition-all uppercase tracking-wide"
                                                        >
                                                               Cargar Datos →
                                                        </button>
                                                 </div>
                                          </div>
                                   )}

                                   {step === 3 && (
                                          <div className="space-y-6">
                                                 <div className="text-center mb-8">
                                                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                               <Rocket className="w-8 h-8 text-green-600" />
                                                        </div>
                                                        <h2 className="text-3xl font-black text-gray-900 mb-2">¡Todo Listo!</h2>
                                                        <p className="text-gray-500 font-medium">
                                                               Confirmá para crear tu negocio con los datos de ejemplo
                                                        </p>
                                                 </div>

                                                 <div className="bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-2xl border-2 border-green-200">
                                                        <div className="space-y-4">
                                                               <div className="flex justify-between items-center pb-3 border-b border-green-200">
                                                                      <span className="font-bold text-gray-600 uppercase text-xs tracking-widest">Negocio</span>
                                                                      <span className="font-black text-gray-900 text-lg">{formData.storeName}</span>
                                                               </div>
                                                               {formData.address && (
                                                                      <div className="flex justify-between items-center pb-3 border-b border-green-200">
                                                                             <span className="font-bold text-gray-600 uppercase text-xs tracking-widest">Dirección</span>
                                                                             <span className="font-medium text-gray-700">{formData.address}</span>
                                                                      </div>
                                                               )}
                                                               {formData.phone && (
                                                                      <div className="flex justify-between items-center pb-3 border-b border-green-200">
                                                                             <span className="font-bold text-gray-600 uppercase text-xs tracking-widest">Teléfono</span>
                                                                             <span className="font-medium text-gray-700">{formData.phone}</span>
                                                                      </div>
                                                               )}
                                                               <div className="flex justify-between items-center">
                                                                      <span className="font-bold text-gray-600 uppercase text-xs tracking-widest">Productos Demo</span>
                                                                      <span className="font-black text-green-600">✓ 8 productos listos</span>
                                                               </div>
                                                        </div>
                                                 </div>

                                                 <div className="flex gap-3">
                                                        <button
                                                               onClick={() => setStep(2)}
                                                               disabled={loading}
                                                               className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold py-5 rounded-2xl text-lg transition-all uppercase tracking-wide"
                                                        >
                                                               ← Volver
                                                        </button>
                                                        <button
                                                               onClick={handleComplete}
                                                               disabled={loading}
                                                               className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl text-lg shadow-xl shadow-green-200 hover:shadow-2xl hover:shadow-green-300 transition-all uppercase tracking-wide flex items-center justify-center gap-3"
                                                        >
                                                               {loading ? (
                                                                      <>
                                                                             <Loader2 className="w-5 h-5 animate-spin" />
                                                                             Creando...
                                                                      </>
                                                               ) : (
                                                                      <>
                                                                             <Rocket className="w-5 h-5" />
                                                                             ¡Empezar a Vender!
                                                                      </>
                                                               )}
                                                        </button>
                                                 </div>
                                          </div>
                                   )}

                                   {step === 4 && (
                                          <div className="text-center py-12">
                                                 <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                                                 </div>
                                                 <h2 className="text-4xl font-black text-gray-900 mb-3">¡Éxito!</h2>
                                                 <p className="text-gray-500 font-medium text-lg mb-6">
                                                        Tu negocio está listo. Redirigiendo al dashboard...
                                                 </p>
                                                 <div className="flex items-center justify-center gap-2">
                                                        <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                                                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse delay-75"></div>
                                                        <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse delay-150"></div>
                                                 </div>
                                          </div>
                                   )}
                            </div>

                            {step < 4 && (
                                   <p className="text-center mt-6 text-sm text-gray-500 font-medium">
                                          Paso {step} de 3 • Tiempo estimado: {step === 1 ? "1 minuto" : step === 2 ? "30 segundos" : "10 segundos"}
                                   </p>
                            )}
                     </div>
              </div>
       );
}
