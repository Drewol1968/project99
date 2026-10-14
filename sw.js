const CACHE = "project99-v26";
const ASSETS = ["./promote.html", "./promote.js?v=1", "./about.html", "./privacy.html", "./terms.html", "./metrics.html", "./metrics.js?v=3", "./sponsor.html", "./sponsor.js?v=2", "./sponsor-config.js?v=1", "./ads-config.js?v=1", "./ranking.js?v=7", "./ranking-config.js?v=2", "./styles.css?v=25", "./app.js?v=26", "./manifest.webmanifest?v=25", "./icon.svg"];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  ]));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
