"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { Prisma } from "@prisma/client";

export type ProductFilter = {
       searchQuery?: string;
       categoryId?: number;
       activeOnly?: boolean;
};

export async function getProducts(filter: ProductFilter = {}) {
       const storeId = await getStoreId();
       const { searchQuery, categoryId, activeOnly = true } = filter;

       const where: Prisma.ProductVariantWhereInput = {
              storeId: storeId,
              ...(activeOnly ? { active: true } : {}),
              ...(categoryId
                     ? { product: { categoryId: Number(categoryId) } }
                     : {}),
              ...(searchQuery
                     ? {
                            OR: [
                                   { product: { name: { contains: searchQuery } } }, // PostgreSQL: mode: 'insensitive' (SQLite doesn't support it natively in Prisma yet easily)
                                   { variantName: { contains: searchQuery } },
                                   { barcode: { contains: searchQuery } },
                            ],
                     }
                     : {}),
       };

       const variants = await prisma.productVariant.findMany({
              where,
              include: {
                     product: {
                            include: {
                                   category: true,
                            },
                     },
              },
              orderBy: [
                     { product: { name: "asc" } },
                     { variantName: "asc" },
              ],
       });

       const serializedVariants = variants.map(v => ({
              ...v,
              costPrice: Number(v.costPrice),
              salePrice: Number(v.salePrice),
              product: {
                     ...v.product,
                     description: v.product.description || "" // Handle null description if needed, though optional string is fine
              }
       }));

       return serializedVariants;
}

export async function findProductByBarcode(barcode: string) {
       const storeId = await getStoreId();

       if (!barcode) return null;

       const variant = await prisma.productVariant.findFirst({
              where: {
                     storeId,
                     barcode: barcode,
                     active: true
              },
              include: {
                     product: true
              }
       });

       if (!variant) return null;

       return {
              ...variant,
              costPrice: Number(variant.costPrice),
              salePrice: Number(variant.salePrice),
              stockQuantity: variant.stockQuantity,
              product: variant.product
       };
}

export async function createProduct(data: {
       name: string;
       description?: string;
       categoryId?: number;
       variantName: string;
       barcode?: string;
       costPrice: number;
       salePrice: number;
       stock: number;
       minStock?: number;
}) {
       const storeId = await getStoreId();

       // Validate inputs
       if (data.costPrice < 0 || data.salePrice < 0) {
              throw new Error("El costo y el precio no pueden ser negativos.");
       }

       // Check barcode uniqueness
       if (data.barcode) {
              const existing = await prisma.productVariant.findFirst({
                     where: {
                            storeId,
                            barcode: data.barcode,
                            active: true,
                     },
              });
              if (existing) {
                     throw new Error(`El código '${data.barcode}' ya está en uso.`);
              }
       }

       // Transaction: Create Product -> Variant -> StockMovement
       return await prisma.$transaction(async (tx) => {
              const product = await tx.product.create({
                     data: {
                            name: data.name,
                            description: data.description,
                            categoryId: data.categoryId,
                            storeId,
                            active: true,
                     },
              });

              const variant = await tx.productVariant.create({
                     data: {
                            productId: product.id,
                            variantName: data.variantName,
                            barcode: data.barcode || null,
                            costPrice: data.costPrice,
                            salePrice: data.salePrice,
                            stockQuantity: data.stock,
                            minStock: data.minStock ?? 5,
                            storeId,
                            active: true,
                     },
              });

              if (data.stock !== 0) {
                     await tx.stockMovement.create({
                            data: {
                                   variantId: variant.id,
                                   movementType: "ADJUSTMENT",
                                   quantity: data.stock,
                                   reason: "Stock Inicial",
                                   balanceSnapshot: data.stock,
                                   timestamp: new Date(),
                            },
                     });
              }

              return variant;
       });
}

export async function updateVariant(
       variantId: number,
       data: Partial<{
              variantName: string;
              barcode: string;
              costPrice: number;
              salePrice: number;
              minStock: number;
       }>
) {
       const storeId = await getStoreId();

       // Validate access
       const variant = await prisma.productVariant.findUnique({
              where: { id: variantId },
       });

       if (!variant || variant.storeId !== storeId) {
              throw new Error("Variante no encontrada o sin acceso.");
       }

       if (data.barcode && data.barcode !== variant.barcode) {
              const existing = await prisma.productVariant.findFirst({
                     where: {
                            storeId,
                            barcode: data.barcode,
                            NOT: { id: variantId },
                            active: true,
                     },
              });
              if (existing) {
                     throw new Error(`El código '${data.barcode}' ya está en uso.`);
              }
       }

       return await prisma.productVariant.update({
              where: { id: variantId },
              data
       });
}

export async function adjustStock(
       variantId: number,
       delta: number,
       reason: string = "MANUAL"
) {
       const storeId = await getStoreId();

       // Validate
       const variant = await prisma.productVariant.findUnique({
              where: { id: variantId }
       });
       if (!variant || variant.storeId !== storeId) {
              throw new Error("Variante no encontrada.");
       }

       const newStock = variant.stockQuantity + delta;

       // Determine Type
       let type = "ADJUSTMENT";
       if (delta > 0) {
              if (reason === "COMPRA") type = "BUY";
       } else if (delta < 0) {
              if (["MERMA", "ROBO", "VENCIMIENTO"].includes(reason)) type = "LOSS";
              else if (reason === "VENTA") type = "SALE";
       }

       return await prisma.$transaction([
              prisma.productVariant.update({
                     where: { id: variantId },
                     data: { stockQuantity: newStock }
              }),
              prisma.stockMovement.create({
                     data: {
                            variantId: variantId,
                            movementType: type,
                            quantity: delta,
                            reason: reason,
                            balanceSnapshot: newStock,
                            timestamp: new Date()
                     }
              })
       ]);
}

export async function getCategories() {
       const storeId = await getStoreId();
       return await prisma.category.findMany({
              where: { storeId },
              orderBy: { name: 'asc' }
       });
}
