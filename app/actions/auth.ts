"use server";

import prisma from "@/lib/prisma";
import { clearSessionCookies, setSessionCookies } from "@/lib/session-cookies";
import bcrypt from "bcryptjs";

export async function login(_prevState: unknown, formData: FormData) {
       const email = (formData.get("email") as string || "").trim().toLowerCase();
       const password = (formData.get("password") as string || "");

       if (!email || !password) {
              return { error: "Por favor ingrese email y contraseña" };
       }

       try {
              // Super admin via env vars only — never hardcoded
              const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
              const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

              if (
                     superAdminEmail &&
                     superAdminPassword &&
                     email === superAdminEmail &&
                     password === superAdminPassword
              ) {
                     await setSessionCookies({
                            email,
                            id: "superadmin",
                            role: "SUPERADMIN",
                            name: "Root Admin",
                            maxAge: 60 * 60 * 24,
                     });
                     return { success: true, godMode: true };
              }

              const user = await prisma.user.findUnique({
                     where: { email },
              });

              if (!user || !user.password) {
                     return { error: "Credenciales inválidas" };
              }

              const isMatch = bcrypt.compareSync(password, user.password);

              if (!isMatch) {
                     return { error: "Credenciales inválidas" };
              }

              await setSessionCookies({
                     email: user.email,
                     id: user.id,
                     role: user.role,
                     storeId: user.storeId,
                     name: user.name,
              });

              return { success: true };
       } catch (error) {
              console.error("Login error:", error);
              return { error: "Error al iniciar sesión" };
       }
}

export async function register(_prevState: unknown, formData: FormData) {
       const name = (formData.get("name") as string || "").trim();
       const email = (formData.get("email") as string || "").trim().toLowerCase();
       const storeName = (formData.get("storeName") as string || "").trim();
       const password = formData.get("password") as string || "";
       const confirmPassword = formData.get("confirmPassword") as string || "";

       if (!name || !email || !storeName || !password) {
              return { error: "Todos los campos son requeridos" };
       }

       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
       if (!emailRegex.test(email)) {
              return { error: "El email ingresado no es válido" };
       }

       if (password.length < 8) {
              return { error: "La contraseña debe tener al menos 8 caracteres" };
       }

       if (password !== confirmPassword) {
              return { error: "Las contraseñas no coinciden" };
       }

       try {
              const existing = await prisma.user.findUnique({ where: { email } });
              if (existing) {
                     return { error: "Este email ya está registrado" };
              }

              const hashedPassword = bcrypt.hashSync(password, 10);

              const baseSlug = storeName
                     .toLowerCase()
                     .normalize("NFD")
                     .replace(/[̀-ͯ]/g, "")
                     .replace(/[^a-z0-9]/g, "-")
                     .replace(/-+/g, "-")
                     .replace(/^-|-$/g, "")
                     .substring(0, 30) || "tienda";
              const uniqueSlug = `${baseSlug}-${Date.now()}`;

              const user = await prisma.user.create({
                     data: {
                            name,
                            email,
                            password: hashedPassword,
                            role: "OWNER",
                            store: {
                                   create: {
                                          name: storeName,
                                          slug: uniqueSlug,
                                          isActive: true,
                                   },
                            },
                     },
              });

              await setSessionCookies({
                     email: user.email,
                     id: user.id,
                     role: user.role,
                     storeId: user.storeId,
                     name: user.name,
              });

              return { success: true };
       } catch (error) {
              console.error("Register error:", error);
              return { error: "Error al crear la cuenta. Intenta nuevamente." };
       }
}

export async function logout() {
       await clearSessionCookies();
}
