/* LAUREN — service worker.
 * App shell is precached so the store opens instantly and works offline;
 * product photos fill a capped runtime cache as they are browsed. */

const VERSION = 'lauren-v4';
const SHELL = `${VERSION}-shell`;
const MEDIA = `${VERSION}-media`;
const MEDIA_MAX = 90;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/router.js',
  './js/store.js',
  './js/ui.js',
  './js/util.js',
  './js/bag.js',
  './js/config.js',
  './js/data.js',
  './js/placeholders.js',
  './js/brand.js',
  './js/views/home.js',
  './js/views/shop.js',
  './js/views/product.js',
  './js/views/checkout.js',
  './js/views/pay.js',
  './js/views/thanks.js',
  './js/views/account.js',
  './js/views/pages.js',
  './js/views/bag.js',
  './js/views/search.js',
  './js/views/more.js',
  './assets/fonts/IRANYekanXFaNum-Light.woff2',
  './assets/fonts/IRANYekanXFaNum-Regular.woff2',
  './assets/fonts/IRANYekanXFaNum-Medium.woff2',
  './assets/fonts/IRANYekanXFaNum-DemiBold.woff2',
  './assets/fonts/IRANYekanX-Regular.woff2',
  './assets/fonts/IRANYekanX-Medium.woff2',
  './assets/brand/logo.svg',
  './assets/brand/mark.svg',
  './assets/icons/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // addAll is all-or-nothing; add individually so one 404 can't break install
    await Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k !== SHELL && k !== MEDIA)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
  }
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // navigations — serve the shell, fall back to network
  if (request.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(SHELL);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch {
        return (await caches.match('./index.html')) ||
               (await caches.match('./')) ||
               Response.error();
      }
    })());
    return;
  }

  // photography, fonts, icons — immutable enough to serve from cache first
  const isMedia = /\/assets\/(products|brand|icons|fonts)\//.test(url.pathname);
  if (isMedia) {
    e.respondWith((async () => {
      const cache = await caches.open(MEDIA);
      const hit = await cache.match(request);
      if (hit) return hit;
      try {
        const res = await fetch(request);
        if (res.ok) { cache.put(request, res.clone()); trim(MEDIA, MEDIA_MAX); }
        return res;
      } catch {
        return hit || Response.error();
      }
    })());
    return;
  }

  // code and data — network first, so a redeploy lands on the next load and
  // an offline visit still gets the last good copy
  e.respondWith((async () => {
    const cache = await caches.open(SHELL);
    try {
      const res = await fetch(request);
      if (res.ok) cache.put(request, res.clone());
      return res;
    } catch {
      return (await cache.match(request)) || Response.error();
    }
  })());
});
