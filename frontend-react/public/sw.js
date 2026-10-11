// Verimulta — Service Worker: cache somente do shell público e de ativos.
// Respostas de API, sessão, checkout e painel administrativo nunca entram no cache.
const CACHE = 'verimulta-public-v3';
const ARQUIVOS = ['./','index.html','app.html','termos.html','privacidade.html','instalar.html','manifest.json','robots.txt','icones/icone-192.png','icones/icone-512.png','icones/favicon.png','icones/social.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const privateRequest = url.origin !== self.location.origin
    || url.pathname.startsWith('/v1/')
    || url.pathname === '/admin.html'
    || e.request.headers.has('authorization')
    || e.request.headers.has('x-admin-secret');
  if (privateRequest) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia)).catch(()=>{});
      }
      return r;
    }).catch(() => {
      // Só navegações podem receber o shell offline. Nunca devolva HTML para
      // JS, CSS, imagens ou respostas públicas com outro MIME type.
      if (e.request.mode !== 'navigate') return Response.error();
      return caches.match(e.request).then(m => m || caches.match('app.html'));
    })
  );
});
