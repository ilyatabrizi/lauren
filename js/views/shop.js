// LAUREN — catalogue listing with filters, sort and search.

import { PRODUCTS, CATEGORIES } from '../data.js';
import { productCard, bindCards, bindAccordions, reveal, ICON } from '../ui.js';
import { esc, $, $$ } from '../util.js';
import { go } from '../router.js';

const SORTS = [
  { id: 'featured', label: 'پیشنهاد لارن' },
  { id: 'new',      label: 'جدیدترین' },
  { id: 'best',     label: 'پرفروش‌ترین' },
  { id: 'low',      label: 'ارزان‌ترین' },
  { id: 'high',     label: 'گران‌ترین' },
];

const RANK = { new: 0, best: 1, sale: 2 };

function apply({ cat, sort, q }) {
  let list = PRODUCTS.slice();
  if (cat && cat !== 'all') list = list.filter((p) => p.cat === cat);
  if (q) {
    const needle = q.trim().toLowerCase();
    list = list.filter((p) => (
      `${p.title} ${p.colorName} ${p.latin} ${p.fabric}`.toLowerCase().includes(needle)
    ));
  }
  switch (sort) {
    case 'low':  list.sort((a, b) => a.price - b.price); break;
    case 'high': list.sort((a, b) => b.price - a.price); break;
    case 'new':  list.sort((a, b) => (a.badge === 'new' ? -1 : 1) - (b.badge === 'new' ? -1 : 1)); break;
    case 'best': list.sort((a, b) => (a.badge === 'best' ? -1 : 1) - (b.badge === 'best' ? -1 : 1)); break;
    default:     list.sort((a, b) => (RANK[a.badge] ?? 9) - (RANK[b.badge] ?? 9));
  }
  return list;
}

export default function shop(ctx) {
  const cat  = ctx.query.get('cat')  || 'all';
  const sort = ctx.query.get('sort') || 'featured';
  const q    = ctx.query.get('q')    || '';
  const list = apply({ cat, sort, q });
  const active = CATEGORIES.find((c) => c.id === cat) || CATEGORIES[0];

  const html = `
  <div class="wrap page-top">
    <span class="eyebrow">فروشگاه</span>
    <h1 class="t-h1" style="margin-block:var(--s2) var(--s1)">${esc(active.name)}</h1>
    <p class="t-small">${list.length} محصول${q ? ` برای «${esc(q)}»` : ''}</p>
  </div>

  <div class="shopbar" style="margin-block-start:var(--s5)">
    <div class="shopbar__in">
      <div class="shopbar__cats">
        ${CATEGORIES.map((c) => `
          <button class="chip ${c.id === cat ? 'is-on' : ''}" data-cat="${c.id}">${esc(c.name)}</button>
        `).join('')}
      </div>
      <button class="iconbtn" data-search aria-label="جست‌وجو">${ICON.search}</button>
      <select class="sel" data-sort aria-label="مرتب‌سازی">
        ${SORTS.map((s) => `<option value="${s.id}" ${s.id === sort ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}
      </select>
    </div>
    <div class="shopbar__in" data-searchbar hidden style="padding-block-start:10px">
      <input class="shopbar__search" id="shop-q" type="search" value="${esc(q)}"
             placeholder="نام محصول، رنگ یا جنس…" aria-label="جست‌وجو در محصولات">
    </div>
  </div>

  <section class="sec sec--tight wrap">
    ${list.length ? `
      <div class="grid" data-cards>
        ${list.map((p, i) => `<div class="rv rv-d${i % 4}">${productCard(p, { eager: i < 4 })}</div>`).join('')}
      </div>` : `
      <div class="empty">
        ${ICON.search}
        <h3>چیزی پیدا نشد</h3>
        <p class="t-small" style="max-width:34ch;margin-inline:auto">
          فیلترها را بردارید یا عبارت دیگری را امتحان کنید. برای مشورت هم می‌توانید در واتساپ پیام بدهید.
        </p>
        <a class="btn btn--ghost btn--sm" href="#/shop" style="margin-block-start:var(--s5)">دیدن همه‌ی محصولات</a>
      </div>`}
  </section>`;

  return {
    html,
    mount(root) {
      bindCards(root);
      bindAccordions(root);
      reveal(root);

      const nav = (patch) => {
        const p = new URLSearchParams({ cat, sort, ...(q ? { q } : {}), ...patch });
        for (const [k, v] of [...p]) if (!v || v === 'all' && k === 'cat' || v === 'featured' && k === 'sort') p.delete(k);
        go('/shop' + (p.toString() ? `?${p}` : ''));
      };

      $$('[data-cat]', root).forEach((b) =>
        b.addEventListener('click', () => nav({ cat: b.dataset.cat })));

      $('[data-sort]', root)?.addEventListener('change', (e) => nav({ sort: e.target.value }));

      const bar = $('[data-searchbar]', root);
      const input = $('#shop-q', root);
      $('[data-search]', root)?.addEventListener('click', () => {
        bar.hidden = !bar.hidden;
        if (!bar.hidden) input.focus();
      });
      if (q) bar.hidden = false;
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') nav({ q: input.value.trim() });
      });
      input?.addEventListener('search', () => nav({ q: input.value.trim() }));
    },
  };
}
