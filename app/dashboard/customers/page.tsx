"use client";

import React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import { UserPlus, Search, Wallet, History, Shield, MapPin, Hash, DollarSign, Pencil, Trash2, MessageSquare, Download, CalendarCheck, ChevronDown, ChevronUp, PackageMinus, Printer, FileText, Receipt } from "lucide-react";
import { getCustomers, registerPayment, createCustomer, getCustomerHistory, updateCustomer, deleteCustomer, closeCustomerMonth, getSaleDetailsForMovement, removeProductFromAccountSale, getCustomerHistoryByMonth } from "@/app/actions/customers";
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

        // Payment Receipt
        const [isReceiptOpen, setIsReceiptOpen] = useState(false);
        const [receiptData, setReceiptData] = useState<any>(null);

        // Month-by-month history
        const [isMonthHistoryOpen, setIsMonthHistoryOpen] = useState(false);
        const [monthGroups, setMonthGroups] = useState<any[]>([]);
        const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

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
                     alert("Ingrese un monto vÃ¡lido a abonar (distinto de 0).");
                     return;
              }
              try {
                     const res = await registerPayment(selectedCustomer.id, amountNum, "Pago a cuenta", selectedPaymentMethod);
                     if (res?.error) {
                            alert(res.error);
                            return;
                     }
                     // Store receipt data and show receipt modal
                     if (res?.receiptData) {
                            setReceiptData(res.receiptData);
                            setIsPaymentOpen(false);
                            setIsReceiptOpen(true);
                     } else {
                            setIsPaymentOpen(false);
                     }
                     setPaymentAmount("");
                     setSelectedPaymentMethod("EFECTIVO");
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
              if (!confirm(`Â¿EstÃ¡s seguro de eliminar a "${customer.name}"? Sus movimientos de cuenta se conservarÃ¡n.`)) return;
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
              if (!confirm(`Â¿Seguro que deseas eliminar/devolver el producto ${itemName} de esta cuenta?`)) return;
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
              if (!confirm(`Â¿Cerrar el mes para ${customer.name}? Esto separarÃ¡ la deuda actual y comenzarÃ¡ un nuevo mes en 0.`)) return;

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

       // â”€â”€â”€ Boleta builder (pure Canvas, no DOM capture) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

              // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

              // â”€â”€ Background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              ctx.fillStyle = '#f1f5f9';
              ctx.fillRect(0, 0, W, TOTAL_H);

              let y = 0;

              // â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
              const headerLine2Parts = [store.address, store.phone ? `Tel: ${store.phone}` : '', store.cuit ? `CUIT: ${store.cuit}` : ''].filter(Boolean).join('   â€¢   ');
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

              // â”€â”€ CLIENT CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
              ctx.fillText(clientInfoParts || 'Sin informaciÃ³n adicional', PAD + 14, y + 68);

              y += H_CLIENT + SECTION_GAP;

              // â”€â”€ SUMMARY CARDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

              // â”€â”€ MOVEMENTS TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              const tableW = W - PAD * 2;
              const colWidths = [110, tableW - 110 - 130 - 120, 130, 120];
              const colX = [PAD, PAD + colWidths[0], PAD + colWidths[0] + colWidths[1], PAD + colWidths[0] + colWidths[1] + colWidths[2]];

              // Table header
              roundRect(PAD, y, tableW, H_TABLE_HEAD, 6);
              ctx.fillStyle = '#1e3a5f';
              ctx.fill();

              ctx.font = `bold 10px Arial`;
              ctx.fillStyle = '#ffffff';
              ['FECHA', 'DESCRIPCIÃ“N / CONCEPTO', 'IMPORTE', 'SALDO ACUMULADO'].forEach((header, i) => {
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
              // Start from 0 because MONTH_CLOSE movements already carry over
              // the old balance. Starting from closedBalance would double-count.
              let runningBalance = 0;

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
                            if (desc !== mov.description) desc += 'â€¦';
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
                                   if (itemName !== item.productNameSnapshot) itemName += 'â€¦';
                                   ctx.fillText(itemName, colX[1] + 14, itemCellY);

                                   // Qty Ã— unit price (right-aligned in amount col)
                                   ctx.font = `10px Arial`;
                                   ctx.fillStyle = '#64748b';
                                   const qtyText = `${item.quantity} Ã— ${fmtCurrency(item.unitPrice)}`;
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

              // â”€â”€ FOOTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              ctx.fillStyle = '#1e3a5f';
              ctx.fillRect(0, y, W, H_FOOTER);
              ctx.fillStyle = '#2563eb';
              ctx.fillRect(0, y, W, 3);

              ctx.font = `13px Arial`;
              ctx.fillStyle = '#93c5fd';
              ctx.textAlign = 'center';
              ctx.fillText(store.ticketFooter || 'Â¡Gracias por su preferencia!', W / 2, y + 28);
              ctx.font = `11px Arial`;
              ctx.fillStyle = '#60a5fa';
              ctx.fillText('Este documento es un resumen de cuenta corriente â€” No es comprobante fiscal', W / 2, y + 46);
              ctx.textAlign = 'left';

              return canvas;
       };

       const downloadHistoryPDF = async () => {
              if (!selectedCustomer) return;
              try {
                     const { jsPDF } = await import('jspdf');
                     const { getStoreSettings } = await import('@/app/actions/settings');
                     const store = await getStoreSettings();
                     const canvas = buildBoletaCanvas(selectedCustomer, [...history].reverse(), store);
                     const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                     const pageW = pdf.internal.pageSize.getWidth();
                     const pageH = pdf.internal.pageSize.getHeight();
                     const canvasPageH = Math.floor(canvas.width * pageH / pageW);
                     // Build cut boundaries aligned to movement block edges (same constants as buildBoletaCanvas)
                     const SC = 2, ROW_H_B = 26, ITEM_ROW_H_B = 18, GAP_B = 14;
                     const tableStartPx = (110 + GAP_B + 90 + GAP_B + 80 + GAP_B + 32) * SC;
                     const boundaries: number[] = [0];
                     let blockYPx = tableStartPx;
                     for (const mov of history) {
                            blockYPx += (ROW_H_B + (mov.saleItems?.length || 0) * ITEM_ROW_H_B) * SC;
                            boundaries.push(blockYPx);
                     }
                     boundaries.push(canvas.height);
                     // Slice pages cutting only at block boundaries
                     let pageStartPx = 0;
                     let isFirst = true;
                     while (pageStartPx < canvas.height) {
                            const pageEndMax = pageStartPx + canvasPageH;
                            let cutPx = canvas.height;
                            if (pageEndMax < canvas.height) {
                                   const fitting = boundaries.filter(b => b > pageStartPx && b <= pageEndMax);
                                   cutPx = fitting.length > 0 ? Math.max(...fitting) : pageEndMax;
                                   if (cutPx <= pageStartPx) cutPx = pageEndMax;
                            }
                            if (!isFirst) pdf.addPage();
                            isFirst = false;
                            const sliceH = Math.min(cutPx, canvas.height) - pageStartPx;
                            const sliceCanvas = document.createElement('canvas');
                            sliceCanvas.width = canvas.width;
                            sliceCanvas.height = sliceH;
                            const sliceCtx = sliceCanvas.getContext('2d')!;
                            sliceCtx.drawImage(canvas, 0, pageStartPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
                            const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.97);
                            pdf.addImage(sliceData, 'JPEG', 0, 0, pageW, pageW * sliceH / canvas.width);
                            pageStartPx = cutPx;
                     }
                     pdf.save(`${selectedCustomer.name.replace(/\s+/g, '_')}_cuenta_corriente.pdf`);
              } catch (e) {
                     console.error('Error al generar PDF:', e);
                     alert('No se pudo generar el PDF. IntentÃ¡ de nuevo.');
              }
       };

       const downloadHistoryJPG = async () => {
              if (!selectedCustomer) return;
              try {
                     const { getStoreSettings } = await import('@/app/actions/settings');
                     const store = await getStoreSettings();
                     const canvas = buildBoletaCanvas(selectedCustomer, [...history].reverse(), store);
                     const link = document.createElement('a');
                     link.download = `${selectedCustomer.name.replace(/\s+/g, '_')}_cuenta_corriente.jpg`;
                     link.href = canvas.toDataURL('image/jpeg', 0.97);
                     document.body.appendChild(link);
                     link.click();
                     document.body.removeChild(link);
              } catch (e) {
                     console.error('Error al generar JPG:', e);
                     alert('No se pudo generar la imagen. IntentÃ¡ de nuevo.');
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

       // â”€â”€â”€ Month-by-month history â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       const handleViewMonthHistory = async (customer: Customer) => {
              setSelectedCustomer(customer);
              setLoading(true);
              try {
                     const result = await getCustomerHistoryByMonth(customer.id);
                     setMonthGroups(result.months || []);
                     setExpandedMonth(null);
                     setIsMonthHistoryOpen(true);
              } catch (e) {
                     console.error(e);
              } finally {
                     setLoading(false);
              }
       };

       const downloadMonthPDF = async (monthGroup: any) => {
              if (!selectedCustomer) return;
              try {
                     const { jsPDF } = await import('jspdf');
                     const { getStoreSettings } = await import('@/app/actions/settings');
                     const store = await getStoreSettings();
                     const canvas = buildBoletaCanvas(selectedCustomer, monthGroup.movements, store);
                     const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                     const pageW = pdf.internal.pageSize.getWidth();
                     const pageH = pdf.internal.pageSize.getHeight();
                     const canvasPageH = Math.floor(canvas.width * pageH / pageW);
                     let pageStartPx = 0;
                     let isFirst = true;
                     while (pageStartPx < canvas.height) {
                            const cutPx = Math.min(pageStartPx + canvasPageH, canvas.height);
                            if (!isFirst) pdf.addPage();
                            isFirst = false;
                            const sliceH = cutPx - pageStartPx;
                            const sliceCanvas = document.createElement('canvas');
                            sliceCanvas.width = canvas.width;
                            sliceCanvas.height = sliceH;
                            const sliceCtx = sliceCanvas.getContext('2d')!;
                            sliceCtx.drawImage(canvas, 0, pageStartPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
                            const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.97);
                            pdf.addImage(sliceData, 'JPEG', 0, 0, pageW, pageW * sliceH / canvas.width);
                            pageStartPx = cutPx;
                     }
                     const safeName = selectedCustomer.name.replace(/\s+/g, '_');
                     pdf.save(`${safeName}_${monthGroup.monthKey}.pdf`);
              } catch (e) {
                     console.error('Error al generar PDF del mes:', e);
                     alert('No se pudo generar el PDF. IntentÃ¡ de nuevo.');
              }
       };

       const downloadMonthJPG = async (monthGroup: any) => {
              if (!selectedCustomer) return;
              try {
                     const { getStoreSettings } = await import('@/app/actions/settings');
                     const store = await getStoreSettings();
                     const canvas = buildBoletaCanvas(selectedCustomer, monthGroup.movements, store);
                     const link = document.createElement('a');
                     const safeName = selectedCustomer.name.replace(/\s+/g, '_');
                     link.download = `${safeName}_${monthGroup.monthKey}.jpg`;
                     link.href = canvas.toDataURL('image/jpeg', 0.97);
                     document.body.appendChild(link);
                     link.click();
                     document.body.removeChild(link);
              } catch (e) {
                     console.error('Error al generar JPG del mes:', e);
                     alert('No se pudo generar la imagen. IntentÃ¡ de nuevo.');
              }
       };

       // â”€â”€â”€ Payment Receipt Printer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       const printPaymentReceipt = async () => {
              if (!receiptData) return;
              try {
                     const { getStoreSettings } = await import('@/app/actions/settings');
                     const store = await getStoreSettings();
                     const paperWidthMm = Number(localStorage.getItem("paperWidthMm") || "58");
                     const PAPER_PROFILES: Record<number, { fontSize: number }> = {
                            30: { fontSize: 9 },
                            50: { fontSize: 10 },
                            58: { fontSize: 11 },
                            80: { fontSize: 12 }
                     };
                     const profile = PAPER_PROFILES[paperWidthMm] || PAPER_PROFILES[58];
                     const fs = profile.fontSize;

                     const fmtCurr = (n: number) =>
                            new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);
                     const fmtDate2 = (ts: string) => {
                            const d = new Date(ts);
                            return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
                     };

                     const totalPreviousDebt = receiptData.previousClosedBalance + receiptData.previousCurrentBalance;
                     const totalRemainingDebt = receiptData.remainingClosedBalance + receiptData.remainingCurrentBalance;

                     const printWindow = window.open('', '_blank', 'width=400,height=600');
                     if (!printWindow) {
                            alert('No se pudo abrir la ventana de impresiÃ³n.');
                            return;
                     }

                     printWindow.document.write(`
                     <!DOCTYPE html>
                     <html>
                     <head>
                            <meta charset="utf-8">
                            <title>Comprobante de Pago</title>
                            <style>
                                   @page { margin: 0; }
                                   * { margin: 0; padding: 0; box-sizing: border-box; }
                                   body { 
                                          font-family: Arial, sans-serif; 
                                          font-size: ${fs}px; 
                                          padding: 2mm 4mm;
                                          color: #000;
                                          max-width: 100%;
                                   }
                                   .center { text-align: center; }
                                   .bold { font-weight: bold; }
                                   .sep { border-top: 1px dashed #000; margin: 4px 0; }
                                   .sep-double { border-top: 2px solid #000; margin: 6px 0; }
                                   .row { display: flex; justify-content: space-between; padding: 1px 0; }
                                   .big { font-size: ${fs + 4}px; font-weight: 900; }
                                   .small { font-size: ${fs - 2}px; color: #555; }
                                   .amount-paid { 
                                          font-size: ${fs + 6}px; 
                                          font-weight: 900; 
                                          text-align: center;
                                          padding: 6px;
                                          background: #000;
                                          color: #fff;
                                          margin: 4px 0;
                                   }
                                   .remaining {
                                          text-align: center;
                                          padding: 4px;
                                          border: 2px solid #000;
                                          margin: 4px 0;
                                   }
                            </style>
                     </head>
                     <body>
                            <div class="center bold" style="font-size: ${fs + 6}px; text-transform: uppercase; letter-spacing: 1px;">
                                   ${store.name || 'MI NEGOCIO'}
                            </div>
                            <div class="center small">
                                   ${store.address ? store.address + '<br>' : ''}
                                   ${store.phone ? 'Tel: ' + store.phone : ''}
                                   ${store.cuit ? ' â€¢ CUIT: ' + store.cuit : ''}
                            </div>
                            
                            <div class="sep-double"></div>
                            
                            <div class="center bold" style="font-size: ${fs + 2}px; text-transform: uppercase; letter-spacing: 3px;">
                                   COMPROBANTE DE PAGO
                            </div>
                            
                            <div class="sep"></div>
                            
                            <div class="row small">
                                   <span>FECHA:</span>
                                   <span class="bold">${fmtDate2(receiptData.timestamp)}</span>
                            </div>
                            
                            <div class="sep"></div>
                            
                            <div class="row">
                                   <span class="bold">CLIENTE:</span>
                                   <span class="bold">${receiptData.customerName}</span>
                            </div>
                            ${receiptData.customerDni ? `<div class="row small"><span>DNI:</span><span>${receiptData.customerDni}</span></div>` : ''}
                            
                            <div class="sep"></div>
                            
                            <div class="row small">
                                   <span>DEUDA ANTERIOR:</span>
                                   <span>${fmtCurr(receiptData.previousClosedBalance)}</span>
                            </div>
                            <div class="row small">
                                   <span>DEUDA MES ACTUAL:</span>
                                   <span>${fmtCurr(receiptData.previousCurrentBalance)}</span>
                            </div>
                            <div class="row bold">
                                   <span>TOTAL ADEUDADO:</span>
                                   <span>${fmtCurr(totalPreviousDebt)}</span>
                            </div>
                            
                            <div class="sep-double"></div>
                            
                            <div class="row small">
                                   <span>MÃ‰TODO DE PAGO:</span>
                                   <span class="bold">${receiptData.paymentMethod}</span>
                            </div>
                            
                            <div class="amount-paid">
                                   ABONÃ“: ${fmtCurr(receiptData.paidAmount)}
                            </div>
                            
                            ${receiptData.deductedFromClosed > 0 ? `
                            <div class="row small">
                                   <span>Aplicado a deuda anterior:</span>
                                   <span>-${fmtCurr(receiptData.deductedFromClosed)}</span>
                            </div>
                            ` : ''}
                            ${receiptData.deductedFromCurrent > 0 ? `
                            <div class="row small">
                                   <span>Aplicado a deuda actual:</span>
                                   <span>-${fmtCurr(receiptData.deductedFromCurrent)}</span>
                            </div>
                            ` : ''}
                            
                            <div class="sep"></div>
                            
                            <div class="remaining">
                                   <div class="small bold" style="text-transform: uppercase; letter-spacing: 2px;">SALDO RESTANTE</div>
                                   <div class="big">${fmtCurr(totalRemainingDebt)}</div>
                                   <div class="small">Anterior: ${fmtCurr(receiptData.remainingClosedBalance)} â€¢ Actual: ${fmtCurr(receiptData.remainingCurrentBalance)}</div>
                            </div>
                            
                            <div class="sep-double"></div>
                            
                            <div class="center bold" style="margin-top: 6px; font-size: ${fs}px;">
                                   ${store.ticketFooter || 'Â¡Gracias por su pago!'}
                            </div>
                            <div class="center small" style="margin-top: 4px;">
                                   Este comprobante certifica el pago recibido
                            </div>
                     </body>
                     </html>
                     `);
                     printWindow.document.close();
                     setTimeout(() => {
                            printWindow.print();
                            printWindow.close();
                     }, 300);
              } catch (e) {
                     console.error('Error al imprimir comprobante:', e);
                     alert('No se pudo imprimir el comprobante.');
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
                                   placeholder="Buscar por nombre, DNI o telÃ©fono..."
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
                                          {searchQuery ? "No se encontraron clientes con esa bÃºsqueda." : "No hay clientes registrados."}
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
                                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{customer.phone || "Sin telÃ©fono"}</p>
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
                                                        <span className="truncate">{customer.address || "DirecciÃ³n no registrada"}</span>
                                                 </div>
                                                 <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                                               <Shield className="h-3.5 w-3.5" />
                                                               LÃ­mite de CrÃ©dito
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
                                                        onClick={() => handleViewMonthHistory(customer)}
                                                        className="flex-[1_1_30%] bg-violet-50 text-violet-700 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-violet-100 transition-colors flex items-center justify-center gap-1.5"
                                                 >
                                                        <FileText className="h-4 w-4" />
                                                        PDFs x MES
                                                 </button>
                                                 <button
                                                        onClick={() => {
                                                               const totalDeuda = Number(customer.currentBalance) + Number(customer.closedBalance);
                                                               const text = `ðŸ§¾ *RESUMEN DE CUENTA*\nðŸ‘¤ Cliente: ${customer.name}\n\nDeuda Anterior: ${formatCurrency(customer.closedBalance)}\nDeuda Actual: ${formatCurrency(customer.currentBalance)}\n\nðŸ’° *Total a pagar: ${formatCurrency(totalDeuda)}*`;
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
                                                               <th className="p-4">DescripciÃ³n / Concepto</th>
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
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">TelÃ©fono</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold outline-none"
                                                        placeholder="+54 9 ..."
                                                        value={newCustomer.phone}
                                                        onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                                 />
                                          </div>
                                          <div className="col-span-2">
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">DirecciÃ³n</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold outline-none"
                                                        placeholder="Calle, NÃºmero, Ciudad"
                                                        value={newCustomer.address}
                                                        onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                                 />
                                          </div>
                                          <div className="col-span-2">
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">LÃ­mite de CrÃ©dito ($)</label>
                                                 <div className="relative">
                                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                        <input
                                                               type="number"
                                                               className="w-full bg-blue-50 border border-blue-100 pl-10 p-4 rounded-xl text-xl font-black text-blue-700 outline-none"
                                                               value={newCustomer.creditLimit}
                                                               onChange={e => setNewCustomer({ ...newCustomer, creditLimit: Number(e.target.value) })}
                                                        />
                                                 </div>
                                                 <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase">Monto mÃ¡ximo que el cliente puede adeudar.</p>
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
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">TelÃ©fono</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold outline-none"
                                                        value={editForm.phone}
                                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                                 />
                                          </div>
                                          <div className="col-span-2">
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">DirecciÃ³n</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold outline-none"
                                                        value={editForm.address}
                                                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                                 />
                                          </div>
                                          <div className="col-span-2">
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">LÃ­mite de CrÃ©dito ($)</label>
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


                      {/* Payment Modal - Enhanced with debt breakdown */}
                      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title={`CARGAR PAGO: ${selectedCustomer?.name || 'Cliente'}`}>
                             <div className="space-y-6">
                                    {Number(selectedCustomer?.closedBalance || 0) > 0 && (
                                           <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                                                  <div className="flex items-center justify-between mb-2">
                                                         <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-700">DEUDA MESES ANTERIORES</p>
                                                         <button onClick={() => selectedCustomer && setPaymentAmount(Number(selectedCustomer.closedBalance).toString())} className="bg-amber-200 hover:bg-amber-300 text-amber-800 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors">Saldar Anterior</button>
                                                  </div>
                                                  <p className="text-2xl font-black text-amber-800">{formatCurrency(selectedCustomer?.closedBalance || 0)}</p>
                                           </div>
                                    )}
                                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                                           <div className="flex items-center justify-between mb-2">
                                                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-red-600">DEUDA MES ACTUAL</p>
                                                  <button onClick={() => selectedCustomer && setPaymentAmount(Number(selectedCustomer.currentBalance).toString())} className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors">Saldar Actual</button>
                                           </div>
                                           <p className="text-2xl font-black text-red-700">{formatCurrency(selectedCustomer?.currentBalance || 0)}</p>
                                    </div>
                                    <div className="bg-gray-900 p-4 rounded-2xl text-center">
                                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">TOTAL A PAGAR</p>
                                           <p className="text-3xl font-black text-white">{formatCurrency((selectedCustomer?.closedBalance || 0) + (selectedCustomer?.currentBalance || 0))}</p>
                                           <button onClick={() => selectedCustomer && setPaymentAmount((Number(selectedCustomer.closedBalance || 0) + Number(selectedCustomer.currentBalance || 0)).toString())} className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 mx-auto"><Wallet className="w-3 h-3" />Saldar Todo</button>
                                    </div>
                                    <div className="space-y-4">
                                           <div>
                                                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Monto a abonar ($)</label>
                                                  <input type="number" className="w-full border-2 border-gray-100 p-6 rounded-2xl font-black text-4xl text-center text-gray-900 outline-none focus:border-emerald-500 transition-all shadow-inner" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" autoFocus />
                                           </div>
                                           <div>
                                                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">MÃ©todo de Pago</label>
                                                  <div className="grid grid-cols-2 gap-3">
                                                         {['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO'].map((method) => (<button key={method} onClick={() => setSelectedPaymentMethod(method)} className={cn("p-3 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all", selectedPaymentMethod === method ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-100 text-gray-400 hover:border-gray-200")}>{method}</button>))}
                                                  </div>
                                           </div>
                                    </div>
                                    <button onClick={handlePayment} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-emerald-100 flex justify-center items-center gap-3 transition-all"><CheckCircle className="h-6 w-6" />CONFIRMAR COBRO</button>
                             </div>
                      </Modal>

                      {/* Payment Receipt Modal */}
                      <Modal isOpen={isReceiptOpen} onClose={() => { setIsReceiptOpen(false); setReceiptData(null); setSelectedCustomer(null); }} title="COMPROBANTE DE PAGO">
                             {receiptData && (<div className="space-y-4">
                                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-2xl space-y-3">
                                           <div className="text-center">
                                                  <p className="text-xl font-black text-gray-900 uppercase tracking-wide">COMPROBANTE DE PAGO</p>
                                                  <p className="text-xs text-gray-500 mt-1">{new Date(receiptData.timestamp).toLocaleString("es-AR")}</p>
                                           </div>
                                           <div className="border-t border-dashed border-gray-300 pt-3">
                                                  <div className="flex justify-between text-sm"><span className="font-bold text-gray-600">Cliente:</span><span className="font-black text-gray-900">{receiptData.customerName}</span></div>
                                                  {receiptData.customerDni && (<div className="flex justify-between text-xs text-gray-500"><span>DNI:</span><span>{receiptData.customerDni}</span></div>)}
                                           </div>
                                           <div className="border-t border-dashed border-gray-300 pt-3 space-y-1">
                                                  <div className="flex justify-between text-xs text-gray-500"><span>Deuda anterior:</span><span>{formatCurrency(receiptData.previousClosedBalance)}</span></div>
                                                  <div className="flex justify-between text-xs text-gray-500"><span>Deuda mes actual:</span><span>{formatCurrency(receiptData.previousCurrentBalance)}</span></div>
                                                  <div className="flex justify-between text-sm font-bold text-gray-700 pt-1"><span>Total adeudado:</span><span>{formatCurrency(receiptData.previousClosedBalance + receiptData.previousCurrentBalance)}</span></div>
                                           </div>
                                           <div className="bg-emerald-100 p-4 rounded-xl text-center border border-emerald-200">
                                                  <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Monto Abonado</p>
                                                  <p className="text-3xl font-black text-emerald-700">{formatCurrency(receiptData.paidAmount)}</p>
                                                  <p className="text-xs text-emerald-600 mt-1 uppercase font-bold">{receiptData.paymentMethod}</p>
                                           </div>
                                           {(receiptData.deductedFromClosed > 0 || receiptData.deductedFromCurrent > 0) && (<div className="space-y-1 text-xs text-gray-500">
                                                  {receiptData.deductedFromClosed > 0 && (<div className="flex justify-between"><span>â†’ Aplicado a deuda anterior:</span><span className="text-emerald-600 font-bold">-{formatCurrency(receiptData.deductedFromClosed)}</span></div>)}
                                                  {receiptData.deductedFromCurrent > 0 && (<div className="flex justify-between"><span>â†’ Aplicado a deuda actual:</span><span className="text-emerald-600 font-bold">-{formatCurrency(receiptData.deductedFromCurrent)}</span></div>)}
                                           </div>)}
                                           <div className="border-t-2 border-gray-300 pt-3 text-center">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Saldo Restante</p>
                                                  <p className={cn("text-2xl font-black", (receiptData.remainingClosedBalance + receiptData.remainingCurrentBalance) > 0 ? "text-red-600" : "text-emerald-600")}>{formatCurrency(receiptData.remainingClosedBalance + receiptData.remainingCurrentBalance)}</p>
                                                  <div className="flex justify-center gap-4 text-[10px] text-gray-400 mt-1"><span>Anterior: {formatCurrency(receiptData.remainingClosedBalance)}</span><span>Actual: {formatCurrency(receiptData.remainingCurrentBalance)}</span></div>
                                           </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                           <button onClick={printPaymentReceipt} className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all"><Printer className="h-5 w-5" />IMPRIMIR</button>
                                           <button onClick={() => { setIsReceiptOpen(false); setReceiptData(null); setSelectedCustomer(null); }} className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all">CERRAR</button>
                                    </div>
                             </div>)}
                      </Modal>

                      {/* Month-by-Month History Modal */}
                      <Modal isOpen={isMonthHistoryOpen} onClose={() => setIsMonthHistoryOpen(false)} title={`BOLETAS POR MES: ${selectedCustomer?.name || ''}`} className="sm:max-w-3xl">
                             <div className="space-y-4">
                                    <p className="text-xs text-gray-500 font-medium">Cada mes tiene su propio PDF separado. DescargÃ¡ el que necesites para enviarle al cliente.</p>
                                    {monthGroups.length === 0 ? (<div className="py-12 text-center text-gray-400 font-bold uppercase text-xs">Sin movimientos registrados</div>) : monthGroups.map((mg: any) => (
                                           <div key={mg.monthKey} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                                  <button onClick={() => setExpandedMonth(expandedMonth === mg.monthKey ? null : mg.monthKey)} className={cn("w-full flex items-center justify-between p-4 transition-colors text-left", mg.isCurrent ? "bg-blue-50 hover:bg-blue-100" : "bg-gray-50 hover:bg-gray-100")}>
                                                         <div className="flex items-center gap-3">
                                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", mg.isCurrent ? "bg-blue-500 text-white" : "bg-gray-300 text-white")}><FileText className="h-5 w-5" /></div>
                                                                <div><p className="font-black text-gray-900 uppercase tracking-wide text-sm">{mg.label}</p><p className="text-[10px] text-gray-500 font-bold">{mg.movements.length} movimiento{mg.movements.length !== 1 ? 's' : ''}</p></div>
                                                         </div>
                                                         <div className="flex items-center gap-3">
                                                                <span className={cn("text-lg font-black", mg.total > 0 ? "text-red-600" : mg.total < 0 ? "text-emerald-600" : "text-gray-400")}>{formatCurrency(mg.total)}</span>
                                                                {expandedMonth === mg.monthKey ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                                         </div>
                                                  </button>
                                                  {expandedMonth === mg.monthKey && (<div className="border-t border-gray-200">
                                                         <div className="flex gap-2 p-3 bg-white border-b border-gray-100">
                                                                <button onClick={() => downloadMonthPDF(mg)} className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"><Download className="h-4 w-4" /> PDF</button>
                                                                <button onClick={() => downloadMonthJPG(mg)} className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"><Download className="h-4 w-4" /> JPG</button>
                                                         </div>
                                                         <div className="max-h-64 overflow-y-auto">
                                                                <table className="w-full text-xs">
                                                                       <thead className="bg-gray-50 sticky top-0"><tr><th className="p-2 text-left text-[9px] uppercase text-gray-400 font-black">Fecha</th><th className="p-2 text-left text-[9px] uppercase text-gray-400 font-black">Concepto</th><th className="p-2 text-right text-[9px] uppercase text-gray-400 font-black">Monto</th></tr></thead>
                                                                       <tbody className="divide-y divide-gray-50">
                                                                              {mg.movements.length === 0 ? (<tr><td colSpan={3} className="p-6 text-center text-gray-400">Sin movimientos</td></tr>) : mg.movements.map((mov: any) => (
                                                                                     <tr key={mov.id} className="hover:bg-gray-50">
                                                                                            <td className="p-2 font-bold text-gray-700">{formatDate(mov.timestamp)}</td>
                                                                                            <td className="p-2 text-gray-600 uppercase text-[10px]">{mov.description}</td>
                                                                                            <td className={cn("p-2 text-right font-black", mov.amount > 0 ? "text-red-500" : "text-emerald-500")}>{mov.amount > 0 ? '+' : ''}{formatCurrency(mov.amount)}</td>
                                                                                     </tr>
                                                                              ))}
                                                                       </tbody>
                                                                </table>
                                                         </div>
                                                  </div>)}
                                           </div>
                                    ))}
                                    <div className="pt-4 border-t border-gray-100 flex justify-end"><button onClick={() => setIsMonthHistoryOpen(false)} className="px-8 py-3 bg-gray-900 text-white font-black rounded-xl hover:bg-gray-800 uppercase text-xs tracking-widest">Cerrar</button></div>
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
