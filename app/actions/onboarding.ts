"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";

/**
 * Completa el onboarding creando datos demo para el negocio
 */
export async function completeOnboarding(data: {
       storeName: string;
       address?: string;
       phone?: string;
}) {
       const storeId = await getStoreId();

       // 1. Actualizar información del negocio
       await prisma.store.update({
              where: { id: storeId },
              data: {
                     name: data.storeName,
                     address: data.address,
                     phone: data.phone,
                     hasCompletedOnboarding: true,
                     onboardingCompletedAt: new Date(),
              },
       });

       // 2. Crear categorías demo
       const categories = await Promise.all([
              prisma.category.create({
                     data: { name: "Bebidas", storeId },
              }),
              prisma.category.create({
                     data: { name: "Snacks", storeId },
              }),
              prisma.category.create({
                     data: { name: "Cigarrillos", storeId },
              }),
              prisma.category.create({
                     data: { name: "Almacén", storeId },
              }),
       ]);

       // 3. Crear productos demo realistas (Argentina)
       const products = [
              {
                     name: "Coca-Cola",
                     category: categories[0].id,
                     variants: [
                            { name: "500ml", barcode: "7790895000010", cost: 850, price: 1200, stock: 24 },
                            { name: "1.5L", barcode: "7790895000027", cost: 1400, price: 2000, stock: 12 },
                            { name: "2.25L", barcode: "7790895000034", cost: 1800, price: 2600, stock: 8 },
                     ],
              },
              {
                     name: "Pepsi",
                     category: categories[0].id,
                     variants: [
                            { name: "500ml", barcode: "7790315000011", cost: 800, price: 1150, stock: 18 },
                            { name: "1.5L", barcode: "7790315000028", cost: 1350, price: 1950, stock: 10 },
                     ],
              },
              {
                     name: "Agua Mineral Villavicencio",
                     category: categories[0].id,
                     variants: [
                            { name: "500ml", barcode: "7790070000012", cost: 450, price: 700, stock: 30 },
                            { name: "1.5L", barcode: "7790070000029", cost: 700, price: 1100, stock: 20 },
                     ],
              },
              {
                     name: "Lays",
                     category: categories[1].id,
                     variants: [
                            { name: "Clásicas 40g", barcode: "7790310000013", cost: 650, price: 1000, stock: 15 },
                            { name: "Clásicas 90g", barcode: "7790310000020", cost: 1200, price: 1800, stock: 10 },
                     ],
              },
              {
                     name: "Alfajor Jorgito",
                     category: categories[1].id,
                     variants: [
                            { name: "Simple", barcode: "7790580000014", cost: 350, price: 550, stock: 40 },
                            { name: "Triple", barcode: "7790580000021", cost: 650, price: 1000, stock: 25 },
                     ],
              },
              {
                     name: "Marlboro",
                     category: categories[2].id,
                     variants: [
                            { name: "Box 20", barcode: "7790000000015", cost: 2800, price: 3500, stock: 10 },
                            { name: "Red 20", barcode: "7790000000022", cost: 2700, price: 3400, stock: 8 },
                     ],
              },
              {
                     name: "Arroz Gallo Oro",
                     category: categories[3].id,
                     variants: [
                            { name: "1kg", barcode: "7790070000036", cost: 1200, price: 1800, stock: 12 },
                     ],
              },
              {
                     name: "Aceite Cocinero",
                     category: categories[3].id,
                     variants: [
                            { name: "900ml", barcode: "7790310000037", cost: 2200, price: 3200, stock: 8 },
                     ],
              },
       ];

       for (const product of products) {
              const createdProduct = await prisma.product.create({
                     data: {
                            name: product.name,
                            categoryId: product.category,
                            storeId,
                            active: true,
                     },
              });

              for (const variant of product.variants) {
                     await prisma.productVariant.create({
                            data: {
                                   productId: createdProduct.id,
                                   variantName: variant.name,
                                   barcode: variant.barcode,
                                   costPrice: variant.cost,
                                   salePrice: variant.price,
                                   stockQuantity: variant.stock,
                                   minStock: 5,
                                   storeId,
                                   active: true,
                            },
                     });
              }
       }

       // 4. Crear clientes demo
       await Promise.all([
              prisma.customer.create({
                     data: {
                            name: "Juan Pérez",
                            dni: "35123456",
                            phone: "+54 9 11 2345-6789",
                            address: "Av. Corrientes 1234",
                            creditLimit: 50000,
                            currentBalance: 0,
                            storeId,
                            active: true,
                     },
              }),
              prisma.customer.create({
                     data: {
                            name: "María González",
                            dni: "28987654",
                            phone: "+54 9 11 9876-5432",
                            address: "Calle Falsa 123",
                            creditLimit: 30000,
                            currentBalance: 0,
                            storeId,
                            active: true,
                     },
              }),
       ]);

       // 5. Crear una sesión de caja abierta
       await prisma.cashSession.create({
              data: {
                     storeId,
                     startTime: new Date(),
                     initialCash: 10000,
                     status: "OPEN",
              },
       });

       return { success: true };
}

/**
 * Verifica si el usuario completó el onboarding
 */
export async function checkOnboardingStatus() {
       const storeId = await getStoreId();

       const store = await prisma.store.findUnique({
              where: { id: storeId },
              select: {
                     hasCompletedOnboarding: true,
                     name: true,
              },
       });

       return {
              completed: store?.hasCompletedOnboarding ?? false,
              storeName: store?.name ?? "",
       };
}
