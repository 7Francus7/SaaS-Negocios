"use server";

import prisma from "@/lib/prisma";
import { safeSerialize } from "@/lib/utils";
import { redirect } from "next/navigation";

import bcrypt from "bcryptjs";

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

              if (!user || !user.password) {
                     return { error: "Credenciales inválidas" };
              }

              // Password Check (Hybrid: Supports Hash & Legacy Plain Text)
              const isMatch = bcrypt.compareSync(password, user.password) || user.password === password;

              if (!isMatch) {
                     return { error: "Credenciales inválidas" };
              }

              // Set cookie for simple session management
              const { cookies } = await import("next/headers");
              (await cookies()).set("user_email", email, {
                     httpOnly: true,
                     secure: process.env.NODE_ENV === "production",
                     maxAge: 60 * 60 * 24 * 7, // 1 week
                     path: "/",
              });

              return { success: true };
       } catch (error) {
              console.error("Login error:", error);
              return { error: "Error al iniciar sesión" };
       }
}
