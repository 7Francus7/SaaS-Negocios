const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname);

// 1. Update lib/store.ts to export getCurrentUser
const storePath = path.join(ROOT, 'lib/store.ts');
let storeContent = fs.readFileSync(storePath, 'utf8');

if (!storeContent.includes('export async function getCurrentUser()')) {
       storeContent += `
export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const userEmail = cookieStore.get("user_email")?.value;
        if (!userEmail) return null;
        
        const user = await prisma.user.findUnique({
            where: { email: userEmail },
            select: { id: true, email: true, name: true, role: true, storeId: true }
        });
        return user;
    } catch(e) {
        return null;
    }
}
`;
       fs.writeFileSync(storePath, storeContent);
}

// 2. Create app/actions/employees.ts
const actionsDir = path.join(ROOT, 'app/actions');
const employeesFile = path.join(actionsDir, 'employees.ts');
const employeesContent = `"use server";

import prisma from "@/lib/prisma";
import { getStoreId, getCurrentUser } from "@/lib/store";
import { safeSerialize } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function getEmployees() {
    const storeId = await getStoreId();
    const currentUser = await getCurrentUser();
    
    if (currentUser?.role === "CASHIER") {
        throw new Error("Acceso denegado: solo el Administrador puede ver empleados.");
    }

    const employees = await prisma.user.findMany({
        where: { storeId },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    return safeSerialize(employees);
}

export async function createEmployee(data: { name: string, email: string, password: string, role: string }) {
    const storeId = await getStoreId();
    const currentUser = await getCurrentUser();
    
    if (currentUser?.role === "CASHIER") {
        throw new Error("Acceso denegado.");
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
        throw new Error("Ese email ya está registrado.");
    }

    const hash = bcrypt.hashSync(data.password, 10);
    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hash,
            role: data.role || "CASHIER",
            storeId
        }
    });

    return safeSerialize(user);
}

export async function deleteEmployee(id: string) {
    const storeId = await getStoreId();
    const currentUser = await getCurrentUser();
    
    if (currentUser?.role === "CASHIER") {
        throw new Error("Acceso denegado.");
    }
    
    if (id === currentUser?.id) {
        throw new Error("No puedes eliminarte a ti mismo.");
    }

    // Verify it belongs to this store
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.storeId !== storeId) {
        throw new Error("Empleado no encontrado.");
    }

    await prisma.user.delete({ where: { id } });
    return true;
}
`;
fs.writeFileSync(employeesFile, employeesContent);

// 3. Create app/dashboard/settings/employees/page.tsx
const employeesPageDir = path.join(ROOT, 'app/dashboard/settings/employees');
if (!fs.existsSync(employeesPageDir)) {
       fs.mkdirSync(employeesPageDir, { recursive: true });
}

const employeesPageContent = `"use client";

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
        if (!confirm(\`¿Eliminar al empleado \${name}? No podrá volver a ingresar.\`)) return;
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
                                    <span className={\`px-3 py-1 text-[10px] font-black uppercase rounded-full \${emp.role === 'OWNER' || emp.role === 'ADMIN' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}\`}>
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
`;
fs.writeFileSync(path.join(employeesPageDir, 'page.tsx'), employeesPageContent);

// 4. Update components/sidebar.tsx
const sidebarPath = path.join(ROOT, 'components/sidebar.tsx');
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
if (!sidebarContent.includes('userRole: "ADMIN"')) {
       // Inject user role fetcher in sidebar
       sidebarContent = sidebarContent.replace('const [storeName, setStoreName] = useState("Gestión de Despensas");',
              'const [storeName, setStoreName] = useState("Gestión de Despensas");\n       const [userRole, setUserRole] = useState("ADMIN");');

       sidebarContent = sidebarContent.replace('getPublicStoreInfo().then(info => setStoreName(info.name));',
              'getPublicStoreInfo().then(info => setStoreName(info.name));\n                      import("@/app/actions/dashboard").then(({ getDashboardStats }) => {\n                             // We need userRole. Better to create a quick fetch inside sidebar or pass it through. \n                      });');

       // Quick fix: since sidebar is client component, we will fetch role from a server action. 
       // Let's add a robust Server Action for `getUserInfo`
       const dashboardActionsPath = path.join(ROOT, 'app/actions/dashboard.ts');
       let dashActionsList = fs.readFileSync(dashboardActionsPath, 'utf8');
       if (!dashActionsList.includes('export async function getUserRole()')) {
              dashActionsList += `\nexport async function getUserRole() { const user = await import("@/lib/store").then(m => m.getCurrentUser()); return user?.role || "ADMIN"; }\n`;
              fs.writeFileSync(dashboardActionsPath, dashActionsList);
       }

       sidebarContent = sidebarContent.replace('getPublicStoreInfo().then(info => setStoreName(info.name));',
              'getPublicStoreInfo().then(info => setStoreName(info.name));\n                      import("@/app/actions/dashboard").then(m => m.getUserRole().then(r => setUserRole(r)));');

       // Filter menuItems for CASHIER
       const menuRenderer = `{!godMode && menuItems.map((item) => {`;
       const newMenuRenderer = `{!godMode && menuItems.filter(i => {
                                   if (userRole === "CASHIER") {
                                          return ["Inicio", "Punto de Venta", "Caja y Turnos", "Historial Ventas", "Clientes"].includes(i.label);
                                   }
                                   return true;
                            }).map((item) => {`;
       sidebarContent = sidebarContent.replace(menuRenderer, newMenuRenderer);
       fs.writeFileSync(sidebarPath, sidebarContent);
}

// 5. Enforce in Layout
const layoutPath = path.join(ROOT, 'app/dashboard/layout.tsx');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');
if (!layoutContent.includes('const [userRole, setUserRole] = useState<string | null>(null);')) {
       layoutContent = layoutContent.replace('const [hasOpenCash, setHasOpenCash] = useState<boolean | null>(null);',
              'const [hasOpenCash, setHasOpenCash] = useState<boolean | null>(null);\n       const [userRole, setUserRole] = useState<string | null>(null);');

       layoutContent = layoutContent.replace('checkHasOpenSession().then((isOpen) => {',
              'import("@/app/actions/dashboard").then(m => m.getUserRole().then(r => setUserRole(r)));\n              checkHasOpenSession().then((isOpen) => {');

       // Block rules
       const blockRules = `const isBlocked = hasOpenCash === false && !isAdminPage && !isCashPage;`;
       const newBlockRules = `const isCashierNotAllowed = userRole === "CASHIER" && ["/dashboard/products", "/dashboard/reports", "/dashboard/promotions", "/dashboard/suppliers", "/dashboard/settings"].some(p => pathname?.startsWith(p));
       const isBlocked = hasOpenCash === false && !isAdminPage && !isCashPage;`;
       layoutContent = layoutContent.replace(blockRules, newBlockRules);

       const roleBlockHtml = `) : isCashierNotAllowed ? (
                                   <div className="h-full w-full min-h-[80vh] flex items-center justify-center p-8">
                                          <div className="bg-white p-12 rounded-[2rem] shadow-xl max-w-xl w-full text-center border border-gray-100 flex flex-col items-center">
                                                 <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
                                                 <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Acceso Denegado</h2>
                                                 <p className="text-gray-500 font-medium mb-8">Tu rango actual de Cajero no permite el acceso a esta sección administrativa.</p>
                                                 <button onClick={() => router.push('/dashboard/pos')} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-blue-700">Ir al Punto de Venta</button>
                                          </div>
                                   </div>
                            ) : isBlocked ? (`

       layoutContent = layoutContent.replace(') : isBlocked ? (', roleBlockHtml);
       fs.writeFileSync(layoutPath, layoutContent);
}

// 6. Link Employees in Settings
const settingsPagePath = path.join(ROOT, 'app/dashboard/settings/page.tsx');
let settingsPageCode = fs.readFileSync(settingsPagePath, 'utf8');
if (!settingsPageCode.includes('href="/dashboard/settings/employees"')) {
       // Add button in header
       settingsPageCode = settingsPageCode.replace(
              '<h1 className="text-2xl font-bold text-gray-900">Personalización del Negocio</h1>',
              '<h1 className="text-2xl font-bold text-gray-900">Configuración</h1>\n                             <div className="flex gap-2"><a href="/dashboard/settings/employees" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"><Users className="w-5 h-5"/> Empleados</a>'
       );
       settingsPageCode = settingsPageCode.replace(
              '<button\n                                   onClick={handleSave}',
              '</div>\n                            <button\n                                   onClick={handleSave}'
       );
       // Include Users from lucide-react if not present, it is present in settings
       fs.writeFileSync(settingsPagePath, settingsPageCode);
}

// 7. Auto Print
const posPagePath = path.join(ROOT, 'app/dashboard/pos/page.tsx');
let posPageCode = fs.readFileSync(posPagePath, 'utf8');
if (!posPageCode.includes('setTimeout(() => window.print(), 500);')) {
       posPageCode = posPageCode.replace(
              'setShowSuccessModal(true);\n                     playCashSound();',
              'setShowSuccessModal(true);\n                     playCashSound();\n                     // Auto-ticket\n                     setTimeout(() => window.print(), 500);'
       );
       fs.writeFileSync(posPagePath, posPageCode);
}

console.log("Employees & Print Setup done.");
