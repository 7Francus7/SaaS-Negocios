"use client";

import { useState } from "react";

export default function SettingsPage() {
       return (
              <div className="space-y-6">
                     <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

                     <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4">Información del Negocio</h2>
                            <p className="text-sm text-gray-500 mb-6">Estos datos aparecerán en los tickets y reportes.</p>

                            <div className="space-y-4">
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700">Nombre de la Tienda</label>
                                          <input disabled value="Mi Tienda SaaS" className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-gray-50 text-gray-500 cursor-not-allowed" />
                                          <p className="text-xs text-gray-400 mt-1">Contacte a soporte para cambiar el nombre legal.</p>
                                   </div>
                            </div>
                     </div>

                     <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4 text-red-600">Zona de Peligro</h2>
                            <div className="flex items-center justify-between">
                                   <div>
                                          <p className="font-medium text-gray-900">Reiniciar Base de Datos</p>
                                          <p className="text-sm text-gray-500">Borra todas las ventas y movimientos de prueba.</p>
                                   </div>
                                   <button className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 hover:text-red-700">
                                          Resetear Datos
                                   </button>
                            </div>
                     </div>
              </div>
       );
}
