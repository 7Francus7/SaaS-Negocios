"use client";

import React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import { UserPlus, Search, Wallet, History, Shield, MapPin, Hash, DollarSign, Pencil, Trash2, MessageSquare } from "lucide-react";
import { getCustomers, registerPayment, createCustomer, getCustomerHistory, updateCustomer, deleteCustomer, closeCustomerMonth, getSaleDetailsForMovement, removeProductFromAccountSale } from "@/app/actions/customers";
import { Download, CalendarCheck, ChevronDown, ChevronUp, PackageMinus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn, formatCurrency, formatDate, formatTime } from "@/lib/utils";

interface Customer {
       id: number;
       name: string;
       dni?: string | null;
       phone?: string | null;
       address?: string | null;
       currentBalance: number;
       closedBalance: number;
       creditLimit: number;
       active: boolean;
}

export default function CustomersPage() {
       const [customers, setCustomers] = useState<Customer[]>([]);
       const [loading, setLoading] = useState(true);
       const [searchQuery, setSearchQuery] = useState("");

       // Modals
       const [isCreateOpen, setIsCreateOpen] = useState(false);
       const [isPaymentOpen, setIsPaymentOpen] = useState(false);
       const [isEditOpen, setIsEditOpen] = useState(false);
       const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

       // Forms
       const [newCustomer, setNewCustomer] = useState({
              name: "",
              dni: "",
              phone: "",
              address: "",
              creditLimit: 0
       });
       const [editForm, setEditForm] = useState({
              name: "",
              dni: "",
              phone: "",
              address: "",
              creditLimit: 0
       });
       const [paymentAmount, setPaymentAmount] = useState("");
       const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("EFECTIVO");

       const [error, setError] = useState("");

       const fetchCustomers = useCallback(async () => {
              setLoading(true);
              setError("");
              try {
                     const data = await getCustomers();
                     setCustomers(data as any);
              } catch (err) {
                     console.error("Error fetching customers:", err);
                     setError("No se pudieron cargar los clientes. Por favor, intente nuevamente.");
              } finally {
                     setLoading(false);
              }
       }, []);

       // Initial load
       useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

       const handleCreate = async () => {
              try {
                     await createCustomer({
                            ...newCustomer,
                            creditLimit: Number(newCustomer.creditLimit)
                     });
                     setNewCustomer({ name: "", dni: "", phone: "", address: "", creditLimit: 0 });
                     setIsCreateOpen(false);
                     fetchCustomers();
              } catch (e: any) { alert(e.message); }
       };

       const handlePayment = async () => {
              if (!selectedCustomer) return;
              const amountNum = Number(paymentAmount);
              if (isNaN(amountNum) || amountNum === 0) {
                     alert("Ingrese un monto válido a abonar (distinto de 0).");
                     return;
              }
              try {
                     const res = await registerPayment(selectedCustomer.id, amountNum, "Pago a cuenta", selectedPaymentMethod);
                     if (res?.error) {
                            alert(res.error);
                            return;
                     }
                     setPaymentAmount("");
                     setSelectedPaymentMethod("EFECTIVO");
                     setIsPaymentOpen(false);
                     setSelectedCustomer(null);
                     fetchCustomers();
              } catch (e: any) { alert(e.message); }
       };

       const handleEdit = async () => {
              if (!selectedCustomer) return;
              try {
                     await updateCustomer(selectedCustomer.id, {
                            ...editForm,
                            creditLimit: Number(editForm.creditLimit)
                     });
                     setIsEditOpen(false);
                     setSelectedCustomer(null);
                     fetchCustomers();
              } catch (e: any) { alert(e.message); }
       };

       const handleDelete = async (customer: Customer) => {
              if (!confirm(`¿Estás seguro de eliminar a "${customer.name}"? Sus movimientos de cuenta se conservarán.`)) return;
              try {
                     await deleteCustomer(customer.id);
                     fetchCustomers();
              } catch (e: any) { alert(e.message); }
       };

       const openEdit = (customer: Customer) => {
              setSelectedCustomer(customer);
              setEditForm({
                     name: customer.name,
                     dni: customer.dni || "",
                     phone: customer.phone || "",
                     address: customer.address || "",
                     creditLimit: customer.creditLimit
              });
              setIsEditOpen(true);
       };

       const [history, setHistory] = useState<any[]>([]);
       const [isHistoryOpen, setIsHistoryOpen] = useState(false);

       const [expandedMovementId, setExpandedMovementId] = useState<number | null>(null);
       const [movementSaleDetails, setMovementSaleDetails] = useState<any>(null);
       const historyContentRef = useRef<HTMLDivElement>(null);

       const handleExpandMovement = async (h: any) => {
              if (expandedMovementId === h.id) {
                     setExpandedMovementId(null);
                     setMovementSaleDetails(null);
                     return;
              }
              setExpandedMovementId(h.id);
              setMovementSaleDetails(null);
              const match = h.description?.match(/Venta #(\d+)/);
              if (match) {
                     const saleId = parseInt(match[1]);
                     const details = await getSaleDetailsForMovement(saleId);
                     setMovementSaleDetails(details);
              }
       };

       const handleRemoveItem = async (movementId: number, saleId: number, itemId: number, itemName: string) => {
              if (!confirm(`¿Seguro que deseas eliminar/devolver el producto ${itemName} de esta cuenta?`)) return;
              try {
                     await removeProductFromAccountSale(movementId, saleId, itemId);
                     if (selectedCustomer) {
                            handleViewHistory(selectedCustomer);
                     }
                     fetchCustomers();
                     setExpandedMovementId(null);
              } catch (e: any) {
                     alert(e.message);
              }
       }; const handleCloseMonth = async (customer: Customer) => {
              if (Number(customer.currentBalance) <= 0) {
                     alert("El cliente no tiene deuda actual para cerrar.");
                     return;
              }
              if (!confirm(`¿Cerrar el mes para ${customer.name}? Esto separará la deuda actual y comenzará un nuevo mes en 0.`)) return;

              try {
                     await closeCustomerMonth(customer.id);
                     fetchCustomers();
                     alert("Mes cerrado correctamente.");
              } catch (e: any) {
                     alert(e.message);
              }
       };

       const downloadHistoryCSV = () => {
              if (!history.length || !selectedCustomer) return;
              const headers = ["Fecha", "Concepto", "Monto"];
              const rows = history.map((h: any) => [
                     `"${formatDate(h.timestamp)} ${formatTime(h.timestamp)}"`,
                     `"${h.description}"`,
                     h.amount.toString()
              ]);

              const csvContent = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
              const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `${selectedCustomer.name.replace(/\s+/g, '_')}_historial.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
       };

       // ─── Boleta builder (pure Canvas, no DOM capture) ───────────────────
       const buildBoletaCanvas = (
              customer: Customer,
              movements: any[],
              store: { name: string; address: string; phone: string; cuit: string; ticketFooter: string }
       ): HTMLCanvasElement => {
              const SC = 2;
              const W = 794;
              const PAD = 36;
              const ROW_H = 26;
              const ITEM_ROW_H = 18;
              const SECTION_GAP = 14;

              // Pre-calculate total height
              const H_HEADER = 110;
              const H_CLIENT = 90;
              const H_SUMMARY = 80;
              const H_TABLE_HEAD = 32;
              const totalItemRows = movements.reduce((sum: number, m: any) => sum + (m.saleItems?.length || 0), 0);
              const H_TABLE = Math.max(movements.length, 1) * ROW_H + totalItemRows * ITEM_ROW_H;
              const H_FOOTER = 56;
              const TOTAL_H = H_HEADER + SECTION_GAP + H_CLIENT + SECTION_GAP + H_SUMMARY + SECTION_GAP + H_TABLE_HEAD + H_TABLE + SECTION_GAP + H_FOOTER;

              const canvas = document.createElement('canvas');
              canvas.width = W * SC;
              canvas.height = TOTAL_H * SC;
              const ctx = canvas.getContext('2d')!;
              ctx.scale(SC, SC);
              ctx.imageSmoothingEnabled = true;

              // ── Helpers ──────────────────────────────────────────────────
              const fmtCurrency = (n: number) =>
                     new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);

              const fmtDate = (ts: string | Date) => {
                     const d = new Date(ts);
                     return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
              };

              const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
                     ctx.beginPath();
                     ctx.moveTo(x + r, y);
                     ctx.lineTo(x + w - r, y);
                     ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                     ctx.lineTo(x + w, y + h - r);
                     ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                     ctx.lineTo(x + r, y + h);
                     ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                     ctx.lineTo(x, y + r);
                     ctx.quadraticCurveTo(x, y, x + r, y);
                     ctx.closePath();
              };

              // ── Background ───────────────────────────────────────────────
              ctx.fillStyle = '#f1f5f9';
              ctx.fillRect(0, 0, W, TOTAL_H);

              let y = 0;

              // ── HEADER ───────────────────────────────────────────────────
              ctx.fillStyle = '#1e3a5f';
              ctx.fillRect(0, 0, W, H_HEADER);

              // Accent stripe
              ctx.fillStyle = '#2563eb';
              ctx.fillRect(0, H_HEADER - 5, W, 5);

              ctx.fillStyle = '#ffffff';
              ctx.font = `bold 26px Arial`;
              ctx.fillText((store.name || 'Mi Negocio').toUpperCase(), PAD, 42);

              ctx.font = `13px Arial`;
              ctx.fillStyle = '#93c5fd';
              const headerLine2Parts = [store.address, store.phone ? `Tel: ${store.phone}` : '', store.cuit ? `CUIT: ${store.cuit}` : ''].filter(Boolean).join('   •   ');
              ctx.fillText(headerLine2Parts, PAD, 62);

              // Title right-aligned
              ctx.font = `bold 16px Arial`;
              ctx.fillStyle = '#ffffff';
              const titleText = 'ESTADO DE CUENTA CORRIENTE';
              const titleW = ctx.measureText(titleText).width;
              ctx.fillText(titleText, W - PAD - titleW, 38);

              ctx.font = `12px Arial`;
              ctx.fillStyle = '#93c5fd';
              const dateText = `Fecha: ${fmtDate(new Date())}`;
              const dateW = ctx.measureText(dateText).width;
              ctx.fillText(dateText, W - PAD - dateW, 58);

              y = H_HEADER + SECTION_GAP;

              // ── CLIENT CARD ──────────────────────────────────────────────
              roundRect(PAD, y, W - PAD * 2, H_CLIENT, 8);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
              ctx.strokeStyle = '#dbeafe';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Section label
              ctx.fillStyle = '#2563eb';
              ctx.font = `bold 10px Arial`;
              ctx.fillText('DATOS DEL CLIENTE', PAD + 14, y + 18);
              ctx.fillStyle = '#2563eb';
              ctx.fillRect(PAD + 14, y + 22, 100, 1.5);

              ctx.fillStyle = '#1e293b';
              ctx.font = `bold 18px Arial`;
              ctx.fillText(customer.name, PAD + 14, y + 46);

              ctx.font = `12px Arial`;
              ctx.fillStyle = '#64748b';
              const clientInfoParts = [
                     customer.dni ? `DNI: ${customer.dni}` : '',
                     customer.phone ? `Tel: ${customer.phone}` : '',
                     customer.address ? `Dir: ${customer.address}` : '',
              ].filter(Boolean).join('     ');
              ctx.fillText(clientInfoParts || 'Sin información adicional', PAD + 14, y + 68);

              y += H_CLIENT + SECTION_GAP;

              // ── SUMMARY CARDS ────────────────────────────────────────────
              const cardW = (W - PAD * 2 - 12) / 3;

              const drawSummaryCard = (x: number, label: string, value: string, bg: string, textColor: string) => {
                     roundRect(x, y, cardW, H_SUMMARY, 8);
                     ctx.fillStyle = bg;
                     ctx.fill();
                     ctx.font = `bold 9px Arial`;
                     ctx.fillStyle = textColor;
                     ctx.fillText(label, x + 14, y + 22);
                     ctx.font = `bold 20px Arial`;
                     ctx.fillText(value, x + 14, y + 56);
              };

              const totalDebt = (customer.closedBalance || 0) + (customer.currentBalance || 0);
              drawSummaryCard(PAD, 'MESES ANTERIORES', fmtCurrency(customer.closedBalance || 0), '#ffffff', '#64748b');
              drawSummaryCard(PAD + cardW + 6, 'DEUDA DEL MES', fmtCurrency(customer.currentBalance || 0), '#fff1f2', '#e11d48');
              drawSummaryCard(PAD + (cardW + 6) * 2, 'TOTAL A PAGAR', fmtCurrency(totalDebt), '#eff6ff', '#1d4ed8');

              // Add borders
              [PAD, PAD + cardW + 6, PAD + (cardW + 6) * 2].forEach((x, i) => {
                     roundRect(x, y, cardW, H_SUMMARY, 8);
                     ctx.strokeStyle = i === 0 ? '#e2e8f0' : i === 1 ? '#fecdd3' : '#bfdbfe';
                     ctx.lineWidth = 1.5;
                     ctx.stroke();
              });

              y += H_SUMMARY + SECTION_GAP;

              // ── MOVEMENTS TABLE ──────────────────────────────────────────
              const tableW = W - PAD * 2;
              const colWidths = [110, tableW - 110 - 130 - 120, 130, 120];
              const colX = [PAD, PAD + colWidths[0], PAD + colWidths[0] + colWidths[1], PAD + colWidths[0] + colWidths[1] + colWidths[2]];

              // Table header
              roundRect(PAD, y, tableW, H_TABLE_HEAD, 6);
              ctx.fillStyle = '#1e3a5f';
              ctx.fill();

              ctx.font = `bold 10px Arial`;
              ctx.fillStyle = '#ffffff';
              ['FECHA', 'DESCRIPCIÓN / CONCEPTO', 'IMPORTE', 'SALDO ACUMULADO'].forEach((header, i) => {
                     const align = i >= 2 ? 'right' : 'left';
                     if (align === 'right') {
                            const tw = ctx.measureText(header).width;
                            ctx.fillText(header, colX[i] + colWidths[i] - 10 - tw, y + 21);
                     } else {
                            ctx.fillText(header, colX[i] + (i === 0 ? 10 : 6), y + 21);
                     }
              });

              y += H_TABLE_HEAD;

              // Table rows
              let runningBalance = customer.closedBalance || 0;

              if (movements.length === 0) {
                     roundRect(PAD, y, tableW, ROW_H * 2, 0);
                     ctx.fillStyle = '#ffffff';
                     ctx.fill();
                     ctx.font = `italic 12px Arial`;
                     ctx.fillStyle = '#94a3b8';
                     ctx.textAlign = 'center';
                     ctx.fillText('Sin movimientos registrados', W / 2, y + ROW_H);
                     ctx.textAlign = 'left';
                     y += ROW_H * 2;
              } else {
                     let rowY = y;
                     movements.forEach((mov, idx) => {
                            runningBalance += mov.amount;
                            const isEven = idx % 2 === 0;
                            const items: any[] = mov.saleItems || [];
                            const blockH = ROW_H + items.length * ITEM_ROW_H;

                            // Row background
                            ctx.beginPath();
                            ctx.rect(PAD, rowY, tableW, blockH);
                            ctx.fillStyle = isEven ? '#ffffff' : '#f8fafc';
                            ctx.fill();

                            // Separator
                            ctx.strokeStyle = '#e2e8f0';
                            ctx.lineWidth = 0.5;
                            ctx.beginPath();
                            ctx.moveTo(PAD, rowY + blockH);
                            ctx.lineTo(PAD + tableW, rowY + blockH);
                            ctx.stroke();

                            const cellY = rowY + ROW_H * 0.65;

                            // Date
                            ctx.font = `bold 11px Arial`;
                            ctx.fillStyle = '#374151';
                            ctx.fillText(fmtDate(mov.timestamp), colX[0] + 10, cellY);

                            // Description
                            ctx.font = `11px Arial`;
                            ctx.fillStyle = '#374151';
                            const maxDescW = colWidths[1] - 12;
                            let desc = mov.description || '';
                            while (ctx.measureText(desc).width > maxDescW && desc.length > 0) {
                                   desc = desc.slice(0, -1);
                            }
                            if (desc !== mov.description) desc += '…';
                            ctx.fillText(desc, colX[1] + 6, cellY);

                            // Amount
                            const isDebit = mov.amount > 0;
                            ctx.font = `bold 11px Arial`;
                            ctx.fillStyle = isDebit ? '#dc2626' : '#16a34a';
                            const amtText = (isDebit ? '+' : '') + fmtCurrency(mov.amount);
                            const amtW = ctx.measureText(amtText).width;
                            ctx.fillText(amtText, colX[2] + colWidths[2] - 10 - amtW, cellY);

                            // Running balance
                            ctx.fillStyle = runningBalance > 0 ? '#1d4ed8' : '#16a34a';
                            const balText = fmtCurrency(runningBalance);
                            const balW = ctx.measureText(balText).width;
                            ctx.fillText(balText, colX[3] + colWidths[3] - 10 - balW, cellY);

                            // Sale item sub-rows
                            items.forEach((item: any, iIdx: number) => {
                                   const itemY = rowY + ROW_H + iIdx * ITEM_ROW_H;
                                   const itemCellY = itemY + ITEM_ROW_H * 0.72;

                                   // Indent accent bar
                                   ctx.fillStyle = '#93c5fd';
                                   ctx.fillRect(colX[1] + 6, itemY + 3, 2, ITEM_ROW_H - 6);

                                   // Product name
                                   ctx.font = `10px Arial`;
                                   ctx.fillStyle = '#475569';
                                   const itemNameMaxW = colWidths[1] - 32;
                                   let itemName = item.productNameSnapshot || '';
                                   while (ctx.measureText(itemName).width > itemNameMaxW && itemName.length > 0) {
                                          itemName = itemName.slice(0, -1);
                                   }
                                   if (itemName !== item.productNameSnapshot) itemName += '…';
                                   ctx.fillText(itemName, colX[1] + 14, itemCellY);

                                   // Qty × unit price (right-aligned in amount col)
                                   ctx.font = `10px Arial`;
                                   ctx.fillStyle = '#64748b';
                                   const qtyText = `${item.quantity} × ${fmtCurrency(item.unitPrice)}`;
                                   const qtyW = ctx.measureText(qtyText).width;
                                   ctx.fillText(qtyText, colX[2] + colWidths[2] - 10 - qtyW, itemCellY);

                                   // Subtotal (right-aligned in balance col)
                                   ctx.font = `bold 10px Arial`;
                                   ctx.fillStyle = '#374151';
                                   const subText = fmtCurrency(item.subtotal);
                                   const subW = ctx.measureText(subText).width;
                                   ctx.fillText(subText, colX[3] + colWidths[3] - 10 - subW, itemCellY);
                            });

                            rowY += blockH;
                     });
                     y = rowY;
              }

              y += SECTION_GAP;

              // ── FOOTER ───────────────────────────────────────────────────
              ctx.fillStyle = '#1e3a5f';
              ctx.fillRect(0, y, W, H_FOOTER);
              ctx.fillStyle = '#2563eb';
              ctx.fillRect(0, y, W, 3);

              ctx.font = `13px Arial`;
              ctx.fillStyle = '#93c5fd';
              ctx.textAlign = 'center';
              ctx.fillText(store.ticketFooter || '¡Gracias por su preferencia!', W / 2, y + 28);
              ctx.font = `11px Arial`;
              ctx.fillStyle = '#60a5fa';
              ctx.fillText('Este documento es un resumen de cuenta corriente — No es comprobante fiscal', W / 2, y + 46);
              ctx.textAlign = 'left';

              return canvas;
       };

       const downloadHistoryPDF = async () => {
              if (!selectedCustomer) return;
              try {
                     const { jsPDF } = await import('jspdf');
                     const { getStoreSettings } = await import('@/app/actions/settings');
                     const store = await getStoreSettings();
                     const canvas = buildBoletaCanvas(selectedCustomer, history, store);
                     const imgData = canvas.toDataURL('image/jpeg', 0.97);
                     const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                     const pageW = pdf.internal.pageSize.getWidth();
                     const imgH = pageW * (canvas.height / canvas.width);
                     pdf.addImage(imgData, 'JPEG', 0, 0, pageW, imgH);
                     pdf.save(`${selectedCustomer.name.replace(/\s+/g, '_')}_cuenta_corriente.pdf`);
              } catch (e) {
                     console.error('Error al generar PDF:', e);
                     alert('No se pudo generar el PDF. Intentá de nuevo.');
              }
       };

       const downloadHistoryJPG = async () => {
              if (!selectedCustomer) return;
              try {
                     const { getStoreSettings } = await import('@/app/actions/settings');
                     const store = await getStoreSettings();
                     const canvas = buildBoletaCanvas(selectedCustomer, history, store);
                     const link = document.createElement('a');
                     link.download = `${selectedCustomer.name.replace(/\s+/g, '_')}_cuenta_corriente.jpg`;
                     link.href = canvas.toDataURL('image/jpeg', 0.97);
                     document.body.appendChild(link);
                     link.click();
                     document.body.removeChild(link);
              } catch (e) {
                     console.error('Error al generar JPG:', e);
                     alert('No se pudo generar la imagen. Intentá de nuevo.');
              }
       };

       const handleViewHistory = async (customer: Customer) => {
              setSelectedCustomer(customer);
              setLoading(true);
              try {
                     const hist = await getCustomerHistory(customer.id);
                     setHistory(hist);
                     setIsHistoryOpen(true);
              } catch (e) {
                     console.error(e);
              } finally {
                     setLoading(false);
              }
       };

       const filtered = customers.filter(c =>
              c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (c.dni && c.dni.includes(searchQuery)) ||
              (c.phone && c.phone.includes(searchQuery))
       );

       return (
              <div className="space-y-6">
                     <div className="flex justify-between items-center">
                            <div>
                                   <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                                   <p className="text-sm text-gray-500">Gestione sus clientes y cuentas corrientes</p>
                            </div>
                            <button
                                   onClick={() => setIsCreateOpen(true)}
                                   className="bg-blue-600 text-white px-4 py-2 rounded-xl border-b-4 border-blue-800 flex items-center gap-2 hover:bg-blue-700 active:border-b-0 active:translate-y-[2px] transition-all font-bold"
                            >
                                   <UserPlus className="h-4 w-4" />
                                   CREAR CUENTA / CLIENTE
                            </button>
                     </div>

                     <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3 shadow-sm">
                            <Search className="text-gray-400 h-5 w-5" />
                            <input
                                   placeholder="Buscar por nombre, DNI o teléfono..."
                                   className="flex-1 outline-none text-gray-700 font-medium"
                                   value={searchQuery}
                                   onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                   <span className="text-xs text-gray-400 font-bold">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
                            )}
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                   <div className="col-span-full py-20 text-center text-gray-400 font-medium">Cargando clientes...</div>
                            ) : error ? (
                                   <div className="col-span-full py-20 text-center text-red-500 font-medium flex flex-col items-center gap-2">
                                          <Shield className="h-8 w-8" />
                                          <p>{error}</p>
                                          <button onClick={fetchCustomers} className="text-blue-600 underline text-sm">Reintentar</button>
                                   </div>
                            ) : filtered.length === 0 ? (
                                   <div className="col-span-full py-20 text-center text-gray-400 font-medium">
                                          {searchQuery ? "No se encontraron clientes con esa búsqueda." : "No hay clientes registrados."}
                                   </div>
                            ) : filtered.map(customer => (
                                   <div key={customer.id} className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                                          <div className="flex justify-between items-start mb-6">
                                                 <div className="space-y-1">
                                                        <div className="flex items-center gap-3">
                                                               <h3 className="font-black text-xl text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{customer.name}</h3>
                                                               {/* Edit & Delete buttons */}
                                                               <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                      <button
                                                                             onClick={() => openEdit(customer)}
                                                                             className="p-1.5 rounded-lg bg-blue-50/50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                                             title="Editar cliente"
                                                                      >
                                                                             <Pencil className="h-4 w-4" />
                                                                      </button>
                                                                      <button
                                                                             onClick={() => handleDelete(customer)}
                                                                             className="p-1.5 rounded-lg bg-red-50/50 text-red-600 hover:bg-red-100 transition-colors"
                                                                             title="Eliminar cliente"
                                                                      >
                                                                             <Trash2 className="h-4 w-4" />
                                                                      </button>
                                                               </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                               <Hash className="h-3 w-3" />
                                                               <span>DNI: {customer.dni || "---"}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{customer.phone || "Sin teléfono"}</p>
                                                 </div>
                                                 <div className="text-right">
                                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">Deuda Anterior</p>
                                                        <p className={cn(
                                                               "text-sm font-bold",
                                                               Number(customer.closedBalance) > 0 ? 'text-red-400' : 'text-emerald-400'
                                                        )}>
                                                               {formatCurrency(customer.closedBalance)}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mt-2 mb-1">Deuda Actual</p>
                                                        <p className={cn(
                                                               "text-2xl font-black",
                                                               Number(customer.currentBalance) > 0 ? 'text-red-500' : 'text-emerald-500'
                                                        )}>
                                                               {formatCurrency(customer.currentBalance)}
                                                        </p>
                                                 </div>
                                          </div>

                                          <div className="space-y-3 mb-6">
                                                 <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        <span className="truncate">{customer.address || "Dirección no registrada"}</span>
                                                 </div>
                                                 <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                                               <Shield className="h-3.5 w-3.5" />
                                                               Límite de Crédito
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-700">{formatCurrency(customer.creditLimit || 0)}</span>
                                                 </div>
                                          </div>

                                          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                                                 <button
                                                        onClick={() => {
                                                               setSelectedCustomer(customer);
                                                               setIsPaymentOpen(true);
                                                        }}
                                                        className="flex-[1_1_30%] bg-emerald-50 text-emerald-700 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
                                                 >
                                                        <Wallet className="h-4 w-4" />
                                                        COBRAR
                                                 </button>
                                                 <button
                                                        onClick={() => handleViewHistory(customer)}
                                                        className="flex-[1_1_30%] bg-blue-50 text-blue-700 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                                                 >
                                                        <History className="h-4 w-4" />
                                                        HISTORIAL
                                                 </button>
                                                 <button
                                                        onClick={() => {
                                                               const totalDeuda = Number(customer.currentBalance) + Number(customer.closedBalance);
                                                               const text = `🧾 *RESUMEN DE CUENTA*\n👤 Cliente: ${customer.name}\n\nDeuda Anterior: ${formatCurrency(customer.closedBalance)}\nDeuda Actual: ${formatCurrency(customer.currentBalance)}\n\n💰 *Total a pagar: ${formatCurrency(totalDeuda)}*`;
                                                               let url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                                                               if (customer.phone) {
                                                                      const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
                                                                      if (cleanPhone) url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
                                                               }
                                                               window.open(url, '_blank');
                                                        }}
                                                        className="flex-[1_1_30%] bg-[#25D366]/10 text-[#25D366] py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-1.5"
                                                 >
                                                        <MessageSquare className="h-4 w-4" />
                                                        WhatsApp
                                                 </button>
                                          </div>
                                   </div>
                            ))}
                     </div>

                     {/* History Modal */}
                     <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={`Cuenta Corriente: ${selectedCustomer?.name}`} className="sm:max-w-4xl">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                   <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center">
                                          <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Meses Anteriores</span>
                                          <p className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(selectedCustomer?.closedBalance || 0)}</p>
                                   </div>
                                   <div className="bg-red-50 border border-red-100 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center">
                                          <span className="text-[10px] uppercase font-black tracking-widest text-red-500">Deuda Actual</span>
                                          <p className="text-2xl font-black text-red-600 mt-1">{formatCurrency(selectedCustomer?.currentBalance || 0)}</p>
                                   </div>
                                   <div className="flex flex-col gap-2">
                                          <button
                                                 onClick={downloadHistoryCSV}
                                                 className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                                          >
                                                 <Download className="h-4 w-4" /> CSV
                                          </button>
                                          <button
                                                 onClick={downloadHistoryPDF}
                                                 className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                                          >
                                                 <Download className="h-4 w-4" /> PDF
                                          </button>
                                          <button
                                                 onClick={downloadHistoryJPG}
                                                 className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                                          >
                                                 <Download className="h-4 w-4" /> Imagen JPG
                                          </button>
                                   </div>
                            </div>
                            <div ref={historyContentRef}>

                            <div className="border border-gray-100 rounded-2xl shadow-sm overflow-hidden bg-white mb-6">
                                   <div className="overflow-x-auto">
                                          <table className="w-full text-sm text-left">
                                                 <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                        <tr>
                                                               <th className="p-4">Fecha</th>
                                                               <th className="p-4">Descripción / Concepto</th>
                                                               <th className="p-4 text-right">Monto</th>
                                                        </tr>
                                                 </thead>
                                                 <tbody className="divide-y divide-gray-100">
                                                        {history.map((h: any) => (
                                                               <React.Fragment key={h.id}>
                                                                      <tr
                                                                             onClick={() => handleExpandMovement(h)}
                                                                             className={`hover:bg-gray-50 transition-colors ${h.description?.includes('Venta #') ? 'cursor-pointer' : ''}`}
                                                                      >
                                                                             <td className="p-4">
                                                                                    <div className="flex flex-col">
                                                                                           <span className="font-bold text-gray-900">{formatDate(h.timestamp)}</span>
                                                                                           <span className="text-[10px] text-gray-400">{formatTime(h.timestamp)}</span>
                                                                                    </div>
                                                                             </td>
                                                                             <td className="p-4 font-medium text-gray-700 uppercase text-xs">
                                                                                    <div className="flex items-center gap-2">
                                                                                           {h.description}
                                                                                           {h.description?.includes('Venta #') && (
                                                                                                  <span className="text-gray-400">
                                                                                                         {expandedMovementId === h.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                                                  </span>
                                                                                           )}
                                                                                    </div>
                                                                             </td>
                                                                             <td className={`p-4 text-right font-black text-sm ${h.amount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                                    {h.amount > 0 ? '+' : ''}{formatCurrency(h.amount)}
                                                                             </td>
                                                                      </tr>
                                                                      {expandedMovementId === h.id && movementSaleDetails && (
                                                                             <tr>
                                                                                    <td colSpan={3} className="px-4 py-3 bg-blue-50/50 border-y border-blue-100">
                                                                                           <div className="text-[10px] font-black uppercase text-gray-500 mb-2">Productos de la Venta</div>
                                                                                           <div className="space-y-2">
                                                                                                  {movementSaleDetails.items.map((item: any) => (
                                                                                                         <div key={item.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-gray-100 shadow-sm">
                                                                                                                <div className="flex items-center gap-2">
                                                                                                                       <span className="font-bold">{item.productNameSnapshot}</span>
                                                                                                                       <span className="text-gray-400">x{item.quantity}</span>
                                                                                                                </div>
                                                                                                                <div className="flex items-center gap-4">
                                                                                                                       <span className="font-bold text-gray-700">{formatCurrency(item.subtotal)}</span>
                                                                                                                       <button
                                                                                                                              onClick={(e) => { e.stopPropagation(); handleRemoveItem(h.id, movementSaleDetails.id, item.id, item.productNameSnapshot); }}
                                                                                                                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                                                                                                              title="Eliminar este producto de la cuenta"
                                                                                                                       >
                                                                                                                              <PackageMinus className="w-4 h-4" />
                                                                                                                       </button>
                                                                                                                </div>
                                                                                                         </div>
                                                                                                  ))}
                                                                                                  {movementSaleDetails.items.length === 0 && (
                                                                                                         <div className="text-xs text-center text-gray-400 py-2">Sin productos (venta anulada completamente)</div>
                                                                                                  )}
                                                                                           </div>
                                                                                    </td>
                                                                             </tr>
                                                                      )}
                                                                      {expandedMovementId === h.id && h.description?.includes('Venta #') && !movementSaleDetails && (
                                                                             <tr>
                                                                                    <td colSpan={3} className="px-4 py-3 bg-gray-50 text-center text-xs text-gray-400">
                                                                                           Cargando detalles...
                                                                                    </td>
                                                                             </tr>
                                                                      )}
                                                               </React.Fragment>
                                                        ))}
                                                        {history.length === 0 && (
                                                               <tr>
                                                                      <td colSpan={3} className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Sin movimientos registrados</td>
                                                               </tr>
                                                        )}
                                                 </tbody>
                                          </table>
                                   </div>
                            </div>
                            </div>{/* end historyContentRef */}
                            <div className="pt-4 border-t border-gray-100 flex justify-end">
                                   <button
                                          onClick={() => setIsHistoryOpen(false)}
                                          className="px-8 py-3 bg-gray-900 text-white font-black rounded-xl hover:bg-gray-800 uppercase text-xs tracking-widest transition-colors"
                                   >
                                          Cerrar Historial
                                   </button>
                            </div>
                     </Modal>

                     {/* Create Customer Modal */}
                     <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="NUEVO CLIENTE / CUENTA CORRIENTE">
                            <div className="space-y-6">
                                   <div className="grid grid-cols-2 gap-4">
                                          <div className="col-span-2">
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre Completo *</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold placeholder:font-normal focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                        placeholder="Nombre y Apellido"
                                                        value={newCustomer.name}
                                                        onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                                 />
                                          </div>
                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">DNI / ID</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold outline-none"
                                                        placeholder="00.000.000"
                                                        value={newCustomer.dni}
                                                        onChange={e => setNewCustomer({ ...newCustomer, dni: e.target.value })}
                                                 />
                                          </div>
                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Teléfono</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold outline-none"
                                                        placeholder="+54 9 ..."
                                                        value={newCustomer.phone}
                                                        onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                                 />
                                          </div>
                                          <div className="col-span-2">
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Dirección</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold outline-none"
                                                        placeholder="Calle, Número, Ciudad"
                                                        value={newCustomer.address}
                                                        onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                                 />
                                          </div>
                                          <div className="col-span-2">
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Límite de Crédito ($)</label>
                                                 <div className="relative">
                                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                        <input
                                                               type="number"
                                                               className="w-full bg-blue-50 border border-blue-100 pl-10 p-4 rounded-xl text-xl font-black text-blue-700 outline-none"
                                                               value={newCustomer.creditLimit}
                                                               onChange={e => setNewCustomer({ ...newCustomer, creditLimit: Number(e.target.value) })}
                                                        />
                                                 </div>
                                                 <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase">Monto máximo que el cliente puede adeudar.</p>
                                          </div>
                                   </div>
                                   <button
                                          onClick={handleCreate}
                                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 transition-all uppercase tracking-tight"
                                   >
                                          Confirmar y Crear Cuenta
                                   </button>
                            </div>
                     </Modal>

                     {/* Edit Customer Modal */}
                     <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`EDITAR: ${selectedCustomer?.name || ''}`}>
                            <div className="space-y-6">
                                   <div className="grid grid-cols-2 gap-4">
                                          <div className="col-span-2">
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre Completo *</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold placeholder:font-normal focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                        value={editForm.name}
                                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                 />
                                          </div>
                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">DNI / ID</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold outline-none"
                                                        value={editForm.dni}
                                                        onChange={e => setEditForm({ ...editForm, dni: e.target.value })}
                                                 />
                                          </div>
                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Teléfono</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold outline-none"
                                                        value={editForm.phone}
                                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                                 />
                                          </div>
                                          <div className="col-span-2">
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Dirección</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold outline-none"
                                                        value={editForm.address}
                                                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                                 />
                                          </div>
                                          <div className="col-span-2">
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Límite de Crédito ($)</label>
                                                 <div className="relative">
                                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                        <input
                                                               type="number"
                                                               className="w-full bg-blue-50 border border-blue-100 pl-10 p-4 rounded-xl text-xl font-black text-blue-700 outline-none"
                                                               value={editForm.creditLimit}
                                                               onChange={e => setEditForm({ ...editForm, creditLimit: Number(e.target.value) })}
                                                        />
                                                 </div>
                                          </div>
                                   </div>
                                   <button
                                          onClick={handleEdit}
                                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 transition-all uppercase tracking-tight"
                                   >
                                          Guardar Cambios
                                   </button>
                            </div>
                     </Modal>

                     {/* Payment Modal */}
                     <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title={`CARGAR PAGO: ${selectedCustomer?.name || 'Cliente'}`}>
                            <div className="space-y-6">
                                   <div className="bg-red-50 p-6 rounded-[2rem] text-center border border-red-100 flex flex-col gap-2">
                                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Deuda Pendiente</p>
                                          <p className="text-4xl font-black text-red-700">{formatCurrency(selectedCustomer?.currentBalance || 0)}</p>
                                          <button
                                                 onClick={() => selectedCustomer && setPaymentAmount(Number(selectedCustomer.currentBalance).toString())}
                                                 className="mx-auto mt-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                                          >
                                                 <Wallet className="w-3 h-3" />
                                                 Saldar Total
                                          </button>
                                   </div>

                                   <div className="space-y-4">
                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Monto a abonar ($)</label>
                                                 <input
                                                        type="number"
                                                        className="w-full border-2 border-gray-100 p-6 rounded-2xl font-black text-4xl text-center text-gray-900 outline-none focus:border-emerald-500 transition-all shadow-inner"
                                                        value={paymentAmount}
                                                        onChange={e => setPaymentAmount(e.target.value)}
                                                        placeholder="0.00"
                                                        autoFocus
                                                 />
                                          </div>

                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Método de Pago</label>
                                                 <div className="grid grid-cols-2 gap-3">
                                                        {['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO'].map((method) => (
                                                               <button
                                                                      key={method}
                                                                      onClick={() => setSelectedPaymentMethod(method)}
                                                                      className={cn(
                                                                             "p-3 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all",
                                                                             selectedPaymentMethod === method ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-100 text-gray-400 hover:border-gray-200"
                                                                      )}
                                                               >
                                                                      {method}
                                                               </button>
                                                        ))}
                                                 </div>
                                          </div>
                                   </div>

                                   <button
                                          onClick={handlePayment}
                                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-emerald-100 flex justify-center items-center gap-3 transition-all"
                                   >
                                          <CheckCircle className="h-6 w-6" />
                                          CONFIRMAR COBRO
                                   </button>
                            </div>
                     </Modal>
              </div>
       );
}

function CheckCircle(props: any) {
       return (
              <svg
                     {...props}
                     xmlns="http://www.w3.org/2000/svg"
                     width="24"
                     height="24"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
              >
                     <circle cx="12" cy="12" r="10" />
                     <path d="m9 12 2 2 4-4" />
              </svg>
       )
}
