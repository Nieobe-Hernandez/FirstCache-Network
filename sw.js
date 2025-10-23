const CACHE_NAME = "app-shell-v1";
const DYNAMIC_CACHE = "dynamic-cache-v1";

const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/calendar.html",
  "/form.html",
  "/main.js",
  "/css/styles.css",
  "/manifest.json",
  "/images/icon/180.png",
  "images/icon/192.png",
  "images/icon/512.png",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener("activate", event => {
  const keep = [CACHE_NAME, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (!keep.includes(k)) return caches.delete(k);
      }))
    )
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = event.request.url;

  const isDynamicResource =
    url.includes("fullcalendar") ||
    url.includes("select2") ||
    url.includes("jquery") ||
    url.endsWith("calendar.html") ||
    url.endsWith("form.html") ||
    url.includes("index.global.min.js");

  if (isDynamicResource) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});

function networkFirst(request) {
  return fetch(request)
    .then(networkResponse => {
      if (!networkResponse || !networkResponse.ok) {
        return caches.match(request);
      }
      const cloned = networkResponse.clone();
      caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, cloned));
      return networkResponse;
    })
    .catch(() => caches.match(request));
}
