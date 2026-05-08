"use client";

import { useEffect, useRef } from "react";
import { processSale } from "@/app/actions/sales";
import { useToast } from "@/components/providers/toast-provider";
import {
       isOfflineError,
       listPendingSales,
       removePendingSale,
       markOfflineSync,
       emitOfflineUpdate,
} from "@/lib/offline-pos";

export function OfflineSyncProvider() {
       const { toast } = useToast();
       const syncingRef = useRef(false);

       useEffect(() => {
              const syncPendingSales = async () => {
                     if (syncingRef.current || !navigator.onLine) {
                            return;
                     }

                     syncingRef.current = true;

                     try {
                            const pendingSales = await listPendingSales();
                            if (pendingSales.length === 0) {
                                   return;
                            }

                            let synced = 0;

                            for (const pendingSale of pendingSales) {
                                   try {
                                          await processSale(
                                                 pendingSale.items,
                                                 pendingSale.payments,
                                                 pendingSale.customerId,
                                                 pendingSale.discountAmount
                                          );
                                          await removePendingSale(pendingSale.id);
                                          synced += 1;
                                   } catch (error) {
                                          if (isOfflineError(error)) {
                                                 break;
                                          }

                                          console.error("No se pudo sincronizar una venta offline", pendingSale.id, error);
                                          toast("Una venta offline requiere revisión manual antes de sincronizar.", "error");
                                          break;
                                   }
                            }

                            if (synced > 0) {
                                   await markOfflineSync();
                                   emitOfflineUpdate();
                                   toast(
                                          synced === 1
                                                 ? "1 venta offline sincronizada."
                                                 : `${synced} ventas offline sincronizadas.`,
                                          "success"
                                   );
                            }
                     } finally {
                            syncingRef.current = false;
                     }
              };

              const handleOnline = () => {
                     toast("Conexión restablecida. Sincronizando pendientes...", "info");
                     syncPendingSales();
              };

              const handleOffline = () => {
                     toast("Sin internet. El POS seguirá operando con datos locales.", "warning");
              };

              syncPendingSales();
              window.addEventListener("online", handleOnline);
              window.addEventListener("offline", handleOffline);

              return () => {
                     window.removeEventListener("online", handleOnline);
                     window.removeEventListener("offline", handleOffline);
              };
       }, [toast]);

       return null;
}
