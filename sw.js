// Service worker mínimo: permite instalar la app. Todo se pide a la red (los datos siempre al día).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response('<meta name=viewport content="width=device-width"><body style="font:18px sans-serif;background:#0a1726;color:#fff;display:grid;place-items:center;height:100vh;margin:0;text-align:center;padding:20px">Sin conexión. Vuelve a abrir Christmas Love cuando tengas internet.</body>', { headers: { 'content-type': 'text/html; charset=utf-8' } })));
});
