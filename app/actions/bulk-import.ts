"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";

export type ImportProductRow = {
       name: string;
       category?: string;
       variantName?: string;
       barcode?: string;
       costPrice: number;
       salePrice: number;
       stock: number;
       minStock?: number;
};

export type ImportResult = {
       success: number;
       errors: string[];
};

export async function bulkImportProducts(rows: ImportProductRow[]): Promise<ImportResult> {
       const storeId = await getStoreId();
       let successCount = 0;
       const errors: string[] = [];

       // We'll process sequentially to avoid overwhelming the DB and handling logic simpler
       // In a real huge import, we might use createMany or transactions in chunks.
       for (const [index, row] of rows.entries()) {
              try {
                     if (!row.name || row.costPrice < 0 || row.salePrice < 0) {
                            throw new Error(`Fila ${index + 1}: Datos inválidos (Nombre vacío o precios negativos).`);
                     }

                     await prisma.$transaction(async (tx) => {
                            // 1. Find or Create Category
                            let categoryId: number | null = null;
                            if (row.category) {
                                   // Check if exists
                                   const existingCat = await tx.category.findUnique({
                                          where: { storeId_name: { storeId, name: row.category } }
                                   });

                                   if (existingCat) {
                                          categoryId = existingCat.id;
                                   } else {
                                          const newCat = await tx.category.create({
                                                 data: { storeId, name: row.category }
                                          });
                                          categoryId = newCat.id;
                                   }
                            }

                            // 2. Create Product Parent (or find if we want to support grouping by name, but for simplicity we create one per row if unique)
                            // Let's assume for this MVP each row is a strict new entry unless we find a smart way to match.
                            // Better strategy: Create Product -> Create Variant.

                            const product = await tx.product.create({
                                   data: {
                                          storeId,
                                          name: row.name,
                                          categoryId,
                                          active: true
                                   }
                            });

                            // 3. Create Variant
                            const variant = await tx.productVariant.create({
                                   data: {
                                          storeId,
                                          productId: product.id,
                                          variantName: row.variantName || "Unidad",
                                          barcode: row.barcode || null,
                                          costPrice: row.costPrice,
                                          salePrice: row.salePrice,
                                          stockQuantity: row.stock,
                                          minStock: row.minStock || 5,
                                          active: true,
                                   }
                            });

                            // 4. Initial Stock Movement
                            if (row.stock > 0) {
                                   await tx.stockMovement.create({
                                          data: {
                                                 variantId: variant.id,
                                                 movementType: "ADJUSTMENT",
                                                 quantity: row.stock,
                                                 reason: "Importación Masiva",
                                                 balanceSnapshot: row.stock
                                          }
                                   });
                            }
                     });

                     successCount++;
              } catch (error: any) {
                     console.error(error);
                     errors.push(error.message || `Error en fila ${index + 1}`);
              }
       }

       return { success: successCount, errors };
}
