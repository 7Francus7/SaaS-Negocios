const CACHE_NAME = "saas-negocios-runtime-v1";

self.addEventListener("install", (event) => {
       event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => {
                     return cache.addAll(["/", "/manifest.json", "/icon.png"]);
              })
       );
       self.skipWaiting();
});

self.addEventListener("activate", (event) => {
       event.waitUntil(
              caches.keys().then((keys) =>
                     Promise.all(
                            keys
                                   .filter((key) => key !== CACHE_NAME)
                                   .map((key) => caches.delete(key))
                     )
              )
       );
       self.clients.claim();
});

self.addEventListener("fetch", (event) => {
       const { request } = event;
       const url = new URL(request.url);

       if (request.method !== "GET" || !url.protocol.startsWith("http")) {
              return;
       }

       const isNavigation = request.mode === "navigate";

       if (isNavigation) {
              event.respondWith(
                     fetch(request)
                            .then((response) => {
                                   const cloned = response.clone();
                                   caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
                                   return response;
                            })
                            .catch(async () => {
                                   const cached = await caches.match(request);
                                   if (cached) {
                                          return cached;
                                   }

                                   return (
                                          (await caches.match("/dashboard/pos")) ||
                                          (await caches.match("/dashboard")) ||
                                          (await caches.match("/")) ||
                                          Response.error()
                                   );
                            })
              );
              return;
       }

       event.respondWith(
              caches.match(request).then((cached) => {
                     const networkFetch = fetch(request)
                            .then((response) => {
                                   if (response && response.status === 200) {
                                          const cloned = response.clone();
                                          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
                                   }
                                   return response;
                            })
                            .catch(() => cached || Response.error());

                     return cached || networkFetch;
              })
       );
});
