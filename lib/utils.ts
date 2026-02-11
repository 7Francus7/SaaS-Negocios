import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for Tailwind CSS class merging.
 */
export function cn(...inputs: ClassValue[]) {
       return twMerge(clsx(inputs));
}

/**
 * Utility to safe-serialize Prisma objects for Next.js Server Actions.
 * Handles Decimals (converts to Number) and ensures plain JS objects.
 */
export function safeSerialize<T>(data: T): T {
       if (data === null || data === undefined) return data;

       return JSON.parse(JSON.stringify(data, (key, value) => {
              // Handle Prisma Decimal objects
              if (value && typeof value === 'object' && (value.constructor?.name === 'Decimal' || (value.d && value.e && value.s))) {
                     return Number(value);
              }
              // Handle other possible non-serializable objects (like potential BigInts)
              if (typeof value === 'bigint') {
                     return value.toString();
              }
              return value;
       })) as T;
}

/**
 * Formato de moneda para Argentina (ARS)
 * Maneja null, undefined, strings vacíos y errores de conversión de forma segura.
 */
export function formatCurrency(amount: number | string | null | undefined): string {
       if (amount === null || amount === undefined || amount === "") {
              return "$ 0,00";
       }

       const value = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount;

       if (isNaN(value)) {
              return "$ 0,00";
       }

       return new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
       }).format(value);
}

/**
 * Formato de fecha para Argentina (DD/MM/YYYY)
 */
export function formatDate(date: Date | string | number): string {
       const d = new Date(date);
       return new Intl.DateTimeFormat('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
       }).format(d);
}

/**
 * Formato de hora para Argentina (HH:mm)
 */
export function formatTime(date: Date | string | number): string {
       const d = new Date(date);
       return new Intl.DateTimeFormat('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
       }).format(d);
}

/**
 * Formato completo (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(date: Date | string | number): string {
       return `${formatDate(date)} ${formatTime(date)}`;
}
