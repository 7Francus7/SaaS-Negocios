
import { CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function SubscriptionSuccessPage({
       searchParams,
}: {
       searchParams: { [key: string]: string | string[] | undefined };
}) {
       return (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                     <div className="bg-green-100 p-6 rounded-full animate-bounce">
                            <CheckCircle2 className="h-16 w-16 text-green-600" />
                     </div>

                     <div className="space-y-2">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">¡Suscripción Exitosa!</h1>
                            <p className="text-lg text-gray-500 max-w-md mx-auto">
                                   Gracias por confiar en Despensa SaaS. Tu plan ha sido actualizado a <strong>Profesional</strong>.
                            </p>
                     </div>

                     <div className="bg-gray-50 p-6 rounded-2xl max-w-sm mx-auto border border-gray-100">
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">ID de Transacción</p>
                            <code className="bg-white px-3 py-1 rounded border border-gray-200 text-gray-600 font-mono text-xs block truncate w-full">
                                   {searchParams.payment_id || searchParams.collection_id || "PENDING"}
                            </code>
                     </div>

                     <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-xl shadow-gray-200"
                     >
                            Ir al Dashboard <ChevronRight className="h-4 w-4" />
                     </Link>
              </div>
       );
}
