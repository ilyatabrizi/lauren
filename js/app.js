// LAUREN — app shell: header, mobile menu, tab bar, routing, PWA install.

import { BRAND } from './config.js';
import { route, start, setNotFound, onAfter, parse } from './router.js';
import { bagCount, subscribe } from './store.js';
import { ICON, reveal, settleImages } from './ui.js';
import { initBag, openBag } from './bag.js';
import { $, $$, scrollTop, esc } from './util.js';
import { logoSvg, markSvg } from './brand.js';

import home from './views/home.js';
import shop from './views/shop.js';
import product from './views/product.js';
import checkout from './views/checkout.js';
import pay from './views/pay.js';
import thanks from './views/thanks.js';
import account from './views/account.js';
import { about, contact, faq, notFound } from './views/pages.js';

/* ---------------------------------------------------------------- chrome -- */
const NAV = [
  { href: '#/shop',            label: 'فروشگاه' },
  { href: '#/shop?cat=polo',   label: 'پولوشرت' },
  { href: '#/shop?cat=knit',   label: 'بافت' },
  { href: '#/shop?cat=set',    label: 'ست' },
  { href: '#/about',           label: 'درباره‌ی لارن' },
  { href: '#/contact',         label: 'تماس' },
];

function chrome() {
  document.body.insertAdjacentHTML('afterbegin', `
  <div class="topbar">
  <header class="hdr">
    <div class="hdr__in">
      <nav class="nav">
        ${NAV.map((n) => `<a href="${n.href}">${esc(n.label)}</a>`).join('')}
      </nav>
      <button class="iconbtn burger" data-menu aria-label="منو">${ICON.menu}</button>
      <a class="hdr__mark" href="#/" aria-label="${BRAND.name}">${logoSvg({ label: BRAND.name })}</a>
      <div class="hdr__act">
        <a class="iconbtn" href="#/shop" aria-label="جست‌وجو">${ICON.search}</a>
        <a class="iconbtn" href="#/account?tab=wish" aria-label="علاقه‌مندی‌ها">${ICON.heart}</a>
        <a class="iconbtn" href="#/account" aria-label="حساب کاربری">${ICON.user}</a>
        <button class="iconbtn" data-bag aria-label="سبد خرید">
          ${ICON.bag}<span class="iconbtn__n" data-count>0</span>
        </button>
      </div>
    </div>
  </header>

  <div class="mmenu" data-mmenu>
    <button class="iconbtn mmenu__close" data-mclose aria-label="بستن">${ICON.close}</button>
    <nav>
      <a href="#/">خانه</a>
      ${NAV.map((n, i) => `<a href="${n.href}" style="animation-delay:${(i + 1) * 55}ms">${esc(n.label)}</a>`).join('')}
      <a href="#/faq" style="animation-delay:${(NAV.length + 1) * 55}ms">سوال‌های پرتکرار</a>
    </nav>
    <div class="mmenu__ft">
      <span>${esc(BRAND.address)}</span>
      <a class="lat" dir="ltr" href="https://instagram.com/${BRAND.instagram}" target="_blank" rel="noopener">@${BRAND.instagram}</a>
    </div>
  </div>`);

  document.body.insertAdjacentHTML('beforeend', `
  <footer class="ft">
    <div class="wrap">
      <div class="ft__grid">
        <div>
          <div class="ft__logo">${logoSvg({ label: BRAND.name })}</div>
          <p class="t-fine" style="max-width:34ch">${esc(BRAND.taglineFa)} — منتخبی از بهترین برندهای ترکیه، در قلب تبریز.</p>
          <div class="socials">
            <a href="https://instagram.com/${BRAND.instagram}" target="_blank" rel="noopener" aria-label="اینستاگرام">${ICON.insta}</a>
            <a href="https://wa.me/${BRAND.whatsapp}" target="_blank" rel="noopener" aria-label="واتساپ">${ICON.wa}</a>
            <a href="${BRAND.mapUrl}" target="_blank" rel="noopener" aria-label="نقشه">${ICON.pin}</a>
          </div>
        </div>
        <div>
          <h4>فروشگاه</h4>
          <ul>
            <li><a href="#/shop">همه‌ی محصولات</a></li>
            <li><a href="#/shop?cat=polo">پولوشرت</a></li>
            <li><a href="#/shop?cat=knit">بافت</a></li>
            <li><a href="#/shop?cat=set">ست‌ها</a></li>
            <li><a href="#/shop?sort=new">تازه‌رسیده‌ها</a></li>
          </ul>
        </div>
        <div>
          <h4>حساب</h4>
          <ul>
            <li><a href="#/account">باشگاه لارن</a></li>
            <li><a href="#/account?tab=orders">سفارش‌های من</a></li>
            <li><a href="#/account?tab=wish">علاقه‌مندی‌ها</a></li>
            <li><a href="#/faq">سوال‌های پرتکرار</a></li>
          </ul>
        </div>
        <div>
          <h4>فروشگاه حضوری</h4>
          <ul>
            <li>${esc(BRAND.address)}</li>
            <li>${esc(BRAND.hours)}</li>
            <li><a class="lat" dir="ltr" href="https://wa.me/${BRAND.whatsapp}">+${BRAND.whatsapp}</a></li>
            <li><a class="lat" dir="ltr" href="https://instagram.com/${BRAND.instagramWomen}">@${BRAND.instagramWomen}</a></li>
          </ul>
        </div>
      </div>
      <div class="ft__bot">
        <span>© ${new Date().getFullYear()} ${BRAND.name} — تمام حقوق محفوظ است.</span>
        <span class="lat">${esc(BRAND.tagline)}</span>
      </div>
    </div>
  </footer>

  <nav class="tabbar">
    <a href="#/" data-tabnav="/">${ICON.home}<span>خانه</span></a>
    <a href="#/shop" data-tabnav="/shop">${ICON.grid}<span>فروشگاه</span></a>
    <a href="#/checkout" data-tabnav="/checkout" data-tabbag>${ICON.bag}<span>سبد</span>
      <span class="tabbar__n" data-count hidden>0</span></a>
    <a href="#/account" data-tabnav="/account">${ICON.user}<span>پروفایل</span></a>
  </nav>

  <div class="a2hs" data-a2hs>
    <img src="assets/icons/icon-192.png" alt="" width="40" height="40">
    <div style="flex:1">
      <b>لارن را روی گوشی نصب کنید</b>
      <p>دسترسی سریع، حتی بدون اینترنت.</p>
    </div>
    <button class="btn btn--sm" data-install>نصب</button>
    <button class="iconbtn" data-a2hs-x aria-label="بستن" style="width:32px;height:32px">${ICON.close}</button>
  </div>`);
}

/* ---------------------------------------------------------------- badges -- */
function paintCounts(animate = false) {
  const n = bagCount();
  $$('[data-count]').forEach((node) => {
    node.textContent = n;
    if (node.classList.contains('iconbtn__n')) {
      node.classList.toggle('is-on', n > 0);
      if (animate && n > 0) {
        node.classList.remove('pop');
        void node.offsetWidth;
        node.classList.add('pop');
      }
    } else {
      node.hidden = n === 0;
    }
  });
}

/* ------------------------------------------------------------------ nav -- */
function markActive(ctx) {
  const path = ctx.path;
  const cat = ctx.query.get('cat') || '';
  $$('.nav a').forEach((a) => {
    const t = parse(a.getAttribute('href'));
    const on = t.path === path && (t.query.get('cat') || '') === cat;
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  $$('[data-tabnav]').forEach((a) => {
    const on = a.dataset.tabnav === path ||
               (a.dataset.tabnav === '/shop' && path.startsWith('/p/'));
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

/* ------------------------------------------------------------------ pwa -- */
function initPWA() {
  if ('serviceWorker' in navigator) {
    addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline-only nicety */ });
    });
  }

  const bar = $('[data-a2hs]');
  const dismissed = localStorage.getItem('lauren.a2hs') === 'no';
  let deferred = null;

  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    if (!dismissed) setTimeout(() => bar.classList.add('is-on'), 4000);
  });

  $('[data-install]')?.addEventListener('click', async () => {
    bar.classList.remove('is-on');
    if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; }
  });

  $('[data-a2hs-x]')?.addEventListener('click', () => {
    bar.classList.remove('is-on');
    localStorage.setItem('lauren.a2hs', 'no');
  });

  // iOS has no beforeinstallprompt — show the Share-sheet hint instead
  const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (iOS && !standalone && !dismissed) {
    $('[data-install]').remove();
    bar.querySelector('p').textContent = 'دکمه‌ی اشتراک‌گذاری ← «Add to Home Screen»';
    setTimeout(() => bar.classList.add('is-on'), 5000);
  }
}

/* ----------------------------------------------------------------- boot -- */
function boot() {
  chrome();
  initBag();
  document.body.classList.add('has-tabbar');

  const outlet = $('#view');

  route('/',            home);
  route('/shop',        shop);
  route('/p/:id',       product);
  route('/checkout',    checkout);
  route('/pay',         pay);
  route('/thanks',      thanks);
  route('/account',     account);
  route('/about',       about);
  route('/contact',     contact);
  route('/faq',         faq);
  setNotFound(notFound);

  // header state
  const hdr = $('.hdr');
  const onScroll = () => hdr.classList.toggle('is-stuck', scrollY > 12);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // bag
  $('[data-bag]').addEventListener('click', openBag);
  $('[data-tabbag]').addEventListener('click', (e) => {
    if (bagCount()) { e.preventDefault(); openBag(); }
  });

  // mobile menu
  const menu = $('[data-mmenu]');
  const closeMenu = () => { menu.classList.remove('is-open'); document.body.classList.remove('is-locked'); };
  $('[data-menu]').addEventListener('click', () => {
    menu.classList.add('is-open'); document.body.classList.add('is-locked');
  });
  $('[data-mclose]').addEventListener('click', closeMenu);
  $$('[data-mmenu] a').forEach((a) => a.addEventListener('click', closeMenu));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  // counts
  paintCounts();
  subscribe((reason) => paintCounts(String(reason).startsWith('bag')));

  // after each render
  onAfter((ctx, root) => {
    document.body.classList.toggle('on-gateway', ctx.path === '/pay');
    markActive(ctx);
    scrollTop();
    reveal(root);
    settleImages(root);
    document.title = {
      '/': `${BRAND.name} — ${BRAND.taglineFa}`,
      '/shop': `فروشگاه | ${BRAND.name}`,
      '/checkout': `تسویه حساب | ${BRAND.name}`,
      '/pay': `درگاه پرداخت | ${BRAND.name}`,
      '/account': `حساب کاربری | ${BRAND.name}`,
      '/about': `درباره‌ی لارن | ${BRAND.name}`,
      '/contact': `تماس | ${BRAND.name}`,
      '/faq': `راهنما | ${BRAND.name}`,
    }[ctx.path] || `${BRAND.name} | لارن`;
  });

  start(outlet);
  initPWA();
  document.documentElement.classList.add('booted');
}

boot();
