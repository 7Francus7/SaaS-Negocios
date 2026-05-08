import { cookies } from "next/headers";

type SessionCookiePayload = {
       email: string;
       id?: string | null;
       role?: string | null;
       storeId?: string | null;
       name?: string | null;
       maxAge?: number;
};

const baseCookieOptions = {
       httpOnly: true,
       secure: process.env.NODE_ENV === "production",
       sameSite: "lax" as const,
       path: "/",
};

export async function setSessionCookies({
       email,
       id,
       role,
       storeId,
       name,
       maxAge = 60 * 60 * 24 * 365 * 10,
}: SessionCookiePayload) {
       const cookieStore = await cookies();

       cookieStore.set("user_email", email, { ...baseCookieOptions, maxAge });

       if (id) cookieStore.set("user_id", id, { ...baseCookieOptions, maxAge });
       else cookieStore.delete("user_id");

       if (role) cookieStore.set("user_role", role, { ...baseCookieOptions, maxAge });
       else cookieStore.delete("user_role");

       if (storeId) cookieStore.set("user_store_id", storeId, { ...baseCookieOptions, maxAge });
       else cookieStore.delete("user_store_id");

       if (name) cookieStore.set("user_name", name, { ...baseCookieOptions, maxAge });
       else cookieStore.delete("user_name");
}

export async function clearSessionCookies() {
       const cookieStore = await cookies();
       for (const key of ["user_email", "user_id", "user_role", "user_store_id", "user_name"]) {
              cookieStore.delete(key);
       }
}
