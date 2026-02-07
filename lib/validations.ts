import { z } from "zod";

// --- Products ---
export const productSchema = z.object({
       name: z.string().min(2, "El nombre del producto debe tener al menos 2 caracteres."),
       description: z.string().optional(),
       categoryId: z.number().optional(),
       variantName: z.string().min(1, "El nombre de la variante es obligatorio (ej: Unico, 500g, etc)."),
       barcode: z.string().optional().or(z.literal('')),
       costPrice: z.number().min(0, "El costo no puede ser negativo."),
       salePrice: z.number().min(0, "El precio de venta no puede ser negativo."),
       stock: z.number().int("El stock debe ser un número entero."),
       minStock: z.number().int().min(0).optional(),
});

export const updateVariantSchema = z.object({
       variantName: z.string().min(1).optional(),
       barcode: z.string().optional(),
       costPrice: z.number().min(0).optional(),
       salePrice: z.number().min(0).optional(),
       stock: z.number().int().optional(),
       minStock: z.number().int().min(0).optional(),
});

// --- Sales ---
export const saleItemSchema = z.object({
       variantId: z.number().int().positive(),
       quantity: z.number().int().positive("La cantidad debe ser mayor a 0."),
});

export const saleSchema = z.object({
       items: z.array(saleItemSchema).min(1, "El carrito no puede estar vacío."),
       paymentMethod: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA", "CTA_CTE"]),
       customerId: z.number().int().optional(),
       discountAmount: z.number().min(0).optional(),
});

// --- Customers ---
export const customerSchema = z.object({
       name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
       dni: z.string().optional(),
       phone: z.string().optional(),
       address: z.string().optional(),
       creditLimit: z.number().min(0).optional(),
});
