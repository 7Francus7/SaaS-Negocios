"use client";

import { useState, useEffect } from "react";
import { Save, Store, Receipt, MapPin, Phone, Hash, Lock, Eye, EyeOff, Users, Ticket } from "lucide-react";
import { getStoreSettings, updateStoreSettings, changePassword, getRaffleSettings, toggleRaffle, resetRaffleCounter } from "@/app/actions/settings";

export default function SettingsPage() {
       const [loading, setLoading] = useState(true);
       const [saving, setSaving] = useState(false);

       const [formData, setFormData] = useState({
              name: "",
              address: "",
              phone: "",
              cuit: "",
              ticketFooter: "",
              ticketInstagram: ""
       });

       const [raffle, setRaffle] = useState({ enabled: false, counter: 0 });
       const [savingRaffle, setSavingRaffle] = useState(false);

       // Password change
       const [passwordForm, setPasswordForm] = useState({
              current: "",
              newPass: "",
              confirm: ""
       });
       const [savingPassword, setSavingPassword] = useState(false);
       const [showPasswords, setShowPasswords] = useState(false);

       useEffect(() => {
              Promise.all([getStoreSettings(), getRaffleSettings()]).then(([data, raffleData]) => {
                     setFormData(data);
                     setRaffle(raffleData);
                     setLoading(false);
              });
       }, []);

       const handleToggleRaffle = async (enabled: boolean) => {
              setSavingRaffle(true);
              try {
                     await toggleRaffle(enabled);
                     setRaffle(prev => ({ ...prev, enabled }));
              } finally {
                     setSavingRaffle(false);
              }
       };

       const handleResetCounter = async () => {
              if (!confirm("¿Reiniciar el contador de cupones a 0?")) return;
              setSavingRaffle(true);
              try {
                     await resetRaffleCounter();
                     setRaffle(prev => ({ ...prev, counter: 0 }));
              } finally {
                     setSavingRaffle(false);
              }
       };

       const handleSave = async () => {
              setSaving(true);
              try {
                     await updateStoreSettings(formData);
                     alert("¡Configuración guardada con éxito!");
                     window.location.reload();
              } catch (e) {
                     alert("Error al guardar");
              } finally {
                     setSaving(false);
              }
       };

       const handleChangePassword = async () => {
              if (passwordForm.newPass !== passwordForm.confirm) {
                     alert("Las contraseñas no coinciden.");
                     return;
              }
              setSavingPassword(true);
              try {
                     await changePassword(passwordForm.current, passwordForm.newPass);
                     alert("¡Contraseña actualizada con éxito!");
                     setPasswordForm({ current: "", newPass: "", confirm: "" });
              } catch (e: any) {
                     alert(e.message || "Error al cambiar contraseña");
              } finally {
                     setSavingPassword(false);
              }
       };

       if (loading) return <div className="p-8">Cargando configuración...</div>;

       return (
              <div className="space-y-6 max-w-4xl mx-auto pb-20">
                     <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
                            <div className="flex gap-2"><a href="/dashboard/settings/employees" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"><Users className="w-5 h-5" /> Empleados</a>
                                   <button
                                          onClick={handleSave}
                                          disabled={saving}
                                          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
                                   >
                                          <Save className="h-5 w-5" />
                                          {saving ? "Guardando..." : "Guardar Cambios"}
                                   </button>
                            </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* General Info */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                   <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                 <Store className="h-6 w-6" />
                                          </div>
                                          <div>
                                                 <h2 className="text-lg font-bold text-gray-900">Identidad</h2>
                                                 <p className="text-xs text-gray-500">Datos principales de tu comercio</p>
                                          </div>
                                   </div>

                                   <div className="space-y-4">
                                          <div>
                                                 <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Negocio</label>
                                                 <input
                                                        value={formData.name}
                                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                        className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-blue-500 outline-none font-medium"
                                                        placeholder="Ej: Kiosco Lo De Fran"
                                                 />
                                          </div>

                                          <div>
                                                 <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                                        <Hash className="h-4 w-4 text-gray-400" /> CUIT / DNI
                                                 </label>
                                                 <input
                                                        value={formData.cuit}
                                                        onChange={e => setFormData({ ...formData, cuit: e.target.value })}
                                                        className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-blue-500 outline-none"
                                                        placeholder="20-12345678-9"
                                                 />
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                                 <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                                               <Phone className="h-4 w-4 text-gray-400" /> Teléfono
                                                        </label>
                                                        <input
                                                               value={formData.phone}
                                                               onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                               className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-blue-500 outline-none"
                                                               placeholder="Ej: 11 1234 5678"
                                                        />
                                                 </div>
                                                 <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                                               <MapPin className="h-4 w-4 text-gray-400" /> Dirección
                                                        </label>
                                                        <input
                                                               value={formData.address}
                                                               onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                               className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-blue-500 outline-none"
                                                               placeholder="Av. Siempre Viva 123"
                                                        />
                                                 </div>
                                          </div>
                                   </div>
                            </div>

                            {/* Ticket Branding */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                   <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                                          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                                 <Receipt className="h-6 w-6" />
                                          </div>
                                          <div>
                                                 <h2 className="text-lg font-bold text-gray-900">Personalización Ticket</h2>
                                                 <p className="text-xs text-gray-500">Cómo te ven tus clientes</p>
                                          </div>
                                   </div>

                                   <div className="space-y-4">
                                          <div>
                                                 <label className="block text-sm font-bold text-gray-700 mb-1">Mensaje al Pie</label>
                                                 <input
                                                        value={formData.ticketFooter}
                                                        onChange={e => setFormData({ ...formData, ticketFooter: e.target.value })}
                                                        className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-purple-500 outline-none"
                                                        placeholder="Ej: ¡Gracias por su visita!"
                                                 />
                                                 <p className="text-xs text-gray-400 mt-1">Aparece al final del ticket impreso.</p>
                                          </div>

                                          <div>
                                                 <label className="block text-sm font-bold text-gray-700 mb-1">Usuario Instagram</label>
                                                 <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                                                        <input
                                                               value={formData.ticketInstagram}
                                                               onChange={e => setFormData({ ...formData, ticketInstagram: e.target.value })}
                                                               className="w-full border-2 border-gray-100 rounded-xl p-3 pl-8 focus:border-purple-500 outline-none"
                                                               placeholder="kiosco.fran"
                                                        />
                                                 </div>
                                          </div>

                                          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">Vista Previa Mini</h3>
                                                 <div className="bg-white p-4 shadow-sm w-48 mx-auto font-mono text-[10px] text-center border-t-4 border-gray-800">
                                                        <p className="font-bold text-lg mb-1">{formData.name || "NOMBRE NEGOCIO"}</p>
                                                        <p>{formData.address}</p>
                                                        <p>----------------</p>
                                                        <p className="my-2 text-gray-300">[ DETALLE VENTA ]</p>
                                                        <p>----------------</p>
                                                        <p className="font-bold mt-2">{formData.ticketFooter || "¡Gracias por su compra!"}</p>
                                                        {formData.ticketInstagram && <p className="mt-1 font-bold">IG: @{formData.ticketInstagram}</p>}
                                                 </div>
                                          </div>
                                   </div>
                            </div>

                            {/* Raffle / Sorteo */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 md:col-span-2">
                                   <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                                 <Ticket className="h-6 w-6" />
                                          </div>
                                          <div>
                                                 <h2 className="text-lg font-bold text-gray-900">Sorteo / Cupones</h2>
                                                 <p className="text-xs text-gray-500">Cupón impreso en ventas &ge; $10.000 pagadas en efectivo o transferencia</p>
                                          </div>
                                   </div>

                                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                          <div className="flex items-center gap-4">
                                                 <span className="text-sm font-bold text-gray-700">Sorteo activo:</span>
                                                 <button
                                                        onClick={() => handleToggleRaffle(!raffle.enabled)}
                                                        disabled={savingRaffle}
                                                        className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${raffle.enabled ? "bg-emerald-500" : "bg-gray-300"}`}
                                                 >
                                                        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${raffle.enabled ? "translate-x-7" : "translate-x-0"}`} />
                                                 </button>
                                                 <span className={`text-sm font-black uppercase ${raffle.enabled ? "text-emerald-600" : "text-gray-400"}`}>
                                                        {raffle.enabled ? "ACTIVO" : "INACTIVO"}
                                                 </span>
                                          </div>

                                          <div className="flex items-center gap-3 ml-auto">
                                                 <div className="text-center px-5 py-3 bg-gray-50 rounded-xl border border-gray-200">
                                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Cupones emitidos</p>
                                                        <p className="text-3xl font-black text-gray-900 tabular-nums">{raffle.counter}</p>
                                                        <p className="text-xs text-gray-400 font-mono">Último: #{String(raffle.counter).padStart(6, '0')}</p>
                                                 </div>
                                                 <button
                                                        onClick={handleResetCounter}
                                                        disabled={savingRaffle || raffle.counter === 0}
                                                        className="px-4 py-2 text-sm font-bold text-red-600 border-2 border-red-100 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-40"
                                                 >
                                                        Reiniciar contador
                                                 </button>
                                          </div>
                                   </div>

                                   {raffle.enabled && (
                                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 font-medium">
                                                 Sorteo activo. Cada venta &ge; $10.000 en efectivo o transferencia imprimira un cupon numerado al pie del ticket.
                                          </div>
                                   )}
                            </div>

                            {/* Password Change */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 md:col-span-2">
                                   <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                                          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                                 <Lock className="h-6 w-6" />
                                          </div>
                                          <div>
                                                 <h2 className="text-lg font-bold text-gray-900">Cambiar Contraseña</h2>
                                                 <p className="text-xs text-gray-500">Actualizá tu contraseña de acceso</p>
                                          </div>
                                          <button
                                                 onClick={() => setShowPasswords(!showPasswords)}
                                                 className="ml-auto text-gray-400 hover:text-gray-600 p-2"
                                                 title={showPasswords ? "Ocultar" : "Mostrar"}
                                          >
                                                 {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                          </button>
                                   </div>

                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div>
                                                 <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña Actual</label>
                                                 <input
                                                        type={showPasswords ? "text" : "password"}
                                                        value={passwordForm.current}
                                                        onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                                        className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 outline-none"
                                                        placeholder="••••••••"
                                                 />
                                          </div>
                                          <div>
                                                 <label className="block text-sm font-bold text-gray-700 mb-1">Nueva Contraseña</label>
                                                 <input
                                                        type={showPasswords ? "text" : "password"}
                                                        value={passwordForm.newPass}
                                                        onChange={e => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                                                        className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 outline-none"
                                                        placeholder="Mínimo 6 caracteres"
                                                 />
                                          </div>
                                          <div>
                                                 <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Nueva</label>
                                                 <input
                                                        type={showPasswords ? "text" : "password"}
                                                        value={passwordForm.confirm}
                                                        onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                                        className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 outline-none"
                                                        placeholder="Repetir contraseña"
                                                 />
                                          </div>
                                   </div>
                                   <button
                                          onClick={handleChangePassword}
                                          disabled={savingPassword || !passwordForm.current || !passwordForm.newPass}
                                          className="bg-amber-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                   >
                                          <Lock className="h-4 w-4" />
                                          {savingPassword ? "Cambiando..." : "Cambiar Contraseña"}
                                   </button>
                            </div>
                     </div>
              </div>
       );
}
