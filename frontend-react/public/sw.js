// Verimulta — Service Worker (PWA instalável + offline básico)
const CACHE = 'verimulta-v1';
const ARQUIVOS = ['./','index.html','app.html','manifest.json','icones/icone-192.png','icones/icone-512.png','icones/favicon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia)).catch(()=>{});
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('app.html')))
  );
});
