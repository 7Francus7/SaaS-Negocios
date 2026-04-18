export type EntryType = "INGRESO" | "EGRESO";
export type EntryCategory =
  | "VENTA"
  | "INGRESO_EXTRA"
  | "COMPRA"
  | "GASTO"
  | "PROVEEDOR"
  | "SUELDO"
  | "OTRO";
export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "OTRO";

export const CATEGORY_LABELS: Record<string, string> = {
  VENTA: "Ingreso por Ventas",
  INGRESO_EXTRA: "Ingreso Extra",
  COMPRA: "Egreso Compra",
  GASTO: "Egreso Gasto",
  PROVEEDOR: "Egreso Proveedor",
  SUELDO: "Egreso Sueldo",
  OTRO: "Otro",
};

export const METHOD_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  OTRO: "Otro",
};

export const INGRESO_CATEGORIES: EntryCategory[] = ["VENTA", "INGRESO_EXTRA"];
export const EGRESO_CATEGORIES: EntryCategory[] = [
  "COMPRA",
  "GASTO",
  "PROVEEDOR",
  "SUELDO",
  "OTRO",
];
