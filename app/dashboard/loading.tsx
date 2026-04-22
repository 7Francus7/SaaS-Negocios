import { ShieldAlert, RotateCcw } from "lucide-react";

export default function DashboardLoading() {
       return (
              <div className="h-[80vh] flex flex-col items-center justify-center animate-in fade-in duration-300">
                     <div className="relative mb-6">
                            <div className="w-16 h-16 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                   <div className="w-6 h-6 bg-blue-100 rounded-full animate-pulse"></div>
                            </div>
                     </div>
                     <h3 className="text-xl font-black text-gray-800 uppercase tracking-widest">Cargando Módulo...</h3>
                     <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mt-2">Preparando información comercial</p>
              </div>
       );
}
