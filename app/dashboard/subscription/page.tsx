
"use client";

import { Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createSubscriptionPreference } from "@/app/actions/subscription";
import { useState } from "react";
import { SAAS_PLANS } from "@/lib/mercadopago";

export default function SubscriptionPage() {
       const [loading, setLoading] = useState(false);

       const handleSubscribe = async () => {
              setLoading(true);
              try {
                     const { init_point } = await createSubscriptionPreference();
                     if (init_point) {
                            window.location.href = init_point;
                     }
              } catch (error) {
                     alert("Error al iniciar suscripción");
                     console.error(error);
              } finally {
                     setLoading(false);
              }
       };

       return (
              <div className="max-w-5xl mx-auto space-y-8">
                     <div className="text-center space-y-4">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mejora tu Negocio</h1>
                            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                                   Desbloquea todo el potencial de Despensa SaaS con nuestro plan profesional.
                            </p>
                     </div>

                     <div className="grid md:grid-cols-2 gap-8 relative">
                            {/* Free Plan */}
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                   <div className="mb-4">
                                          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                                                 Plan Actual
                                          </span>
                                   </div>
                                   <h3 className="text-2xl font-bold text-gray-900">{SAAS_PLANS.FREE.name}</h3>
                                   <div className="my-6">
                                          <span className="text-4xl font-black text-gray-900">$0</span>
                                          <span className="text-gray-500 font-medium">/mes</span>
                                   </div>
                                   <ul className="space-y-4 mb-8 flex-1">
                                          {SAAS_PLANS.FREE.features.map((f, i) => (
                                                 <li key={i} className="flex items-center gap-3">
                                                        <Check className="h-5 w-5 text-gray-400" />
                                                        <span className="text-gray-600">{f}</span>
                                                 </li>
                                          ))}
                                          <li className="flex items-center gap-3 opacity-50">
                                                 <X className="h-5 w-5 text-gray-300" />
                                                 <span className="text-gray-400">Reportes Avanzados</span>
                                          </li>
                                   </ul>
                                   <button disabled className="w-full py-3 rounded-xl font-bold border border-gray-200 text-gray-400 cursor-not-allowed">
                                          Tu Plan Actual
                                   </button>
                            </div>

                            {/* Pro Plan */}
                            <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-2xl shadow-blue-900/20 flex flex-col relative overflow-hidden transform md:-translate-y-4 md:scale-105 border border-gray-800">
                                   <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-transparent w-32 h-32 opacity-20 rounded-bl-full" />

                                   <div className="mb-4 flex justify-between items-center relative z-10">
                                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/50">
                                                 Recomendado
                                          </span>
                                   </div>

                                   <h3 className="text-2xl font-bold relative z-10">{SAAS_PLANS.PRO.name}</h3>
                                   <div className="my-6 relative z-10">
                                          <span className="text-5xl font-black">{formatCurrency(SAAS_PLANS.PRO.price)}</span>
                                          <span className="text-gray-400 font-medium">/mes</span>
                                   </div>

                                   <ul className="space-y-4 mb-8 flex-1 relative z-10">
                                          {SAAS_PLANS.PRO.features.map((f, i) => (
                                                 <li key={i} className="flex items-center gap-3">
                                                        <div className="bg-blue-500/20 p-1 rounded-full">
                                                               <Check className="h-4 w-4 text-blue-400" />
                                                        </div>
                                                        <span className="text-gray-200 font-medium">{f}</span>
                                                 </li>
                                          ))}
                                   </ul>

                                   <button
                                          onClick={handleSubscribe}
                                          disabled={loading}
                                          className="relative z-10 w-full py-4 rounded-xl font-black text-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                                   >
                                          {loading ? "Procesando..." : "Mejorar Plan Ahora"}
                                   </button>
                            </div>
                     </div>
              </div>
       );
}
