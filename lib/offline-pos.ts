"use client";

export type OfflineProduct = {
       id: number;
       variantName: string;
       barcode?: string | null;
       barcodes?: string[];
       costPrice?: number;
       salePrice: number;
       stockQuantity: number;
       minStock?: number;
       isWeighable?: boolean;
       isQuickAccess?: boolean;
       trackStock?: boolean;
       product: {
              id?: number;
              name: string;
              description?: string;
              categoryId?: number | null;
       };
};

export type OfflineCustomer = {
       id: number;
       name: string;
       currentBalance?: number;
       closedBalance?: number;
       creditLimit?: number;
};

export type OfflineStoreSettings = {
       name?: string;
       address?: string;
       phone?: string;
       cuit?: string;
       ticketFooter?: string;
       ticketInstagram?: string;
};

export type OfflineSessionMovement = {
       id: string;
       type: "IN" | "OUT";
       amount: number;
       description?: string;
       timestamp: string;
};

export type OfflineSession = {
       id?: number;
       status?: string;
       initialCash?: number;
       currentSales?: number;
       totalIn?: number;
       totalOut?: number;
       expectedCash?: number;
       store?: OfflineStoreSettings;
       movements?: OfflineSessionMovement[];
};

export type OfflinePromotionItem = {
       variantId?: number | null;
       categoryId?: number | null;
};

export type OfflinePromotion = {
       id: number;
       name: string;
       type: "PERCENTAGE" | "FIXED" | "MULTIBUY" | "PAYMENT_METHOD";
       value: number;
       buyQuantity?: number | null;
       payQuantity?: number | null;
       paymentMethod?: string | null;
       active?: boolean;
       allProducts?: boolean;
       startDate?: string | Date | null;
       endDate?: string | Date | null;
       items: OfflinePromotionItem[];
};

export type OfflineCartItem = {
       variantId: number;
       productName: string;
       variantName: string;
       price: number;
       quantity: number;
       maxStock: number;
       isWeighable?: boolean;
};

export type PendingSale = {
       id: string;
       createdAt: string;
       items: Array<{
              variantId: number;
              quantity: number;
              unitPrice?: number;
       }>;
       payments: Array<{
              method: string;
              amount: number;
       }>;
       customerId?: number;
       discountAmount: number;
       receipt: {
              items: OfflineCartItem[];
              total: number;
              date: string;
              paymentMethod: string;
              store?: OfflineStoreSettings | null;
       };
};

type KVRecord<T> = {
       key: string;
       value: T;
       updatedAt: string;
};

const DB_NAME = "saas-negocios-offline";
const DB_VERSION = 1;
const KV_STORE = "kv";
const PENDING_SALES_STORE = "pendingSales";

const SNAPSHOT_KEYS = {
       catalog: "catalog",
       customers: "customers",
       promotions: "promotions",
       session: "session",
       storeSettings: "storeSettings",
       lastSyncAt: "lastSyncAt",
} as const;

function canUseIndexedDb() {
       return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function emitOfflineUpdate() {
       if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("saas-offline-updated"));
       }
}

async function openDb(): Promise<IDBDatabase | null> {
       if (!canUseIndexedDb()) return null;

       return await new Promise((resolve, reject) => {
              const request = window.indexedDB.open(DB_NAME, DB_VERSION);

              request.onupgradeneeded = () => {
                     const db = request.result;

                     if (!db.objectStoreNames.contains(KV_STORE)) {
                            db.createObjectStore(KV_STORE, { keyPath: "key" });
                     }

                     if (!db.objectStoreNames.contains(PENDING_SALES_STORE)) {
                            db.createObjectStore(PENDING_SALES_STORE, { keyPath: "id" });
                     }
              };

              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
       });
}

async function withStore<T>(
       storeName: string,
       mode: IDBTransactionMode,
       handler: (store: IDBObjectStore) => void
): Promise<T> {
       const db = await openDb();
       if (!db) {
              throw new Error("IndexedDB no disponible");
       }

       return await new Promise((resolve, reject) => {
              const tx = db.transaction(storeName, mode);
              const store = tx.objectStore(storeName);
              let settled = false;

              tx.oncomplete = () => {
                     if (!settled) {
                            resolve(undefined as T);
                     }
                     db.close();
              };

              tx.onerror = () => {
                     if (!settled) {
                            reject(tx.error);
                     }
                     db.close();
              };

              try {
                     handler(store);
              } catch (error) {
                     settled = true;
                     reject(error);
                     db.close();
              }
       });
}

async function getKvRecord<T>(key: string): Promise<KVRecord<T> | null> {
       try {
              const db = await openDb();
              if (!db) return null;

              return await new Promise((resolve, reject) => {
                     const tx = db.transaction(KV_STORE, "readonly");
                     const store = tx.objectStore(KV_STORE);
                     const request = store.get(key);

                     request.onsuccess = () => {
                            resolve((request.result as KVRecord<T>) || null);
                            db.close();
                     };
                     request.onerror = () => {
                            reject(request.error);
                            db.close();
                     };
              });
       } catch (error) {
              console.error("offline getKvRecord error", error);
              return null;
       }
}

async function setKvRecord<T>(key: string, value: T) {
       try {
              await withStore<void>(KV_STORE, "readwrite", (store) => {
                     store.put({
                            key,
                            value,
                            updatedAt: new Date().toISOString(),
                     } satisfies KVRecord<T>);
              });
              emitOfflineUpdate();
       } catch (error) {
              console.error("offline setKvRecord error", error);
       }
}

export async function getCatalogSnapshot() {
       return (await getKvRecord<OfflineProduct[]>(SNAPSHOT_KEYS.catalog))?.value || [];
}

export async function setCatalogSnapshot(products: OfflineProduct[]) {
       await setKvRecord(SNAPSHOT_KEYS.catalog, products);
}

export async function getCustomerSnapshot() {
       return (await getKvRecord<OfflineCustomer[]>(SNAPSHOT_KEYS.customers))?.value || [];
}

export async function setCustomerSnapshot(customers: OfflineCustomer[]) {
       await setKvRecord(SNAPSHOT_KEYS.customers, customers);
}

export async function getPromotionSnapshot() {
       return (await getKvRecord<OfflinePromotion[]>(SNAPSHOT_KEYS.promotions))?.value || [];
}

export async function setPromotionSnapshot(promotions: OfflinePromotion[]) {
       await setKvRecord(SNAPSHOT_KEYS.promotions, promotions);
}

export async function getSessionSnapshot() {
       return (await getKvRecord<OfflineSession | null>(SNAPSHOT_KEYS.session))?.value || null;
}

export async function setSessionSnapshot(session: OfflineSession | null) {
       await setKvRecord(SNAPSHOT_KEYS.session, session);
}

export async function getStoreSettingsSnapshot() {
       return (await getKvRecord<OfflineStoreSettings | null>(SNAPSHOT_KEYS.storeSettings))?.value || null;
}

export async function setStoreSettingsSnapshot(settings: OfflineStoreSettings | null) {
       await setKvRecord(SNAPSHOT_KEYS.storeSettings, settings);
}

export async function markOfflineSync() {
       await setKvRecord(SNAPSHOT_KEYS.lastSyncAt, new Date().toISOString());
}

export async function getLastOfflineSyncAt() {
       return (await getKvRecord<string>(SNAPSHOT_KEYS.lastSyncAt))?.value || null;
}

export async function listPendingSales() {
       try {
              const db = await openDb();
              if (!db) return [];

              return await new Promise<PendingSale[]>((resolve, reject) => {
                     const tx = db.transaction(PENDING_SALES_STORE, "readonly");
                     const store = tx.objectStore(PENDING_SALES_STORE);
                     const request = store.getAll();

                     request.onsuccess = () => {
                            const result = (request.result as PendingSale[]) || [];
                            resolve(result.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
                            db.close();
                     };
                     request.onerror = () => {
                            reject(request.error);
                            db.close();
                     };
              });
       } catch (error) {
              console.error("offline listPendingSales error", error);
              return [];
       }
}

export async function countPendingSales() {
       const pending = await listPendingSales();
       return pending.length;
}

export async function enqueuePendingSale(entry: PendingSale) {
       try {
              await withStore<void>(PENDING_SALES_STORE, "readwrite", (store) => {
                     store.put(entry);
              });
              emitOfflineUpdate();
       } catch (error) {
              console.error("offline enqueuePendingSale error", error);
       }
}

export async function removePendingSale(id: string) {
       try {
              await withStore<void>(PENDING_SALES_STORE, "readwrite", (store) => {
                     store.delete(id);
              });
              emitOfflineUpdate();
       } catch (error) {
              console.error("offline removePendingSale error", error);
       }
}

export function isOfflineError(error: unknown) {
       const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
       return (
              message.includes("failed to fetch") ||
              message.includes("networkerror") ||
              message.includes("load failed") ||
              message.includes("fetch") ||
              (typeof navigator !== "undefined" && !navigator.onLine)
       );
}

export function searchOfflineProducts(products: OfflineProduct[], query: string, limit = 100) {
       const normalized = query.trim().toLowerCase();
       if (!normalized) {
              return products.slice(0, limit);
       }

       return products
              .filter((product) => {
                     const haystacks = [
                            product.product.name,
                            product.variantName,
                            product.barcode || "",
                            ...(product.barcodes || []),
                     ];

                     return haystacks.some((value) => value.toLowerCase().includes(normalized));
              })
              .slice(0, limit);
}

export function findOfflineProductByBarcode(products: OfflineProduct[], barcode: string) {
       const normalized = barcode.trim().toLowerCase();
       if (!normalized) return null;

       return (
              products.find((product) => {
                     const candidates = [product.barcode || "", ...(product.barcodes || [])];
                     return candidates.some((value) => value.toLowerCase() === normalized);
              }) || null
       );
}

export function getOfflineQuickAccessProducts(products: OfflineProduct[]) {
       return products.filter((product) => product.isQuickAccess);
}

function isPromotionActive(promotion: OfflinePromotion) {
       if (promotion.active === false) return false;

       const now = Date.now();
       const start = promotion.startDate ? new Date(promotion.startDate).getTime() : null;
       const end = promotion.endDate ? new Date(promotion.endDate).getTime() : null;

       if (start && start > now) return false;
       if (end && end < now) return false;
       return true;
}

export function calculatePromotionsOffline(
       cart: Array<OfflineCartItem & { product?: { categoryId?: number | null } }>,
       paymentMethod: string,
       promotions: OfflinePromotion[]
) {
       const activePromotions = promotions.filter(isPromotionActive);
       let totalDiscount = 0;
       const appliedPromos: string[] = [];

       for (const promotion of activePromotions) {
              if (promotion.type === "MULTIBUY") {
                     const buy = promotion.buyQuantity || 1;
                     const pay = promotion.payQuantity || 1;

                     for (const item of cart) {
                            const matchesItem =
                                   promotion.allProducts ||
                                   promotion.items.some(
                                          (promotionItem) =>
                                                 promotionItem.variantId === item.variantId ||
                                                 (promotionItem.categoryId &&
                                                        promotionItem.categoryId === item.product?.categoryId)
                                   );

                            if (matchesItem && item.quantity >= buy) {
                                   const sets = Math.floor(item.quantity / buy);
                                   const itemsSaved = sets * (buy - pay);
                                   const discount = itemsSaved * item.price;
                                   totalDiscount += discount;
                                   appliedPromos.push(promotion.name);
                            }
                     }
              }

              if (promotion.type === "PERCENTAGE" || promotion.type === "FIXED") {
                     for (const item of cart) {
                            const matchesItem =
                                   promotion.allProducts ||
                                   promotion.items.some(
                                          (promotionItem) =>
                                                 promotionItem.variantId === item.variantId ||
                                                 (promotionItem.categoryId &&
                                                        promotionItem.categoryId === item.product?.categoryId)
                                   );

                            if (matchesItem) {
                                   const value = Number(promotion.value || 0);
                                   const discount =
                                          promotion.type === "FIXED"
                                                 ? value * item.quantity
                                                 : item.price * item.quantity * (value / 100);
                                   totalDiscount += discount;
                                   appliedPromos.push(promotion.name);
                            }
                     }
              }
       }

       const subtotalAfterProductPromos =
              cart.reduce((sum, item) => sum + item.price * item.quantity, 0) - totalDiscount;

       for (const promotion of activePromotions) {
              if (promotion.type === "PAYMENT_METHOD" && promotion.paymentMethod === paymentMethod) {
                     const discount = Math.max(0, subtotalAfterProductPromos * (Number(promotion.value || 0) / 100));
                     totalDiscount += discount;
                     appliedPromos.push(`${promotion.name} (${paymentMethod})`);
              }
       }

       return {
              totalDiscount,
              appliedPromos: Array.from(new Set(appliedPromos)),
       };
}

export async function applyPendingSaleToSnapshots(entry: PendingSale) {
       const catalog = await getCatalogSnapshot();
       const session = await getSessionSnapshot();

       if (catalog.length > 0) {
              const updatedCatalog = catalog.map((product) => {
                     const soldItem = entry.items.find((item) => item.variantId === product.id);
                     if (!soldItem || product.isWeighable || product.trackStock === false) {
                            return product;
                     }

                     return {
                            ...product,
                            stockQuantity: Math.max(0, Number(product.stockQuantity || 0) - soldItem.quantity),
                     };
              });

              await setCatalogSnapshot(updatedCatalog);
       }

       if (session) {
              const cashPaid = entry.payments
                     .filter((payment) => payment.method === "EFECTIVO")
                     .reduce((sum, payment) => sum + payment.amount, 0);

              const updatedSession: OfflineSession = {
                     ...session,
                     currentSales: Number(session.currentSales || 0) + cashPaid,
                     expectedCash: Number(session.expectedCash || session.initialCash || 0) + cashPaid,
              };

              await setSessionSnapshot(updatedSession);
       }
}

export function buildPendingSaleId() {
       return `offline-sale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export { emitOfflineUpdate };
