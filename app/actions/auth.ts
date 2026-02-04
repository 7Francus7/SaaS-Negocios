"use server";

import prisma from "@/lib/prisma";
import { safeSerialize } from "@/lib/utils";
import { redirect } from "next/navigation";

export async function login(prevState: any, formData: FormData) {
       const email = formData.get("email") as string;
       const password = formData.get("password") as string;

       if (!email || !password) {
              return { error: "Por favor ingrese email y contraseña" };
       }

       try {
              // GOD MODE CHECK
              // If the user enters specific credentials, we can treat them as "GOD"
              if (email === "admin@saas.com" && password === "admin123") {
                     // In a real app, set a cookie here.
                     // For now, we return a success flag that the client can use to redirect
                     return { success: true, godMode: true };
              }

              // Normal User Check
              const user = await prisma.user.findUnique({
                     where: { email },
              });

              if (!user) {
                     // For demo purposes, we might want to auto-create user or fail
                     // Just fail for now to be realistic
                     return { error: "Usuario no encontrado" };
              }

              // Simple password check (INSECURE: assumes plain text for this demo as requested)
              // If you have bcrypt, use it. But schema didn't show it explicitly, and no bcrypt in deps.
              if (user.password && user.password !== password) {
                     return { error: "Contraseña incorrecta" };
              }

              // If password is null in DB (e.g. initial setup), allow login?
              // Let's assume strict check if password exists.

              return { success: true };
       } catch (error) {
              console.error("Login error:", error);
              return { error: "Error al iniciar sesión" };
       }
}
