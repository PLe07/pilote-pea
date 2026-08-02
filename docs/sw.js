/* Service worker : la coque est servie depuis le cache, les données du jour
   sont toujours tentées sur le réseau d'abord. */
const SHELL = "pilote-pea-shell-v1";
const DATA  = "pilote-pea-data-v1";
const FILES = ["./","./index.html","./app.js","./styles.css","./reset.html",
               "./manifest.webmanifest","./icons/icon.svg","./icons/icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  // la page de réparation passe toujours par le réseau : c'est l'issue de secours
  if (url.pathname.endsWith("/reset.html")) { e.respondWith(fetch(e.request)); return; }

  // données : réseau d'abord, cache en repli — on veut toujours la collecte la plus fraîche
  if (url.pathname.includes("/data/")) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const c = r.clone(); caches.open(DATA).then(k => k.put(e.request, c)); return r; })
        .catch(() => caches.match(e.request).then(r => r || caches.match("./data/latest.json")))
    );
    return;
  }
  // coque : cache d'abord, réseau en arrière-plan
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => {
        if (r.ok) { const c = r.clone(); caches.open(SHELL).then(k => k.put(e.request, c)); }
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
