// LAUREN — search.
//
// One tap from the header on every screen. It searches the things a shopper
// actually types: the Persian name, the colourway, the fabric, the Latin name,
// and the piece number — «۰۷» or «لارن 07» both find it.

import { PRODUCTS, CATEGORIES } from '../data.js';
import { productCard, bindCards, reveal, ICON, settleImages } from '../ui.js';
import { state } from '../store.js';
import { esc, debounce, $, $$ } from '../util.js';
import { go } from '../router.js';

const SUGGEST = ['پولوشرت', 'بافت', 'ست', 'مشکی', 'شیری', 'زیتونی', 'پیکه', 'ژاکارد'];

/** Persian users type ی/ي and ک/ك interchangeably, and may type Latin digits. */
const norm = (s) => String(s)
  .replace(/[يﻱﻲ]/g, 'ی')
  .replace(/[كﻙﻚ]/g, 'ک')
  .replace(/[أإآ]/g, 'ا')
  .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  .replace(/‌/g, ' ')      // ZWNJ — «تی‌شرت» should match «تی شرت»
  .toLowerCase()
  .trim();

function match(q) {
  const needle = norm(q);
  if (!needle) return [];
  const terms = needle.split(/\s+/).filter(Boolean);
  return PRODUCTS
    .map((p) => {
      const hay = norm([
        p.title, p.colorName, p.latin, p.fabric, p.fit, p.ref,
        CATEGORIES.find((c) => c.id === p.cat)?.name || '',
        ...(p.highlights || []),
      ].join(' '));
      // every term has to appear somewhere; earlier fields score higher
      if (!terms.every((t) => hay.includes(t))) return null;
      const head = norm(`${p.title} ${p.colorName} ${p.ref}`);
      const score = terms.reduce((n, t) => n + (head.includes(t) ? 2 : 1), 0);
      return { p, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

export default function search(ctx) {
  const q0 = ctx.query.get('q') || '';
  const recent = state.recent.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean).slice(0, 4);

  const html = `
  <div class="wrap page-top">
    <span class="eyebrow">جست‌وجو</span>
    <h1 class="t-h1" style="margin-block:var(--s2) var(--s5)">چه چیزی می‌خواهید؟</h1>

    <div class="searchbox">
      <span class="searchbox__i">${ICON.search}</span>
      <input id="q" type="search" value="${esc(q0)}" autocomplete="off"
             placeholder="نام محصول، رنگ، جنس یا شماره‌ی قطعه…"
             aria-label="جست‌وجو در محصولات">
      <button class="searchbox__x" data-clear aria-label="پاک کردن" ${q0 ? '' : 'hidden'}>${ICON.close}</button>
    </div>

    <div class="chips" data-suggest style="margin-block-start:var(--s4)">
      ${SUGGEST.map((t) => `<button class="chip" data-term="${esc(t)}">${esc(t)}</button>`).join('')}
    </div>

    <div data-results style="margin-block-start:var(--s7)"></div>

    ${recent.length ? `
    <section class="sec sec--tight" data-recent>
      <div class="sec__head"><div>
        <span class="eyebrow">اخیراً دیده‌اید</span>
        <h2 class="t-h2">برگردید سرِ همان‌ها</h2>
      </div></div>
      <div class="grid" data-cards>${recent.map((p) => productCard(p)).join('')}</div>
    </section>` : ''}
  </div>`;

  return {
    html,
    mount(root) {
      const input = $('#q', root);
      const out = $('[data-results]', root);
      const clear = $('[data-clear]', root);
      const recentBlock = $('[data-recent]', root);

      const paint = (q) => {
        clear.hidden = !q;
        if (recentBlock) recentBlock.hidden = !!q;
        if (!q.trim()) { out.innerHTML = ''; return; }
        const hits = match(q);
        out.innerHTML = hits.length ? `
          <p class="t-small" style="margin-block-end:var(--s4)">
            ${hits.length} نتیجه برای «${esc(q)}»
          </p>
          <div class="grid" data-cards>${hits.map((p) => productCard(p)).join('')}</div>`
        : `
          <div class="empty" style="padding-block:var(--s7)">
            ${ICON.search}
            <h3>چیزی پیدا نشد</h3>
            <p class="t-small" style="max-width:34ch;margin-inline:auto">
              برای «${esc(q)}» نتیجه‌ای نبود. یکی از دسته‌ها را ببینید یا در واتساپ بپرسید —
              اگر موجود باشد برایتان می‌آوریم.
            </p>
            <div style="display:flex;gap:var(--s2);justify-content:center;flex-wrap:wrap;margin-block-start:var(--s5)">
              <a class="btn btn--sm" href="#/shop">همه‌ی محصولات</a>
              <a class="btn btn--ghost btn--sm" href="#/contact">پرسیدن از فروشگاه</a>
            </div>
          </div>`;
        bindCards(out); settleImages(out);
      };

      // keep the query in the URL so a search is shareable and survives reload
      const sync = debounce((q) => {
        const target = q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search';
        if (parseHash() !== target) history.replaceState(null, '', `#${target}`);
      }, 350);
      const parseHash = () => location.hash.replace(/^#/, '');

      input.addEventListener('input', () => { paint(input.value); sync(input.value); });
      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const hits = match(input.value);
        if (hits.length === 1) go(`/p/${hits[0].id}`);   // one hit: just go there
      });
      clear.addEventListener('click', () => {
        input.value = ''; paint(''); sync(''); input.focus();
      });
      $$('[data-term]', root).forEach((b) => b.addEventListener('click', () => {
        input.value = b.dataset.term; paint(input.value); sync(input.value);
      }));

      bindCards(root); reveal(root); settleImages(root);
      paint(q0);
      // focus on desktop only — a phone keyboard covering the results is worse
      if (matchMedia('(min-width: 901px)').matches) input.focus();
    },
  };
}
