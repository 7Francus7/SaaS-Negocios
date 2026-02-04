"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { safeSerialize } from "@/lib/utils";

export type PromotionInput = {
       name: string;
       description?: string;
       type: 'PERCENTAGE' | 'FIXED' | 'MULTIBUY' | 'PAYMENT_METHOD';
       value: number;
       buyQuantity?: number;
       payQuantity?: number;
       paymentMethod?: string;
       startDate?: Date;
       endDate?: Date;
       allProducts?: boolean;
       itemVariants?: number[]; // List of variant IDs
       itemCategories?: number[]; // List of category IDs
};

export async function getPromotions() {
       const storeId = await getStoreId();
       const promotions = await prisma.promotion.findMany({
              where: { storeId },
              include: {
                     items: {
                            include: {
                                   variant: { include: { product: true } },
                                   category: true
                            }
                     }
              },
              orderBy: { name: 'asc' }
       });
       return safeSerialize(promotions);
}

export async function createPromotion(data: PromotionInput) {
       const storeId = await getStoreId();

       const promotion = await prisma.promotion.create({
              data: {
                     storeId,
                     name: data.name,
                     description: data.description,
                     type: data.type,
                     value: data.value,
                     buyQuantity: data.buyQuantity,
                     payQuantity: data.payQuantity,
                     paymentMethod: data.paymentMethod,
                     startDate: data.startDate,
                     endDate: data.endDate,
                     allProducts: data.allProducts || false,
                     items: {
                            create: [
                                   ...(data.itemVariants?.map(v => ({ variantId: v })) || []),
                                   ...(data.itemCategories?.map(c => ({ categoryId: c })) || [])
                            ]
                     }
              }
       });

       return safeSerialize(promotion);
}

export async function togglePromotion(id: number, active: boolean) {
       const storeId = await getStoreId();
       const updated = await prisma.promotion.update({
              where: { id, storeId },
              data: { active }
       });
       return safeSerialize(updated);
}

export async function deletePromotion(id: number) {
       const storeId = await getStoreId();
       await prisma.promotion.delete({
              where: { id, storeId }
       });
       return { success: true };
}

// Logic to calculate discounts based on cart
export async function calculatePromotions(cart: any[], paymentMethod: string) {
       const storeId = await getStoreId();

       // 1. Fetch active promotions
       const activePromis = await prisma.promotion.findMany({
              where: {
                     storeId,
                     active: true,
                     OR: [
                            { startDate: null },
                            { startDate: { lte: new Date() } }
                     ],
                     AND: [
                            {
                                   OR: [
                                          { endDate: null },
                                          { endDate: { gte: new Date() } }
                                   ]
                            }
                     ]
              },
              include: { items: true }
       });

       let totalDiscount = 0;
       const appliedPromos: string[] = [];
       const itemsWithDiscount = cart.map(item => ({ ...item, discount: 0, appliedPromo: null }));

       // 2. Apply Product-specific Promos (MULTIBUY, PERCENTAGE on items)
       for (const promo of activePromis) {
              if (promo.type === 'MULTIBUY') {
                     // e.g. 2x1 -> Buy 2, Pay 1.
                     const buy = promo.buyQuantity || 1;
                     const pay = promo.payQuantity || 1;

                     for (const item of itemsWithDiscount) {
                            const isApplicable = promo.allProducts || promo.items.some(pi => pi.variantId === item.variantId || (pi.categoryId && item.product?.categoryId === pi.categoryId));

                            if (isApplicable && item.quantity >= buy) {
                                   const sets = Math.floor(item.quantity / buy);
                                   const itemsSaved = sets * (buy - pay);
                                   const discount = itemsSaved * item.price;

                                   item.discount += discount;
                                   item.appliedPromo = promo.name;
                                   totalDiscount += discount;
                                   appliedPromos.push(promo.name);
                            }
                     }
              } else if (promo.type === 'PERCENTAGE' || promo.type === 'FIXED') {
                     // Simple percentage or fixed discount on specific items
                     for (const item of itemsWithDiscount) {
                            const isApplicable = promo.allProducts || promo.items.some(pi => pi.variantId === item.variantId || (pi.categoryId && item.product?.categoryId === pi.categoryId));

                            if (isApplicable) {
                                   const discountValue = Number(promo.value);
                                   const discount = promo.type === 'FIXED'
                                          ? (discountValue * item.quantity)
                                          : ((item.price * item.quantity) * (discountValue / 100));

                                   item.discount += discount;
                                   item.appliedPromo = promo.name;
                                   totalDiscount += discount;
                                   appliedPromos.push(promo.name);
                            }
                     }
              }
       }

       // 3. Apply Payment Method Promos (Total discount)
       const subtotalAfterProductPromos = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) - totalDiscount;

       for (const promo of activePromis) {
              if (promo.type === 'PAYMENT_METHOD' && promo.paymentMethod === paymentMethod) {
                     const discountValue = Number(promo.value);
                     const discount = subtotalAfterProductPromos * (discountValue / 100);
                     totalDiscount += discount;
                     appliedPromos.push(`${promo.name} (${paymentMethod})`);
              }
       }

       return {
              totalDiscount,
              appliedPromos: Array.from(new Set(appliedPromos)),
              itemsWithDiscount
       };
}
