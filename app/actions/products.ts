"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { Prisma } from "@prisma/client";
import { productSchema, updateVariantSchema } from "@/lib/validations";

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
                                   { product: { name: { contains: searchQuery, mode: 'insensitive' } } },
                                   { variantName: { contains: searchQuery, mode: 'insensitive' } },
                                   { barcode: { contains: searchQuery, mode: 'insensitive' } },
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
                     barcodes: true,
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
              barcodes: v.barcodes.map(b => b.barcode),
              product: {
                     ...v.product,
                     description: v.product.description || ""
              }
       }));

       return serializedVariants;
}

export async function findProductByBarcode(barcode: string) {
       const storeId = await getStoreId();

       if (!barcode) return null;

       // Search in variant primary barcode
       let variant = await prisma.productVariant.findFirst({
              where: {
                     storeId,
                     barcode: barcode,
                     active: true
              },
              include: {
                     product: true,
                     barcodes: true,
              }
       });

       // Search in additional barcodes
       if (!variant) {
              const barcodeEntry = await prisma.productBarcode.findFirst({
                     where: {
                            storeId,
                            barcode: barcode,
                     },
                     include: {
                            variant: {
                                   include: {
                                          product: true,
                                          barcodes: true,
                                   }
                            }
                     }
              });

              if (barcodeEntry && barcodeEntry.variant.active) {
                     variant = barcodeEntry.variant;
              }
       }

       if (!variant) return null;

       return {
              ...variant,
              costPrice: Number(variant.costPrice),
              salePrice: Number(variant.salePrice),
              stockQuantity: variant.stockQuantity,
              isWeighable: variant.isWeighable,
              product: variant.product,
              barcodes: variant.barcodes.map(b => b.barcode)
       };
}

export async function createProduct(data: {
       name: string;
       description?: string;
       categoryId?: number;
       variantName: string;
       barcode?: string;
       barcodes?: string[];
       costPrice: number;
       salePrice: number;
       stock: number;
       minStock?: number;
       isWeighable?: boolean;
}) {
       try {
              // Validate Zod
              const parsed = productSchema.parse(data);

              const storeId = await getStoreId();

              // Check barcode uniqueness (including inactive ones to avoid DB constraint failure)
              if (parsed.barcode) {
                     const existing = await prisma.productVariant.findFirst({
                            where: {
                                   storeId,
                                   barcode: parsed.barcode,
                            },
                     });
                     if (existing) {
                            return { error: `El código '${parsed.barcode}' ya está en uso (puede estar en un producto eliminado).` };
                     }
              }

              // Transaction: Create Product -> Variant -> StockMovement
              const variant = await prisma.$transaction(async (tx) => {
                     const product = await tx.product.create({
                            data: {
                                   name: parsed.name,
                                   description: parsed.description,
                                   categoryId: parsed.categoryId,
                                   storeId,
                                   active: true,
                            },
                     });

                     const variant = await tx.productVariant.create({
                            data: {
                                   productId: product.id,
                                   variantName: parsed.variantName,
                                   barcode: parsed.barcode || null,
                                   costPrice: parsed.costPrice,
                                   salePrice: parsed.salePrice,
                                   stockQuantity: parsed.stock,
                                   minStock: parsed.minStock ?? 5,
                                   isWeighable: parsed.isWeighable ?? false,
                                   storeId,
                                   active: true,
                                   barcodes: parsed.barcodes ? {
                                          create: parsed.barcodes.map(b => ({
                                                 barcode: b,
                                                 storeId,
                                          }))
                                   } : undefined,
                            },
                     });

                     if (parsed.stock !== 0) {
                            await tx.stockMovement.create({
                                   data: {
                                          variantId: variant.id,
                                          movementType: "ADJUSTMENT",
                                          quantity: parsed.stock,
                                          reason: "Stock Inicial",
                                          balanceSnapshot: parsed.stock,
                                          timestamp: new Date(),
                                   },
                            });
                     }

                     return variant;
              });

              return {
                     success: true,
                     data: {
                            ...variant,
                            costPrice: Number(variant.costPrice),
                            salePrice: Number(variant.salePrice),
                     }
              };
       } catch (error: any) {
              console.error("Error creating product:", error);
              return { error: error.message || "Error al crear el producto" };
       }
}

export async function updateVariant(
       variantId: number,
       data: Partial<{
              variantName: string;
              barcode: string;
              barcodes: string[];
              costPrice: number;
              salePrice: number;
              minStock: number;
              isWeighable: boolean;
       }>
) {
       const storeId = await getStoreId();

       const parsed = updateVariantSchema.parse(data);

       // Validate access
       const variant = await prisma.productVariant.findUnique({
              where: { id: variantId },
       });

       if (!variant || variant.storeId !== storeId) {
              throw new Error("Variante no encontrada o sin acceso.");
       }

       if (parsed.barcode && parsed.barcode !== variant.barcode) {
              const existing = await prisma.productVariant.findFirst({
                     where: {
                            storeId,
                            barcode: parsed.barcode,
                            NOT: { id: variantId },
                     },
              });
              if (existing) {
                     throw new Error(`El código '${parsed.barcode}' ya está en uso.`);
              }
       }

        const { barcodes, ...rest } = parsed;

        const updated = await prisma.productVariant.update({
               where: { id: variantId },
               data: {
                      ...rest,
                      barcodes: barcodes ? {
                             deleteMany: {},
                             create: barcodes.map(bc => ({
                                    barcode: bc,
                                    storeId
                             }))
                      } : undefined
               }
        });


       return {
              ...updated,
              costPrice: Number(updated.costPrice),
              salePrice: Number(updated.salePrice),
       };
}

// --- NEW: Bulk Update Prices ---
export async function bulkUpdatePrices(data: {
       categoryId?: number | null; // null if all categories, undefined if ignoring
       percentage: number;
}) {
       const storeId = await getStoreId();

       const whereClause: Prisma.ProductVariantWhereInput = {
              storeId,
              active: true,
              ...(data.categoryId
                     ? { product: { categoryId: data.categoryId } }
                     : data.categoryId === null
                            ? { product: { categoryId: null } }
                            : {})
       };

       const variants = await prisma.productVariant.findMany({ where: whereClause });

       // Using a simple loop and transaction to update each variant based on its old salePrice
       const updates = variants.map(variant => {
              const oldPrice = Number(variant.salePrice);
              const newPrice = Number((oldPrice + (oldPrice * data.percentage) / 100).toFixed(2));
              return prisma.productVariant.update({
                     where: { id: variant.id },
                     data: { salePrice: newPrice }
              });
       });

       const results = await prisma.$transaction(updates);

       return results.map(v => ({
              ...v,
              costPrice: Number(v.costPrice),
              salePrice: Number(v.salePrice),
       }));
}

export async function adjustStock(
       variantId: number,
       delta: number,
       reason: string = "MANUAL",
       purchaseCostPerUnit?: number,
       purchasePaymentMethod: string = "EFECTIVO"
) {
       const storeId = await getStoreId();

       const variant = await prisma.productVariant.findUnique({
              where: { id: variantId },
              include: { product: true },
       });
       if (!variant || variant.storeId !== storeId) {
              throw new Error("Variante no encontrada.");
       }

       const newStock = variant.stockQuantity + delta;

       let type = "ADJUSTMENT";
       if (delta > 0) {
              if (reason === "COMPRA") type = "BUY";
       } else if (delta < 0) {
              if (["MERMA", "ROBO", "VENCIMIENTO"].includes(reason)) type = "LOSS";
              else if (reason === "VENTA") type = "SALE";
       }

       const updatedVariant = await prisma.$transaction(async (tx) => {
              const updated = await tx.productVariant.update({
                     where: { id: variantId },
                     data: { stockQuantity: newStock },
              });

              await tx.stockMovement.create({
                     data: {
                            variantId,
                            movementType: type,
                            quantity: delta,
                            reason,
                            balanceSnapshot: newStock,
                            timestamp: new Date(),
                     },
              });

              // Registrar costo de compra automáticamente en contabilidad
              if (reason === "COMPRA" && purchaseCostPerUnit && purchaseCostPerUnit > 0 && delta > 0) {
                     const totalCost = delta * purchaseCostPerUnit;
                     const productName = `${variant.product?.name || ""} ${variant.variantName}`.trim();

                     await tx.cashBookEntry.create({
                            data: {
                                   storeId,
                                   date: new Date(),
                                   type: "EGRESO",
                                   category: "COMPRA",
                                   amount: totalCost,
                                   method: purchasePaymentMethod as any,
                                   description: `Compra: ${productName} x${delta}`,
                            },
                     });

                     // Si paga en efectivo, registrar salida en la sesión de caja
                     if (purchasePaymentMethod === "EFECTIVO") {
                            const session = await tx.cashSession.findFirst({
                                   where: { storeId, status: "OPEN" },
                                   orderBy: { startTime: "desc" },
                            });
                            if (session) {
                                   await tx.cashMovement.create({
                                          data: {
                                                 cashSessionId: session.id,
                                                 type: "OUT",
                                                 amount: totalCost,
                                                 description: `Compra: ${productName} x${delta}`,
                                                 timestamp: new Date(),
                                          },
                                   });
                            }
                     }
              }

              return updated;
       });

       return {
              ...updatedVariant,
              costPrice: Number(updatedVariant.costPrice),
              salePrice: Number(updatedVariant.salePrice),
       };
}

export async function getCategories() {
       const storeId = await getStoreId();
       return await prisma.category.findMany({
              where: { storeId },
              orderBy: { name: 'asc' }
       });
}

export async function exportProductsToCSV() {
       const storeId = await getStoreId();
       const variants = await prisma.productVariant.findMany({
              where: { storeId, active: true },
              include: {
                     product: {
                            include: { category: true }
                     }
              }
       });

       const header = "Nombre,Categoria,Costo,Precio,Stock,CodigoBarras\n";
       const rows = variants.map(v => {
              const name = `${v.product.name} ${v.variantName}`.replace(/,/g, '');
              const cat = v.product.category?.name || 'General';
              return `${name},${cat},${v.costPrice},${v.salePrice},${v.stockQuantity},${v.barcode || ''}`;
       }).join("\n");

       return header + rows;
}

export async function deleteProduct(productId: number) {
       const storeId = await getStoreId();

       const product = await prisma.product.findUnique({
              where: { id: productId },
              include: { variants: true }
       });
       if (!product || product.storeId !== storeId) throw new Error("Producto no encontrado.");

       // Soft delete product and all its variants
       await prisma.$transaction([
              prisma.productVariant.updateMany({
                     where: { productId },
                     data: { active: false }
              }),
              prisma.product.update({
                     where: { id: productId },
                     data: { active: false }
              })
       ]);

       return { success: true };
}

export async function createCategory(name: string) {
       const storeId = await getStoreId();

       return await prisma.category.create({
              data: { name, storeId }
       });
}

export async function updateCategory(id: number, name: string) {
       const storeId = await getStoreId();

       const cat = await prisma.category.findUnique({ where: { id } });
       if (!cat || cat.storeId !== storeId) throw new Error("Categoría no encontrada.");

       return await prisma.category.update({
              where: { id },
              data: { name }
       });
}

export async function deleteCategory(id: number) {
       const storeId = await getStoreId();

       const cat = await prisma.category.findUnique({ where: { id } });
       if (!cat || cat.storeId !== storeId) throw new Error("Categoría no encontrada.");

       // Move products to uncategorized (null) before deleting
       await prisma.product.updateMany({
              where: { categoryId: id, storeId },
              data: { categoryId: null }
       });

       await prisma.category.delete({ where: { id } });

       return { success: true };
}


export async function updateProductDetails(
       variantId: number,
       data: {
              productName: string;
              variantName: string;
              barcode?: string;
              barcodes?: string[];
              costPrice: number;
              salePrice: number;
              minStock: number;
              isWeighable: boolean;
              trackStock: boolean;
              categoryId?: number;
       }
) {
       try {
              const storeId = await getStoreId();

              const variant = await prisma.productVariant.findUnique({
                     where: { id: variantId },
                     include: { product: true },
              });

              if (!variant || variant.storeId !== storeId) {
                     return { error: "Variante no encontrada o sin acceso." };
              }

              if (data.barcode && data.barcode !== variant.barcode) {
                     const existing = await prisma.productVariant.findFirst({
                            where: {
                                   storeId,
                                   barcode: data.barcode,
                                   NOT: { id: variantId },
                            },
                     });
                     if (existing) {
                            return { error: `El código '${data.barcode}' ya está en uso (puede estar en un producto eliminado).` };
                     }
              }

              const result = await prisma.$transaction(async (tx) => {
                     // Update product
                     await tx.product.update({
                            where: { id: variant.productId },
                            data: {
                                   name: data.productName,
                                   categoryId: data.categoryId,
                            },
                     });

                     // Update variant
                     return await tx.productVariant.update({
                            where: { id: variantId },
                            data: {
                                   variantName: data.variantName,
                                   barcode: data.barcode || null,
                                   costPrice: data.costPrice,
                                   salePrice: data.salePrice,
                                   minStock: data.minStock,
                                   isWeighable: data.isWeighable,
                                   trackStock: data.trackStock,
                                   barcodes: data.barcodes ? {
                                          deleteMany: {},
                                          create: data.barcodes.map(b => ({
                                                 barcode: b,
                                                 storeId,
                                          }))
                                   } : undefined,
                            },
                     });
              });

              return {
                     success: true,
                     data: {
                            ...result,
                            costPrice: Number(result.costPrice),
                            salePrice: Number(result.salePrice),
                     }
              };
       } catch (error: any) {
              console.error("Error updating product:", error);
              return { error: error.message || "Error al actualizar el producto" };
       }
}

export async function toggleQuickAccess(variantId: number) {
       const storeId = await getStoreId();

       const variant = await prisma.productVariant.findUnique({
              where: { id: variantId },
       });

       if (!variant || variant.storeId !== storeId) {
              throw new Error("Variante no encontrada.");
       }

       const updated = await prisma.productVariant.update({
              where: { id: variantId },
              data: { isQuickAccess: !variant.isQuickAccess },
       });

       return {
              ...updated,
              costPrice: Number(updated.costPrice),
              salePrice: Number(updated.salePrice),
       };
}

export async function getInventoryValue(): Promise<number> {
       const storeId = await getStoreId();
       const result = await prisma.$queryRaw<Array<{ total: string }>>`
              SELECT COALESCE(SUM("costPrice"::numeric * "stockQuantity"::numeric), 0)::text AS total
              FROM product_variants
              WHERE "storeId" = ${storeId} AND active = true
       `;
       return parseFloat(result[0]?.total || '0');
}

export async function getQuickAccessProducts() {
       const storeId = await getStoreId();

       const variants = await prisma.productVariant.findMany({
              where: {
                     storeId,
                     active: true,
                     isQuickAccess: true,
              },
              include: {
                     product: {
                            include: { category: true },
                     },
              },
              orderBy: [
                     { product: { name: "asc" } },
                     { variantName: "asc" },
              ],
       });

       return variants.map(v => ({
              ...v,
              costPrice: Number(v.costPrice),
              salePrice: Number(v.salePrice),
              product: {
                     ...v.product,
                     description: v.product.description || ""
              }
       }));
}
