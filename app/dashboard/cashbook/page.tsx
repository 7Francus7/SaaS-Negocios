"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Plus,
  Download,
  Pencil,
  Trash2,
  Filter,
  X,
  BookOpen,
  Lock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getCashBookEntries,
  createCashBookEntry,
  updateCashBookEntry,
  deleteCashBookEntry,
  getDashboardStats,
  getMonthlyChartData,
  getBalanceBefore,
  type GetEntriesFilter,
} from "@/app/actions/cashbook";
import {
  CATEGORY_LABELS,
  METHOD_LABELS,
  INGRESO_CATEGORIES,
  EGRESO_CATEGORIES,
  type EntryType,
  type EntryCategory,
  type PaymentMethod,
} from "@/lib/cashbook-constants";

type Entry = {
  id: number;
  date: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  method: string;
  reference: string | null;
};

type Stats = {
  ingresosHoy: number;
  egresosHoy: number;
  balanceDia: number;
  ingresosMes: number;
  egresosMes: number;
  balanceTotal: number;
};

const todayStr = () => new Date().toISOString().split("T")[0];

const defaultForm = () => ({
  date: todayStr(),
  type: "INGRESO" as EntryType,
  category: "VENTA" as EntryCategory,
  amount: "",
  description: "",
  method: "EFECTIVO" as PaymentMethod,
  reference: "",
});

export default function CashbookPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [balanceBefore, setBalanceBefore] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<{ month: string; ingresos: number; egresos: number }[]>([]);
  const [chartYear, setChartYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadStats = useCallback(async () => {
    const s = await getDashboardStats();
    setStats(s);
  }, []);

  const loadChart = useCallback(async (year: number) => {
    const data = await getMonthlyChartData(year);
    setChartData(data);
  }, []);

  const loadEntries = useCallback(async (filter: GetEntriesFilter = {}) => {
    setLoadingEntries(true);
    try {
      const [data, before] = await Promise.all([
        getCashBookEntries(filter),
        getBalanceBefore(filter.dateFrom),
      ]);
      setEntries(data as Entry[]);
      setBalanceBefore(before);
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadStats(), loadChart(chartYear), loadEntries()]);
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    loadChart(chartYear);
  }, [chartYear]);

  // Compute running balance map (entry id → balance after that entry)
  const runningBalances = (() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let bal = balanceBefore;
    const map = new Map<number, number>();
    sorted.forEach((e) => {
      bal += e.type === "INGRESO" ? Number(e.amount) : -Number(e.amount);
      map.set(e.id, bal);
    });
    return map;
  })();

  const applyFilters = () => {
    loadEntries({
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
      type: filterType || undefined,
      category: filterCategory || undefined,
    });
  };

  const clearFilters = () => {
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterType("");
    setFilterCategory("");
    loadEntries();
  };

  const openCreate = () => {
    setEditEntry(null);
    setForm(defaultForm());
    setModalOpen(true);
  };

  const openEdit = (entry: Entry) => {
    setEditEntry(entry);
    setForm({
      date: entry.date.split("T")[0],
      type: entry.type as EntryType,
      category: entry.category as EntryCategory,
      amount: String(entry.amount),
      description: entry.description || "",
      method: entry.method as PaymentMethod,
      reference: entry.reference || "",
    });
    setModalOpen(true);
  };

  const handleTypeChange = (type: EntryType) => {
    const cats = type === "INGRESO" ? INGRESO_CATEGORIES : EGRESO_CATEGORIES;
    setForm((f) => ({ ...f, type, category: cats[0] }));
  };

  const refreshAll = async (filter: GetEntriesFilter = {}) => {
    await Promise.all([
      loadStats(),
      loadChart(chartYear),
      loadEntries(filter),
    ]);
  };

  const currentFilter: GetEntriesFilter = {
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
    type: filterType || undefined,
    category: filterCategory || undefined,
  };

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    setSaving(true);
    try {
      const data = {
        date: form.date,
        type: form.type,
        category: form.category,
        amount: Number(form.amount),
        description: form.description || undefined,
        method: form.method,
        reference: form.reference || undefined,
      };
      if (editEntry) {
        await updateCashBookEntry(editEntry.id, data);
      } else {
        await createCashBookEntry(data);
      }
      setModalOpen(false);
      await refreshAll(currentFilter);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteCashBookEntry(deleteId);
      setDeleteId(null);
      await refreshAll(currentFilter);
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    if (!entries.length) return;
    const header = "Fecha,Tipo,Categoría,Descripción,Método,Monto,Saldo\n";
    const sortedAsc = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const rows = sortedAsc
      .map(
        (e) =>
          `${formatDate(e.date)},${e.type},"${CATEGORY_LABELS[e.category] || e.category}","${e.description || ""}",${METHOD_LABELS[e.method] || e.method},${e.amount},${runningBalances.get(e.id) ?? ""}`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CajaFuerte_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const availableCategories =
    form.type === "INGRESO" ? INGRESO_CATEGORIES : EGRESO_CATEGORIES;

  const hasFilters =
    filterDateFrom || filterDateTo || filterType || filterCategory;

  const saldoCajaFuerte = stats?.balanceTotal ?? 0;

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 animate-pulse">
        Cargando Contabilidad...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl">
            <BookOpen className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Contabilidad
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Control de ingresos y egresos — Caja Fuerte
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 transition-colors text-sm border border-green-200"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Agregar Movimiento
          </button>
        </div>
      </div>

      {/* HERO — Saldo Caja Fuerte */}
      <div
        className={`rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border ${
          saldoCajaFuerte >= 0
            ? "bg-emerald-600 border-emerald-500"
            : "bg-red-500 border-red-400"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-emerald-100 text-sm font-bold uppercase tracking-wider">
              Saldo Caja Fuerte
            </p>
            <p className="text-white text-4xl font-black tracking-tight mt-0.5">
              {formatCurrency(saldoCajaFuerte)}
            </p>
            <p className="text-white/70 text-xs font-medium mt-1">
              Este es el dinero que debería haber en tu caja fuerte ahora mismo
            </p>
          </div>
        </div>
        <div className="flex gap-6 sm:text-right">
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">
              Ingresos hoy
            </p>
            <p className="text-white font-black text-lg">
              {formatCurrency(stats?.ingresosHoy ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">
              Egresos hoy
            </p>
            <p className="text-white font-black text-lg">
              {formatCurrency(stats?.egresosHoy ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Balance Hoy
            </p>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p
            className={`text-2xl font-black ${(stats?.balanceDia ?? 0) >= 0 ? "text-blue-600" : "text-red-600"}`}
          >
            {formatCurrency(stats?.balanceDia ?? 0)}
          </p>
          <p className="text-xs text-gray-400 font-medium mt-1">Neto del día</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Ingresos Mes
            </p>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {formatCurrency(stats?.ingresosMes ?? 0)}
          </p>
          <p className="text-xs text-gray-400 font-medium mt-1">Mes actual</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Egresos Mes
            </p>
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-500">
            {formatCurrency(stats?.egresosMes ?? 0)}
          </p>
          <p className="text-xs text-gray-400 font-medium mt-1">Mes actual</p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="font-bold text-gray-900">
              Ingresos vs Egresos Mensual
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartYear((y) => y - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50"
            >
              ‹ {chartYear - 1}
            </button>
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 font-black text-sm rounded-lg">
              {chartYear}
            </span>
            <button
              onClick={() => setChartYear((y) => y + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50"
            >
              {chartYear + 1} ›
            </button>
          </div>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={18} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f3f4f6"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: number | undefined, name: string | undefined) => [
                  formatCurrency(value ?? 0),
                  (name ?? "") === "ingresos" ? "Ingresos" : "Egresos",
                ]}
              />
              <Legend
                formatter={(value) =>
                  value === "ingresos" ? "Ingresos" : "Egresos"
                }
              />
              <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Filter bar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Filtros
              </span>
            </div>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setFilterCategory("");
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="INGRESO">Ingresos</option>
              <option value="EGRESO">Egresos</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {(filterType === "EGRESO"
                ? EGRESO_CATEGORIES
                : filterType === "INGRESO"
                  ? INGRESO_CATEGORIES
                  : [...INGRESO_CATEGORIES, ...EGRESO_CATEGORIES]
              ).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loadingEntries ? (
            <div className="p-8 text-center text-gray-400 animate-pulse">
              Cargando movimientos...
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">
                No hay movimientos registrados
              </p>
              <button
                onClick={openCreate}
                className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors"
              >
                Agregar el primero
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 hidden md:table-cell">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 hidden sm:table-cell">
                    Método
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Saldo Caja
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                    Acc.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((entry) => {
                  const saldo = runningBalances.get(entry.id) ?? 0;
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium whitespace-nowrap">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            entry.type === "INGRESO"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {entry.type === "INGRESO" ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {CATEGORY_LABELS[entry.category] || entry.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell max-w-[180px] truncate">
                        {entry.description || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-bold text-gray-600">
                          {METHOD_LABELS[entry.method] || entry.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-sm font-black ${
                            entry.type === "INGRESO"
                              ? "text-emerald-600"
                              : "text-red-500"
                          }`}
                        >
                          {entry.type === "EGRESO" ? "- " : "+ "}
                          {formatCurrency(entry.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-sm font-black ${saldo >= 0 ? "text-gray-800" : "text-red-600"}`}
                        >
                          {formatCurrency(saldo)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(entry)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(entry.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-100 bg-gray-50/50">
                  <td
                    colSpan={5}
                    className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    {entries.length} movimientos
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(() => {
                      const ing = entries
                        .filter((e) => e.type === "INGRESO")
                        .reduce((s, e) => s + Number(e.amount), 0);
                      const egr = entries
                        .filter((e) => e.type === "EGRESO")
                        .reduce((s, e) => s + Number(e.amount), 0);
                      const net = ing - egr;
                      return (
                        <span
                          className={`text-sm font-black ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {formatCurrency(net)}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-black text-gray-700">
                      {formatCurrency(
                        entries.length > 0
                          ? (runningBalances.get(entries[0].id) ?? saldoCajaFuerte)
                          : saldoCajaFuerte
                      )}
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editEntry ? "Editar Movimiento" : "Nuevo Movimiento"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
              Fecha
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["INGRESO", "EGRESO"] as EntryType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                    form.type === t
                      ? t === "INGRESO"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "bg-red-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t === "INGRESO" ? "↑ Ingreso" : "↓ Egreso"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
              Categoría
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: e.target.value as EntryCategory,
                }))
              }
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
              Monto
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
              Método de Pago
            </label>
            <select
              value={form.method}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  method: e.target.value as PaymentMethod,
                }))
              }
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(
                ["EFECTIVO", "TRANSFERENCIA", "TARJETA", "OTRO"] as PaymentMethod[]
              ).map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
              Descripción{" "}
              <span className="text-gray-400 normal-case font-medium">
                (opcional)
              </span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Ej: Pago a proveedor Juan..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
              Referencia{" "}
              <span className="text-gray-400 normal-case font-medium">
                (opcional)
              </span>
            </label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) =>
                setForm((f) => ({ ...f, reference: e.target.value }))
              }
              placeholder="Ej: Factura #001, Compra #5..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.amount || Number(form.amount) <= 0}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "Guardando..."
                : editEntry
                  ? "Guardar Cambios"
                  : "Agregar Movimiento"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirmar Eliminación"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Eliminar este movimiento? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
