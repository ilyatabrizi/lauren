#!/usr/bin/env python3
"""LAUREN — end-to-end smoke test.

Walks the store the way a customer would: browse, filter, pick a size, fill
the bag, apply a coupon, check out, pay at the preview gateway, and confirm
the order and loyalty points landed. Also checks the PWA bits and that every
route renders without a console error.

    python3 scripts/e2e.py [base_url]

Needs Playwright:  pip3 install playwright && playwright install chromium
"""

import sys
import re

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8071'

ROUTES = ['/', '/shop', '/shop?cat=knit', '/shop?sort=low', '/p/polo-noir',
          '/p/set-cacao', '/about', '/contact', '/faq', '/account', '/nope']

passed, failed = [], []


def check(name, cond, detail=''):
    (passed if cond else failed).append(name)
    print(f"  {'✓' if cond else '✗'} {name}{'' if cond else '  — ' + str(detail)}")


def run(page, errors):
    # ---------------------------------------------------------- every route
    print('\nroutes')
    for r in ROUTES:
        page.goto(f'{BASE}/#{r}', wait_until='networkidle')
        page.wait_for_timeout(350)
        body = page.inner_text('#view')
        check(f'{r} renders', len(body.strip()) > 40, f'{len(body)} chars')

    # ------------------------------------------------------------- catalogue
    print('\ncatalogue')
    page.goto(f'{BASE}/#/shop', wait_until='networkidle')
    page.wait_for_timeout(400)
    check('12 products listed', page.locator('.card').count() == 12,
          page.locator('.card').count())

    page.click('[data-cat="knit"]')
    page.wait_for_timeout(500)
    check('category filter narrows the grid', page.locator('.card').count() == 2,
          page.locator('.card').count())

    page.goto(f'{BASE}/#/shop?q=%D8%B2%DB%8C%D8%AA%D9%88%D9%86%DB%8C', wait_until='networkidle')
    page.wait_for_timeout(450)
    check('search finds the olive set', page.locator('.card').count() == 1,
          page.locator('.card').count())

    # ------------------------------------------------------------- wishlist
    page.goto(f'{BASE}/#/shop', wait_until='networkidle')
    page.wait_for_timeout(400)
    page.locator('[data-fav]').first.click()
    page.wait_for_timeout(250)
    wish = page.evaluate("JSON.parse(localStorage.getItem('lauren.v1')).wish")
    check('heart saves to the wishlist', len(wish) == 1, wish)

    # ------------------------------------------------------------------ bag
    print('\nbag')
    page.goto(f'{BASE}/#/p/polo-noir', wait_until='networkidle')
    page.wait_for_timeout(450)
    page.click('[data-add]')
    page.wait_for_timeout(300)
    check('size gate blocks a bare add',
          page.evaluate("JSON.parse(localStorage.getItem('lauren.v1')).bag.length") == 0)

    page.click('[data-size="L"]')
    page.click('[data-add]')
    page.wait_for_timeout(500)
    check('drawer opens on add', page.locator('.drawer.is-open').count() == 1)

    page.locator('.drawer [data-inc]').first.click()
    page.wait_for_timeout(300)
    check('quantity steps up',
          page.evaluate("JSON.parse(localStorage.getItem('lauren.v1')).bag[0].qty") == 2)

    page.locator('.drawer [data-dec]').first.click()
    page.wait_for_timeout(300)
    check('quantity steps down',
          page.evaluate("JSON.parse(localStorage.getItem('lauren.v1')).bag[0].qty") == 1)

    page.keyboard.press('Escape')
    page.wait_for_timeout(400)
    page.goto(f'{BASE}/#/p/set-cacao', wait_until='networkidle')
    page.wait_for_timeout(450)
    page.click('[data-size="XL"]')
    page.click('[data-add]')
    page.wait_for_timeout(400)
    page.keyboard.press('Escape')
    page.wait_for_timeout(300)
    check('badge counts both lines', page.inner_text('.iconbtn__n') == '2',
          page.inner_text('.iconbtn__n'))

    # ------------------------------------------------------------- checkout
    print('\ncheckout')
    page.goto(f'{BASE}/#/checkout', wait_until='networkidle')
    page.wait_for_timeout(500)

    page.click('[data-pay]')
    page.wait_for_timeout(400)
    check('empty form is rejected', page.locator('.field.bad').count() > 0,
          page.locator('.field.bad').count())

    page.fill('[name="name"]', 'علی رضایی')
    page.fill('[name="phone"]', '0914')
    page.click('[data-pay]')
    page.wait_for_timeout(300)
    check('short phone is rejected',
          'معتبر' in page.inner_text('[data-field="phone"] .err'))

    page.fill('[name="phone"]', '09141234567')
    page.fill('[name="line"]', 'خیابان ولیعصر، کوچه ۳، پلاک ۱۲، واحد ۴')
    page.fill('[name="postal"]', '5157733123')

    page.fill('#cp', 'NOPE')
    page.click('[data-coupon]')
    page.wait_for_timeout(350)
    check('bad coupon is refused',
          page.evaluate("JSON.parse(localStorage.getItem('lauren.v1')).coupon") is None)

    page.fill('#cp', 'LAUREN10')
    page.click('[data-coupon]')
    page.wait_for_timeout(400)
    sums = page.inner_text('.summary .sums')
    check('coupon shows a discount line', 'کد تخفیف' in sums, sums.replace('\n', ' '))

    grand_before = page.evaluate("""
      (() => { const t = document.querySelectorAll('.summary .sums div');
        return t[t.length-1].innerText.replace(/\\s+/g,' '); })()""")

    page.click('[data-pay]')
    page.wait_for_timeout(700)
    check('checkout hands off to the gateway', '#/pay' in page.url, page.url)

    # -------------------------------------------------------------- gateway
    print('\ngateway')
    check('preview warning is on the gateway', page.locator('.gate__warn').count() == 1)
    check('test card is pre-filled',
          page.input_value('#pan').startswith('6037'), page.input_value('#pan'))

    page.click('[data-do]')
    page.wait_for_timeout(400)
    check('gateway asks for the OTP first', '#/pay' in page.url)

    page.click('[data-otp]')
    page.wait_for_timeout(300)
    hint = page.inner_text('[data-otphint]')
    code = re.search(r'\d{6}', hint).group(0)

    page.fill('#otp', '000000')
    page.click('[data-do]')
    page.wait_for_timeout(400)
    check('wrong OTP is rejected', '#/pay' in page.url)

    page.fill('#otp', code)
    page.click('[data-do]')
    page.wait_for_timeout(2600)
    check('payment completes', '#/thanks' in page.url, page.url)

    # ----------------------------------------------------------------- order
    print('\norder + loyalty')
    st = page.evaluate("JSON.parse(localStorage.getItem('lauren.v1'))")
    check('order recorded', len(st['orders']) == 1, len(st['orders']))
    check('bag emptied', st['bag'] == [], st['bag'])
    o = st['orders'][0]
    check('order has both lines', len(o['items']) == 2, len(o['items']))
    expected = o['totals']['sub'] - o['totals']['couponOff'] \
        - o['totals']['pointsOff'] + o['totals']['shipCost']
    check('totals add up', o['totals']['grand'] == expected,
          f"{o['totals']['grand']} vs {expected}")
    check('points awarded', st['points'] == 50 + o['earned'],
          f"{st['points']} vs {50 + o['earned']}")
    check('earned = grand / 10,000', o['earned'] == o['totals']['grand'] // 10_000,
          f"{o['earned']} vs {o['totals']['grand'] // 10_000}")
    check('confirmation shows the order id', o['id'] in page.inner_text('#view'))

    page.goto(f'{BASE}/#/account?tab=orders', wait_until='networkidle')
    page.wait_for_timeout(500)
    check('order appears in the account', o['id'] in page.inner_text('#view'))

    page.goto(f'{BASE}/#/account', wait_until='networkidle')
    page.wait_for_timeout(500)
    check('club shows the points balance', str(st['points']) in page.inner_text('.ring__c'),
          page.inner_text('.ring__c').replace('\n', ' '))

    # ------------------------------------------------------------- persistence
    page.reload(wait_until='networkidle')
    page.wait_for_timeout(600)
    st2 = page.evaluate("JSON.parse(localStorage.getItem('lauren.v1'))")
    check('state survives a reload', st2['orders'][0]['id'] == o['id'])

    # -------------------------------------------------------------------- pwa
    print('\npwa')
    man = page.evaluate("""async () => {
      const r = await fetch('manifest.webmanifest'); return r.ok ? await r.json() : null; }""")
    check('manifest is served', bool(man))
    check('manifest is standalone + rtl',
          man and man['display'] == 'standalone' and man['dir'] == 'rtl')
    check('manifest has a maskable icon',
          man and any(i.get('purpose') == 'maskable' for i in man['icons']))
    sw = page.evaluate("async () => !!(await navigator.serviceWorker.getRegistration())")
    check('service worker registered', sw)

    # ------------------------------------------------------------ typography
    print('\npersian rendering')
    page.goto(f'{BASE}/#/shop', wait_until='networkidle')
    page.wait_for_timeout(500)
    check('page is RTL', page.get_attribute('html', 'dir') == 'rtl')
    fam = page.evaluate("getComputedStyle(document.querySelector('.card__title')).fontFamily")
    check('Persian text uses YekanX', 'YekanX' in fam, fam)
    loaded = page.evaluate("document.fonts.check('16px YekanX')")
    check('YekanX actually loaded', loaded)
    price = page.inner_text('.card__price b')
    check('prices use the Persian thousands mark', '٬' in price, price)
    check('no unresolved template braces in the DOM',
          '${' not in page.inner_text('body'))

    print('\nconsole')
    check('no console errors', not errors, errors[:3])


CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'


def launch(pw):
    """Prefer Playwright's own Chromium; fall back to the system Chrome so
    this runs without `playwright install`."""
    try:
        return pw.chromium.launch()
    except Exception:
        import pathlib
        if pathlib.Path(CHROME).exists():
            return pw.chromium.launch(executable_path=CHROME)
        raise


with sync_playwright() as pw:
    browser = launch(pw)
    ctx = browser.new_context(viewport={'width': 1400, 'height': 900},
                              locale='fa-IR')
    page = ctx.new_page()
    errs = []
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errs.append(str(e)))
    try:
        run(page, errs)
    finally:
        browser.close()

print(f"\n{len(passed)} passed, {len(failed)} failed")
if failed:
    print('failed: ' + ', '.join(failed))
sys.exit(1 if failed else 0)
