"use client";

import { useState, useEffect } from "react";
import { getEmployees, createEmployee, deleteEmployee } from "@/app/actions/employees";
import { UserPlus, Trash2, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils"; // Not needed really

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "CASHIER" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getEmployees();
            setEmployees(data);
        } catch(e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            await createEmployee(formData);
            setIsCreateOpen(false);
            setFormData({ name: "", email: "", password: "", role: "CASHIER" });
            fetchData();
        } catch(e: any) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar al empleado ${name}? No podrá volver a ingresar.`)) return;
        try {
            await deleteEmployee(id);
            fetchData();
        } catch(e: any) {
            alert(e.message);
        }
    };

    if (loading) return <div className="p-8">Cargando personal...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Empleados</h1>
                    <p className="text-sm text-gray-500">Crea Cajeros y Administradores para tu negocio.</p>
                </div>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
                >
                    <UserPlus className="w-5 h-5" /> Nuevo Empleado
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4">Email (Login)</th>
                            <th className="px-6 py-4">Rol</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {employees.map(emp => (
                            <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-900">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                                            {emp.name.substring(0,2).toUpperCase()}
                                        </div>
                                        {emp.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{emp.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${emp.role === 'OWNER' || emp.role === 'ADMIN' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {emp.role === 'OWNER' ? 'Propietario' : emp.role === 'ADMIN' ? 'Administrador' : 'Cajero'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {emp.role !== 'OWNER' && (
                                        <button 
                                            onClick={() => handleDelete(emp.id, emp.name)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo Empleado">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                        <input required className="w-full border rounded-lg p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email de Ingreso</label>
                        <input required type="email" className="w-full border rounded-lg p-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
                        <input required type="password" minLength={6} className="w-full border rounded-lg p-2" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Rol</label>
                        <select className="w-full border rounded-lg p-2" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="CASHIER">Cajero (Solo Caja, Clientes y Ventas)</option>
                            <option value="ADMIN">Administrador (Acceso total)</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
                            {saving ? "Creando..." : "Crear Empleado"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
