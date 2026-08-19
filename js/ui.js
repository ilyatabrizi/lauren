// LAUREN — reusable UI pieces: icons, toasts, product cards, reveal, images.

import { LQIP } from './placeholders.js';
import { toman, esc, $, $$ } from './util.js';
import { inWish, toggleWish, reviewSummary } from './store.js';

/* ---------------------------------------------------------------- icons -- */
const svg = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const ICON = {
  bag:    svg('<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  heart:  svg('<path d="M12 20s-7-4.4-7-9.3A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.7C19 15.6 12 20 12 20Z"/>'),
  user:   svg('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.3-3.4 4-5 7-5s5.7 1.6 7 5"/>'),
  home:   svg('<path d="M4 11 12 4l8 7"/><path d="M6.5 10v9h11v-9"/>'),
  grid:   svg('<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>'),
  menu:   svg('<path d="M4 8h16M4 16h16"/>'),
  close:  svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  down:   svg('<path d="m6 9 6 6 6-6"/>'),
  back:   svg('<path d="m14 6-6 6 6 6"/>'),
  fwd:    svg('<path d="m10 6 6 6-6 6"/>'),
  check:  svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  truck:  svg('<path d="M3 7h10v9H3z"/><path d="M13 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>'),
  shield: svg('<path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 8.9-4.1-1.5-7-4.7-7-8.9V6l7-2.5Z"/>'),
  swap:   svg('<path d="M4 8h13l-3-3"/><path d="M20 16H7l3 3"/>'),
  spark:  svg('<path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.2 10.2 12.6 4.5 10.8 10.2 9 12 3.5Z"/>'),
  pin:    svg('<path d="M12 21s6.5-5.6 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.3"/>'),
  phone:  svg('<path d="M6 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 4.5 5.1 1.5 1.5 0 0 1 6 3.5Z"/>'),
  clock:  svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  insta:  svg('<rect x="4" y="4" width="16" height="16" rx="4.6"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r=".9" fill="currentColor"/>'),
  wa:     svg('<path d="M4.5 19.5 5.8 15A7.5 7.5 0 1 1 9 18.3l-4.5 1.2Z"/><path d="M9.4 9.2c.3 1.6 2 3.3 3.6 3.6l.9-1.1 1.7.8v1.2c-.6.6-1.8.5-3.2-.2a7.6 7.6 0 0 1-3.5-3.5c-.7-1.4-.8-2.6-.2-3.2h1.2l.8 1.7-1.3.7Z"/>'),
  card:   svg('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>'),
  gift:   svg('<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M4 13h16M12 9v11"/><path d="M12 9S9.5 4.5 7.5 6 12 9 12 9Zm0 0s2.5-4.5 4.5-3S12 9 12 9Z"/>'),
  box:    svg('<path d="m12 3 8 4.2V17L12 21l-8-4V7.2L12 3Z"/><path d="M4 7.2 12 11l8-3.8M12 11v10"/>'),
  logout: svg('<path d="M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4"/><path d="M10 8 6 12l4 4M6 12h9"/>'),
  info:   svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8.2v.1"/>'),
  trash:  svg('<path d="M5 7h14M9 7V5.5h6V7M7 7l.8 12h8.4L17 7"/>'),
  plus:   svg('<path d="M12 6v12M6 12h12"/>'),
  minus:  svg('<path d="M6 12h12"/>'),
  ruler:  svg('<path d="m3.5 14.5 11-11 5 5-11 11-5-5Z"/><path d="m7 11 1.8 1.8M10 8l1.8 1.8M13 5l1.8 1.8"/>'),
  star:   svg('<path d="m12 4 2.4 5 5.6.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.6-.8L12 4Z"/>'),
};

/* ------------------------------------------------------- overlay history -- */
/* On a phone, Back is how you dismiss things. Without this, pressing it while
   the bag drawer or the lightbox is open navigates the page underneath and
   leaves the overlay sitting on top of the wrong screen.
   Each overlay pushes a history entry on open and consumes it on close, so
   Back closes exactly one layer and never leaves the stack out of step. */
const layers = [];

export function pushOverlay(name, close) {
  layers.push({ name, close });
  // same URL, new entry — no hashchange, so the router does not re-render
  history.pushState({ laurenOverlay: name, depth: layers.length }, '');
}

/** Call from the overlay's own close path (X, scrim, Escape). */
export function popOverlay(name) {
  const i = layers.findIndex((l) => l.name === name);
  if (i < 0) return false;
  layers.splice(i, 1);
  // rewind the entry we added, without letting popstate close it twice
  skipNextPop = true;
  history.back();
  return true;
}

let skipNextPop = false;
addEventListener('popstate', () => {
  if (skipNextPop) { skipNextPop = false; return; }
  const top = layers.pop();
  if (top) top.close();
});

/* --------------------------------------------------------------- toasts -- */
let toastHost;
export function toast(msg, icon = 'check') {
  toastHost ||= document.body.appendChild(
    Object.assign(document.createElement('div'), { className: 'toast' }));
  const node = document.createElement('div');
  node.className = 'toast__i';
  node.innerHTML = `${ICON[icon] || ''}<span>${esc(msg)}</span>`;
  toastHost.appendChild(node);
  setTimeout(() => {
    node.classList.add('out');
    node.addEventListener('animationend', () => node.remove(), { once: true });
  }, 2600);
}

/* ------------------------------------------------------------ blur-up ---- */
/** <img> that fades in over its own tiny base64 preview. */
export function photo(key, alt, { sizes = '', cls = '', eager = false } = {}) {
  const ph = LQIP[key] || '';
  return `<div class="ph ${cls}" style="background-image:url(${ph});width:100%;height:100%">
    <img src="assets/products/${key}.jpg" alt="${esc(alt)}"
         ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"
         ${sizes ? `sizes="${sizes}"` : ''} onload="this.classList.add('ready')">
  </div>`;
}

/** Anything already in the DOM that missed its onload (cached images). */
export function settleImages(root = document) {
  $$('.ph > img', root).forEach((img) => {
    if (img.complete) img.classList.add('ready');
  });
}

/* --------------------------------------------------------- product card -- */
const TAG = {
  new:  { cls: 'tag',           text: 'جدید' },
  sale: { cls: 'tag tag--quiet', text: 'قیمت ویژه' },
  best: { cls: 'tag tag--quiet', text: 'پرفروش' },
};

/** A product card is a photograph inside a white vitrine well with a mount
 *  margin. The photography is soft phone-grade; framed small it reads as
 *  something under glass rather than something enlarged badly. */
export function productCard(p, { eager = false } = {}) {
  const t = TAG[p.badge];
  const alt = p.gallery[1];
  return `
  <article class="card" data-card="${p.id}">
    <a class="card__well" href="#/p/${p.id}" aria-label="${esc(p.title)} — ${esc(p.colorName)}">
      <div class="card__img">
        ${photo(p.gallery[0], `${p.title} ${p.colorName}`, { eager, sizes: '(max-width:759px) 45vw, (max-width:1159px) 30vw, 22vw' })}
        ${alt ? `<img class="alt" src="assets/products/${alt}.jpg" alt="" loading="lazy" decoding="async">` : ''}
      </div>
      <div class="card__tags">
        ${t ? `<span class="${t.cls}">${t.text}</span>` : ''}
      </div>
    </a>
    <button class="card__fav ${inWish(p.id) ? 'is-on' : ''}" data-fav="${p.id}"
            aria-label="افزودن به علاقه‌مندی‌ها" aria-pressed="${inWish(p.id)}">${ICON.heart}</button>
    <a class="card__body" href="#/p/${p.id}">
      <span class="card__ref">لارن <span class="num">${esc(p.ref)}</span></span>
      <h3 class="card__title">${esc(p.title)}</h3>
      <span class="card__meta">${esc(p.colorName)}</span>
      ${(() => {
        // Nothing at all when the garment has no REAL reviews — a «بدون امتیاز»
        // placeholder is noise, and samples never reach an aggregate.
        const s = reviewSummary(p.family);
        return s.count ? `<span class="card__rate">${stars(Math.round(s.avg))}
          <span>${s.count}</span></span>` : '';
      })()}
      <div class="card__price">
        <span>${toman(p.price)}</span>
        ${p.compareAt ? `<s class="card__was">${toman(p.compareAt)}</s>` : ''}
      </div>
    </a>
  </article>`;
}

/** A row of five stars. Filled ones are INK, not accent: the PDP's accent
 *  budget is already spent on .pdp__ref and the four .trust icons. */
export const stars = (n, cls = '') => `<span class="stars ${cls}" role="img"
  aria-label="${n} از ۵ ستاره">${
  [1, 2, 3, 4, 5].map((i) => `<span aria-hidden="true" class="${i <= n ? 'is-on' : ''}">${ICON.star}</span>`).join('')
}</span>`;

/** Wire the heart buttons inside a freshly rendered container. */
export function bindCards(root = document) {
  $$('[data-fav]', root).forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const on = toggleWish(btn.dataset.fav);
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));
      toast(on ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد', 'heart');
    });
  });
  settleImages(root);
}

/* --------------------------------------------------------------- reveal -- */
let io;
export function reveal(root = document) {
  if (!('IntersectionObserver' in window)) {
    $$('.rv', root).forEach((n) => n.classList.add('in'));
    return;
  }
  io ||= new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  $$('.rv:not(.in)', root).forEach((n) => io.observe(n));
}

/* ------------------------------------------------------------ accordion -- */
export function bindAccordions(root = document) {
  $$('.acc__btn', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.acc__item');
      const open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
}

export function accordion(items) {
  return `<div class="acc">${items.map((it) => `
    <div class="acc__item ${it.open ? 'is-open' : ''}">
      <button class="acc__btn" aria-expanded="${!!it.open}">
        <span>${esc(it.title)}</span>${ICON.down}
      </button>
      <div class="acc__body"><div>${it.body}</div></div>
    </div>`).join('')}</div>`;
}

/* ------------------------------------------------------------- lightbox -- */
let lb;
export function lightbox(src, alt = '') {
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `<img alt=""><button class="iconbtn" aria-label="بستن">${ICON.close}</button>`;
    lb.addEventListener('click', () => close());
    document.body.appendChild(lb);
  }
  const close = (fromHistory = false) => {
    lb.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    if (!fromHistory) popOverlay('lightbox');
  };
  lb.querySelector('img').src = src;
  lb.querySelector('img').alt = alt;
  lb.classList.add('is-open');
  document.body.classList.add('is-locked');
  pushOverlay('lightbox', () => close(true));
  document.addEventListener('keydown', function esc2(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc2); }
  });
}

/* ----------------------------------------------------------- size charts -- */
/** One renderer, so the product accordion and /size-guide can never drift. */
export function sizeTables(charts, note) {
  return charts.map((c) => `
    <div style="margin-block-end:var(--s4)">
      <b style="display:block;font-size:13px;font-weight:500;margin-block-end:var(--s2)">${esc(c.name)}</b>
      <div style="overflow-x:auto">
        <table class="tbl">
          <thead><tr>${c.cols.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
          <tbody>${c.rows.map((r) => `<tr>${r.map((v, i) =>
            `<td${i === 0 ? ' class="lat" style="color:var(--ink);font-weight:500"' : ''}>${esc(v)}</td>`
          ).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`).join('') + (note ? `<p class="t-fine">${esc(note)}</p>` : '');
}

/* --------------------------------------------------------------- fields -- */
export function field(name, label, opts = {}) {
  const { type = 'text', placeholder = '', value = '', wide = false,
          inputmode = '', maxlength = '', dir = '', readonly = false,
          autocomplete = '' } = opts;
  const tag = type === 'textarea'
    ? `<textarea id="f-${name}" name="${name}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`
    : `<input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}"
              placeholder="${esc(placeholder)}"
              ${inputmode ? `inputmode="${inputmode}"` : ''}
              ${maxlength ? `maxlength="${maxlength}"` : ''}
              ${autocomplete ? `autocomplete="${autocomplete}"` : ''}
              ${readonly ? 'readonly' : ''}
              ${dir ? `dir="${dir}"` : ''}>`;
  return `<div class="field ${wide ? 'field--wide' : ''}" data-field="${name}">
    <label for="f-${name}">${esc(label)}</label>${tag}<span class="err"></span>
  </div>`;
}

export function fieldError(root, name, msg) {
  const f = $(`[data-field="${name}"]`, root);
  if (!f) return;
  f.classList.toggle('bad', !!msg);
  $('.err', f).textContent = msg || '';
}

export function readForm(root) {
  const out = {};
  $$('input[name], textarea[name], select[name]', root).forEach((i) => {
    out[i.name] = i.value.trim();
  });
  return out;
}
