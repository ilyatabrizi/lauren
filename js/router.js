// LAUREN — hash router. Hash keeps GitHub Pages deep links working with no
// server rewrites, and keeps the PWA shell offline-navigable.

const routes = [];
let current = null;

export const route = (pattern, view) => routes.push({ pattern, view });

export function parse(hash = location.hash) {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { path: '/' + parts.join('/'), parts, query: new URLSearchParams(qs) };
}

function match(loc) {
  for (const r of routes) {
    const pp = r.pattern.split('/').filter(Boolean);
    if (pp.length !== loc.parts.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(loc.parts[i]);
      else if (pp[i] !== loc.parts[i]) { ok = false; break; }
    }
    if (ok) return { view: r.view, params };
  }
  return null;
}

let notFound = () => '<p>404</p>';
export const setNotFound = (fn) => { notFound = fn; };

const hooks = { before: [], after: [] };
export const onBefore = (fn) => hooks.before.push(fn);
export const onAfter  = (fn) => hooks.after.push(fn);

export async function render(outlet) {
  const loc = parse();
  const hit = match(loc);
  const view = hit ? hit.view : notFound;
  const ctx = { ...loc, params: hit?.params || {} };

  hooks.before.forEach((fn) => fn(ctx));

  // Let the outgoing view tear down BEFORE its markup is replaced. Firing this
  // after the new view mounts would hand its own cleanup straight back to it.
  outlet.dispatchEvent(new CustomEvent('lauren:unmount'));

  // fade the old view out, swap, fade in — cheap but reads as intentional
  outlet.style.opacity = '0';
  await new Promise((r) => setTimeout(r, current === null ? 0 : 130));

  const out = await view(ctx);
  if (typeof out === 'string') outlet.innerHTML = out;
  else if (out?.html !== undefined) {
    outlet.innerHTML = out.html;
    out.mount?.(outlet, ctx);
  }

  current = ctx.path;
  outlet.style.opacity = '1';
  hooks.after.forEach((fn) => fn(ctx, outlet));
}

let mounted = null;

export function start(outlet) {
  mounted = outlet;
  outlet.style.transition = 'opacity .22s ease';
  addEventListener('hashchange', () => render(outlet));
  render(outlet);
}

/** Re-run the current route. */
export const refresh = () => (mounted ? render(mounted) : undefined);

export const go = (to, { replace = false } = {}) => {
  const h = to.startsWith('#') ? to : '#' + to;
  const now = location.hash || '#/';
  // Assigning the hash it already has fires no hashchange, so a view that
  // navigates to itself — signing in at #/account, signing out again —
  // would sit there unchanged. Re-render by hand instead.
  if (now === h) return refresh();
  if (replace) location.replace(h);
  else location.hash = h;
};
