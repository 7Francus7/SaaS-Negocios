"use server";

import { Preference, MercadoPagoConfig } from 'mercadopago';
import { SAAS_PLANS } from "@/lib/mercadopago";
import { getStoreId } from "@/lib/store";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

// Access token should be in env or lib
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-833989182372767-111111-1a2e85a6b7d1e8c7c97893b8d4f4b234-192837465' });

export async function createSubscriptionPreference() {
       const storeId = await getStoreId();
       const store = await prisma.store.findUnique({ where: { id: storeId }, include: { users: true } });

       if (!store || !store.users[0]) throw new Error("Tienda no válida");

       const plan = SAAS_PLANS.PRO;
       const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

       try {
              const preference = new Preference(client);
              const result = await preference.create({
                     body: {
                            items: [
                                   {
                                          id: plan.id,
                                          title: `Suscripción ${plan.name} - Despensa SaaS`,
                                          quantity: 1,
                                          unit_price: plan.price,
                                          currency_id: 'ARS'
                                   }
                            ],
                            payer: {
                                   email: store.users[0].email,
                                   name: store.users[0].name || "Dueño",
                            },
                            back_urls: {
                                   success: `${baseUrl}/dashboard/subscription/success`,
                                   failure: `${baseUrl}/dashboard/subscription/failure`,
                                   pending: `${baseUrl}/dashboard/subscription/pending`
                            },
                            auto_return: "approved",
                            metadata: {
                                   store_id: storeId,
                                   plan: 'PRO'
                            },
                            // Recurring payments usually use PreApproval API, but for MVP we can use a simple Preference 
                            // that charges for 1 month or try to create a proper Subscription if needed.
                            // For simplicity in MVP, we might treat it as a "Purchase" of 1 month access or link to a Subscription Plan.
                            // But Preference is for one-time payments. 
                            // To do real subscriptions we need PreApproval.
                            // Let's stick to Preference for now as "Monthly Payment" or switch to PreApproval if desired.
                            // Actually, PreApproval is better for SaaS. Let's switch to PreApproval creation.
                     }
              });

              return { init_point: result.init_point };
       } catch (error) {
              console.error("MP Error:", error);
              throw new Error("Error al crear la preferencia de pago");
       }
}

import { PreApproval } from 'mercadopago';
// We need to use preapproval for subscriptions
// BUT PreApproval creation via API requires a "payer_email" which must be a test user in sandbox.
// For simplicity, many MVPs just use a "Payment Button" that charges 1 month.
// Let's implement a simple "Pay 1 Month" using Preference for now to guarantee it works without complex preapproval setup in Sandbox.
// We can upgrade to real subscriptions later.
