"use client";

import { useEffect } from "react";

export default function GlobalError({
       error,
       reset,
}: {
       error: Error & { digest?: string };
       reset: () => void;
}) {
       useEffect(() => {
              console.error("GLOBAL_ERROR:", error);
       }, [error]);

       return (
              <html lang="es">
                     <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
                            <div
                                   style={{
                                          minHeight: "100vh",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          background: "#f8fafc",
                                          padding: "1.5rem",
                                   }}
                            >
                                   <div
                                          style={{
                                                 background: "white",
                                                 borderRadius: "1.5rem",
                                                 boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                                                 border: "1px solid #f1f5f9",
                                                 maxWidth: "26rem",
                                                 width: "100%",
                                                 padding: "2.5rem 2rem",
                                                 textAlign: "center",
                                          }}
                                   >
                                          <div
                                                 style={{
                                                        width: "4rem",
                                                        height: "4rem",
                                                        margin: "0 auto 1.5rem",
                                                        borderRadius: "9999px",
                                                        background: "#fef2f2",
                                                        color: "#ef4444",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: "2rem",
                                                        fontWeight: 900,
                                                 }}
                                          >
                                                 !
                                          </div>
                                          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem" }}>
                                                 Algo salió mal
                                          </h1>
                                          <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.5, margin: "0 0 1.75rem" }}>
                                                 Tuvimos un problema al cargar el sistema. Probá nuevamente; si el error
                                                 continúa, volvé a iniciar sesión.
                                          </p>
                                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                                 <button
                                                        onClick={() => reset()}
                                                        style={{
                                                               background: "#2563eb",
                                                               color: "white",
                                                               border: "none",
                                                               borderRadius: "0.75rem",
                                                               padding: "0.85rem 1rem",
                                                               fontSize: "0.85rem",
                                                               fontWeight: 700,
                                                               textTransform: "uppercase",
                                                               letterSpacing: "0.05em",
                                                               cursor: "pointer",
                                                        }}
                                                 >
                                                        Reintentar
                                                 </button>
                                                 <a
                                                        href="/"
                                                        style={{
                                                               color: "#64748b",
                                                               fontSize: "0.85rem",
                                                               fontWeight: 600,
                                                               textDecoration: "none",
                                                               padding: "0.5rem",
                                                        }}
                                                 >
                                                        Volver al inicio de sesión
                                                 </a>
                                          </div>
                                          {error?.digest && (
                                                 <p style={{ color: "#cbd5e1", fontSize: "0.7rem", marginTop: "1.5rem", fontFamily: "monospace" }}>
                                                        Ref: {error.digest}
                                                 </p>
                                          )}
                                   </div>
                            </div>
                     </body>
              </html>
       );
}
