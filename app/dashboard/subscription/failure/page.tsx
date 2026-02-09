
import { AlertCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function SubscriptionFailurePage() {
       return (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                     <div className="bg-red-100 p-6 rounded-full animate-pulse">
                            <AlertCircle className="h-16 w-16 text-red-600" />
                     </div>

                     <div className="space-y-2">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Algo salió mal</h1>
                            <p className="text-lg text-gray-500 max-w-md mx-auto">
                                   No pudimos procesar tu pago en este momento. Por favor, intenta nuevamente.
                            </p>
                     </div>

                     <Link
                            href="/dashboard/subscription"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-all"
                     >
                            <ChevronLeft className="h-4 w-4" /> Volver a intentar
                     </Link>
              </div>
       );
}
