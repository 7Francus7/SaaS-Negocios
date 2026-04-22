"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { revalidatePath } from "next/cache";

export async function getStoreSettings() {
       const storeId = await getStoreId();

       const store = await prisma.store.findUnique({
              where: { id: storeId },
              include: {
                     settings: true
              }
       });

       if (!store) throw new Error("Tienda no encontrada");

       // Helper to find setting value
       const getSetting = (key: string) => store.settings.find(s => s.key === key)?.value || "";

       return {
              name: store.name,
              address: store.address || "",
              phone: store.phone || "",
              cuit: store.cuit || "",
              ticketFooter: getSetting("ticket_footer") || "¡Gracias por su compra!",
              ticketInstagram: getSetting("ticket_instagram") || "",
       };
}

export async function updateStoreSettings(data: {
       name: string;
       address: string;
       phone: string;
       cuit: string;
       ticketFooter: string;
       ticketInstagram: string;
}) {
       const storeId = await getStoreId();

       // 1. Update Core Fields
       await prisma.store.update({
              where: { id: storeId },
              data: {
                     name: data.name,
                     address: data.address,
                     phone: data.phone,
                     cuit: data.cuit
              }
       });

       // 2. Update Settings (Upsert logic helper)
       const upsertSetting = async (key: string, value: string) => {
              const existing = await prisma.storeSetting.findUnique({
                     where: { storeId_key: { storeId, key } }
              });

              if (existing) {
                     await prisma.storeSetting.update({
                            where: { id: existing.id },
                            data: { value }
                     });
              } else {
                     await prisma.storeSetting.create({
                            data: { storeId, key, value }
                     });
              }
       };

       await upsertSetting("ticket_footer", data.ticketFooter);
       await upsertSetting("ticket_instagram", data.ticketInstagram);

       revalidatePath("/dashboard");
       return { success: true };
}

export async function changePassword(currentPassword: string, newPassword: string) {
       const { cookies } = await import("next/headers");
       const email = (await cookies()).get("user_email")?.value;
       if (!email) throw new Error("No autenticado.");

       const bcrypt = await import("bcryptjs");

       const user = await prisma.user.findUnique({ where: { email } });
       if (!user || !user.password) throw new Error("Usuario no encontrado.");

       // Verify current password
       const isMatch = bcrypt.compareSync(currentPassword, user.password) || user.password === currentPassword;
       if (!isMatch) throw new Error("La contraseña actual es incorrecta.");

       if (newPassword.length < 6) throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");

       const hashedPassword = bcrypt.hashSync(newPassword, 10);

       await prisma.user.update({
              where: { email },
              data: { password: hashedPassword }
       });

       return { success: true };
}
