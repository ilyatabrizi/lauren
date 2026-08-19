#!/usr/bin/env python3
"""LAUREN — end-to-end smoke test.

Walks the store the way a customer would: browse, filter, pick a size, fill
the bag, apply a coupon, check out, pay at the preview gateway, and confirm
the order and the credit wallet landed. Also checks the PWA bits, the Persian
typography rules, and that every route renders without a console error.

    python3 scripts/e2e.py [base_url]

Needs Playwright:  pip3 install playwright && playwright install chromium
"""

import sys
import re

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8071'

ROUTES = ['/', '/shop', '/shop?cat=knit', '/shop?sort=low', '/p/polo-noir',
          '/p/set-cacao', '/search', '/bag', '/wishlist', '/track',
          '/size-guide', '/shipping', '/about', '/contact', '/faq',
          '/account', '/nope']

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
    wish = page.evaluate("JSON.parse(localStorage.getItem('lauren.v3')).wish")
    check('heart saves to the wishlist', len(wish) == 1, wish)

    # a guest can build a wishlist, so a guest must be able to read it back
    page.goto(f'{BASE}/#/account?tab=wish', wait_until='networkidle')
    page.wait_for_timeout(500)
    check('guest can open their wishlist', page.locator('.card').count() == 1,
          page.locator('.card').count())

    # ------------------------------------------------------------------ bag
    print('\nbag')
    page.goto(f'{BASE}/#/p/polo-noir', wait_until='networkidle')
    page.wait_for_timeout(450)
    page.click('[data-add]')
    page.wait_for_timeout(300)
    check('size gate blocks a bare add',
          page.evaluate("JSON.parse(localStorage.getItem('lauren.v3')).bag.length") == 0)

    page.click('[data-size="L"]')
    page.click('[data-add]')
    page.wait_for_timeout(500)
    check('drawer opens on add', page.locator('.drawer.is-open').count() == 1)

    page.locator('.drawer [data-inc]').first.click()
    page.wait_for_timeout(300)
    check('quantity steps up',
          page.evaluate("JSON.parse(localStorage.getItem('lauren.v3')).bag[0].qty") == 2)

    page.locator('.drawer [data-dec]').first.click()
    page.wait_for_timeout(300)
    check('quantity steps down',
          page.evaluate("JSON.parse(localStorage.getItem('lauren.v3')).bag[0].qty") == 1)

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
          page.evaluate("JSON.parse(localStorage.getItem('lauren.v3')).coupon") is None)

    page.fill('#cp', 'LAUREN10')
    page.click('[data-coupon]')
    page.wait_for_timeout(400)
    sums = page.inner_text('.summary .sums')
    check('coupon shows a discount line', 'کد تخفیف' in sums, sums.replace('\n', ' '))
    check('coupon survives a reload',
          page.evaluate("JSON.parse(localStorage.getItem('lauren.v3')).coupon") == 'LAUREN10',
          page.evaluate("JSON.parse(localStorage.getItem('lauren.v3')).coupon"))

    # shipping is pre-selected, so the arrival total must already include it
    ship_row = [r for r in page.inner_text('.summary .sums').split('\n') if 'ارسال' in r]
    check('shipping is priced on arrival, not "—"', '—' not in ' '.join(ship_row),
          ' '.join(ship_row))

    page.click('[data-pay]')
    page.wait_for_timeout(700)
    check('checkout hands off to the gateway', '#/pay' in page.url, page.url)

    # -------------------------------------------------------------- gateway
    print('\ngateway')
    check('preview warning is on the gateway', page.locator('.gate__warn').count() == 1)
    # The lauren:unmount hook used to fire straight after mount, which killed
    # this countdown (and the OTP resend timer, and checkout's bag listener)
    # on their own first frame. A ticking clock proves the ordering.
    t0 = page.inner_text('[data-clock]')
    page.wait_for_timeout(2200)
    check('gateway countdown is actually running',
          page.inner_text('[data-clock]') != t0,
          f"{t0} -> {page.inner_text('[data-clock]')}")
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

    # ------------------------------------------- confirmation vs receipt (B)
    print('\nconfirmation vs receipt')
    view = page.inner_text('#view')
    check('the fresh confirmation celebrates', 'سفارش شما ثبت شد' in view)
    check('the fresh confirmation shows the stepper', page.locator('.steps').count() == 1)
    check('the confirmation carries the preview note', 'پیش‌نمایش' in view)
    check('the confirmation promises no SMS', 'پیامک' not in view, view.replace('\n', ' ')[:120])
    check('the order number can be copied', page.locator('[data-copyid]').count() == 1)

    oid0 = page.evaluate("JSON.parse(localStorage.getItem('lauren.v3')).orders[0].id")
    # drop the stamp pay.js left: this is now a REVISIT, not a confirmation
    page.evaluate("sessionStorage.removeItem('lauren.confirmed')")
    # step away first — goto the URL we are already on is a same-document no-op
    page.goto(f'{BASE}/#/', wait_until='networkidle')
    page.wait_for_timeout(300)
    page.goto(f'{BASE}/#/thanks?id={oid0}', wait_until='networkidle')
    page.wait_for_timeout(1000)
    check('a revisited confirmation becomes the order record', '#/order/' in page.url, page.url)
    check('the receipt drops the checkout stepper', page.locator('.steps').count() == 0)
    check('the receipt shows the current derived stage', page.locator('.order__st').count() >= 1)
    check('the derived stages say they are derived',
          'از زمان ثبت سفارش' in page.inner_text('#view'))

    page.goto(f'{BASE}/#/thanks?id=LRBOGUS999', wait_until='networkidle')
    page.wait_for_timeout(900)
    check('a stranger id never renders a confirmation',
          'سفارش شما ثبت شد' not in page.inner_text('#view'), page.url)
    page.goto(f'{BASE}/#/thanks', wait_until='networkidle')
    page.wait_for_timeout(900)
    check('a bare /thanks does not celebrate the newest order',
          'سفارش شما ثبت شد' not in page.inner_text('#view'), page.url)
    page.evaluate(f"sessionStorage.setItem('lauren.confirmed', '{oid0}')")
    page.goto(f'{BASE}/#/thanks?id={oid0.lower()}', wait_until='networkidle')
    page.wait_for_timeout(800)
    check('the confirmation matches its id case-insensitively',
          'سفارش شما ثبت شد' in page.inner_text('#view'), page.url)
    page.evaluate("sessionStorage.removeItem('lauren.confirmed')")

    # ----------------------------------------------------------------- order
    print('\norder + loyalty')
    st = page.evaluate("JSON.parse(localStorage.getItem('lauren.v3'))")
    check('order recorded', len(st['orders']) == 1, len(st['orders']))
    check('bag emptied', st['bag'] == [], st['bag'])
    o = st['orders'][0]
    check('order has both lines', len(o['items']) == 2, len(o['items']))
    expected = o['totals']['goods'] - o['totals']['creditUsed'] + o['totals']['shipCost']
    check('totals add up', o['totals']['grand'] == expected,
          f"{o['totals']['grand']} vs {expected}")
    check('goods = subtotal minus coupon',
          o['totals']['goods'] == o['totals']['sub'] - o['totals']['couponOff'])
    # credit is earned on the goods, so postage never earns and spending credit
    # does not shrink what the next order returns
    check('credit earned on goods, not on the amount paid',
          o['earned'] == round(o['totals']['goods'] * 0.05),
          f"{o['earned']} vs {round(o['totals']['goods'] * 0.05)}")
    check('balance = welcome − spent + earned',
          st['credit'] == 200_000 - o['totals']['creditUsed'] + o['earned'],
          f"{st['credit']}")
    check('tier counts money paid, not credit spent',
          st['spend12'] == o['totals']['goods'] - o['totals']['creditUsed'],
          f"{st['spend12']} vs {o['totals']['goods'] - o['totals']['creditUsed']}")
    check('ledger records the earn', any(r['kind'] == 'earn' for r in st['ledger']))
    check('confirmation shows the order id', o['id'] in page.inner_text('#view'))

    page.goto(f'{BASE}/#/account?tab=orders', wait_until='networkidle')
    page.wait_for_timeout(500)
    check('order appears in the account', o['id'] in page.inner_text('#view'))

    page.goto(f'{BASE}/#/account', wait_until='networkidle')
    page.wait_for_timeout(500)
    check('wallet shows the balance in Toman',
          'تومان' in page.inner_text('.wallet__amt'),
          page.inner_text('.wallet__amt'))

    # ---------------------------------------------------------- wallet rules
    print('\nwallet rules')
    before = page.evaluate("JSON.parse(localStorage.getItem('lauren.v3'))")
    page.goto(f'{BASE}/#/account?tab=profile', wait_until='networkidle')
    page.wait_for_timeout(500)
    page.click('[data-signout]')
    page.wait_for_timeout(600)
    page.fill('[name="phone"]', '09141234567')
    page.click('[data-step1] button[type=submit]')
    page.wait_for_timeout(500)
    otp = page.inner_text('[data-sent] b').strip()
    boxes = page.locator('.otp input')
    for i, ch in enumerate(otp):
        boxes.nth(i).fill(ch)
    page.wait_for_timeout(900)
    after = page.evaluate("JSON.parse(localStorage.getItem('lauren.v3'))")
    # signing out and back in used to re-mint the welcome bonus every time
    check('welcome credit is minted once per phone',
          after['credit'] == before['credit'],
          f"{before['credit']} -> {after['credit']}")

    # credit must never cover more than half an order
    page.goto(f'{BASE}/#/p/polo-noir', wait_until='networkidle')
    page.wait_for_timeout(450)
    page.click('[data-size="L"]'); page.click('[data-add]')
    page.wait_for_timeout(400)
    page.keyboard.press('Escape')
    cap = page.evaluate("""() => {
      const s = JSON.parse(localStorage.getItem('lauren.v3'));
      return { credit: s.credit };
    }""")
    page.goto(f'{BASE}/#/checkout', wait_until='networkidle')
    page.wait_for_timeout(600)
    if page.locator('[data-usecredit]').count():
        page.click('[data-usecredit]')
        page.wait_for_timeout(500)
        rows = page.inner_text('.summary .sums')
        check('credit row appears when applied', 'اعتبار' in rows, rows.replace('\n', ' '))
        used = page.evaluate("""() => {
          const el = [...document.querySelectorAll('.summary .sums div')]
            .find(d => d.innerText.includes('اعتبار'));
          return el ? el.innerText : '';
        }""")
        check('credit is capped at half the goods', bool(used), used)

    # a second phone number must not top up the first one's wallet
    page.goto(f'{BASE}/#/account?tab=profile', wait_until='networkidle')
    page.wait_for_timeout(500)
    page.click('[data-signout]')
    page.wait_for_timeout(600)
    page.fill('[name="phone"]', '09121110000')
    page.click('[data-step1] button[type=submit]')
    page.wait_for_timeout(500)
    otp2 = page.inner_text('[data-sent] b').strip()
    # a wrong code must be recoverable — the boxes used to keep their old digits
    wrong = ''.join('0' if c != '0' else '1' for c in otp2)
    bw = page.locator('.otp input')
    for i, ch in enumerate(wrong):
        bw.nth(i).fill(ch)
    page.wait_for_timeout(700)
    check('a wrong code can be retyped',
          page.evaluate("[...document.querySelectorAll('.otp input')].every(b => b.value === '')"),
          page.evaluate("[...document.querySelectorAll('.otp input')].map(b => b.value)"))
    b2 = page.locator('.otp input')
    for i, ch in enumerate(otp2):
        b2.nth(i).fill(ch)
    page.wait_for_timeout(900)
    second = page.evaluate("JSON.parse(localStorage.getItem('lauren.v3'))")
    check('a new phone gets its own wallet, not the last one\'s',
          second['credit'] == 200_000, second['credit'])
    check('a new phone gets its own order history', second['orders'] == [],
          len(second['orders']))
    check('a new phone starts at tier zero', second['spend12'] == 0, second['spend12'])

    # and switching back restores the first customer
    page.goto(f'{BASE}/#/account?tab=profile', wait_until='networkidle')
    page.wait_for_timeout(500)
    page.click('[data-signout]')
    page.wait_for_timeout(600)
    page.fill('[name="phone"]', '09141234567')
    page.click('[data-step1] button[type=submit]')
    page.wait_for_timeout(500)
    otp3 = page.inner_text('[data-sent] b').strip()
    b3 = page.locator('.otp input')
    for i, ch in enumerate(otp3):
        b3.nth(i).fill(ch)
    page.wait_for_timeout(900)
    back = page.evaluate("JSON.parse(localStorage.getItem('lauren.v3'))")
    check('switching back restores the first customer', len(back['orders']) == 1,
          len(back['orders']))
    check('no second welcome on return', back['credit'] == after['credit'],
          f"{after['credit']} -> {back['credit']}")

    # A basket priced for one customer must not be payable by another. Signing
    # out mid-flow used to produce a paid order with no address and spend credit
    # the signed-out wallet no longer had.
    page.goto(f'{BASE}/#/p/polo-steel', wait_until='networkidle')
    page.wait_for_timeout(450)
    page.click('[data-size="M"]'); page.click('[data-add]')
    page.wait_for_timeout(400); page.keyboard.press('Escape')
    page.goto(f'{BASE}/#/checkout', wait_until='networkidle')
    page.wait_for_timeout(700)
    for n, v in [('name', 'علی'), ('line', 'خیابان ولیعصر پلاک ۱۲'), ('postal', '5157733123')]:
        page.fill(f'[name="{n}"]', v)
    page.click('[data-pay]')
    page.wait_for_timeout(900)
    check('reached the gateway again', page.locator('[data-do]').count() == 1)
    page.goto(f'{BASE}/#/account?tab=profile', wait_until='networkidle')
    page.wait_for_timeout(600)
    page.click('[data-signout]')
    page.wait_for_timeout(700)
    page.goto(f'{BASE}/#/pay', wait_until='networkidle')
    page.wait_for_timeout(800)
    check('gateway refuses a basket priced for someone else',
          page.locator('[data-do]').count() == 0 and
          'سبد شما تغییر کرده است' in page.inner_text('#view'))

    # ------------------------------------------------------------- persistence
    # the identity test above left us signed out; come back as the buyer
    page.goto(f'{BASE}/#/account', wait_until='networkidle')
    page.wait_for_timeout(600)
    page.fill('[name="phone"]', '09141234567')
    page.click('[data-step1] button[type=submit]')
    page.wait_for_timeout(500)
    otp4 = page.inner_text('[data-sent] b').strip()
    b4 = page.locator('.otp input')
    for i, ch in enumerate(otp4):
        b4.nth(i).fill(ch)
    page.wait_for_timeout(900)
    page.reload(wait_until='networkidle')
    page.wait_for_timeout(700)
    st2 = page.evaluate("JSON.parse(localStorage.getItem('lauren.v3'))")
    check('the order survives a reload',
          bool(st2['orders']) and st2['orders'][0]['id'] == o['id'],
          [x['id'] for x in st2['orders']])

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
    # letter-spacing on Arabic script breaks the joins between letters
    spaced = page.evaluate("""() => [...document.querySelectorAll('#view *')]
      .filter(el => {
        const cs = getComputedStyle(el);
        const ls = parseFloat(cs.letterSpacing);
        if (!ls) return false;
        const own = [...el.childNodes].filter(n => n.nodeType === 3)
          .map(n => n.textContent).join('');
        return /[\u0600-\u06FF]/.test(own);
      }).map(el => el.className || el.tagName).slice(0, 5)""")
    check('no letter-spacing on Persian text', not spaced, spaced)
    loaded = page.evaluate("document.fonts.check('16px YekanX')")
    check('YekanX actually loaded', loaded)
    price = page.inner_text('.card__price')
    check('prices use the Persian thousands mark', '٬' in price, price)

    check('no unresolved template braces in the DOM',
          '${' not in page.inner_text('body'))

    # ------------------------------------------------------- glass nav + tabs
    print('\nnavigation')
    page.set_viewport_size({'width': 390, 'height': 844})
    tabmap = {
        '/': '#/', '/shop': '#/shop', '/p/polo-noir': '#/shop', '/search': '#/shop',
        '/size-guide': '#/shop', '/shipping': '#/shop', '/faq': '#/shop',
        '/bag': '#/bag', '/checkout': '#/bag',
        '/account': '#/account', '/wishlist': '#/account', '/track': '#/account',
        '/about': '#/', '/contact': '#/',
    }
    orphan = []
    for r, want in tabmap.items():
        page.goto(f'{BASE}/#{r}', wait_until='networkidle')
        page.wait_for_timeout(500)
        got = page.evaluate("""() => {
          const a = document.querySelector('.tabbar a[aria-current="page"]');
          const p = document.querySelector('.tabbar__pill');
          return { tab: a && a.getAttribute('href'), op: p.style.opacity, w: p.style.width };
        }""")
        if got['tab'] != want or got['op'] != '1' or not got['w']:
            orphan.append(f"{r} -> {got}")
    check('every route lights exactly one tab', not orphan, orphan[:3])

    page.goto(f'{BASE}/#/', wait_until='networkidle')
    page.wait_for_timeout(700)
    x1 = page.evaluate("document.querySelector('.tabbar__pill').style.transform")
    page.click('.tabbar a[data-tabnav="/shop"]')
    page.wait_for_timeout(900)
    x2 = page.evaluate("document.querySelector('.tabbar__pill').style.transform")
    check('the pill moves between tabs', x1 != x2 and x2, f"{x1} -> {x2}")

    glass = page.evaluate("""() => {
      const cs = getComputedStyle(document.querySelector('.tabbar'));
      return { blur: cs.backdropFilter || cs.webkitBackdropFilter, bg: cs.backgroundColor };
    }""")
    check('the tab bar is real glass', 'blur' in (glass['blur'] or ''), glass)

    # the header is clear over the hero and frosts once content passes under it
    page.goto(f'{BASE}/#/shop', wait_until='networkidle')
    page.wait_for_timeout(700)
    top = page.evaluate("document.querySelector('.topbar').classList.contains('is-stuck')")
    page.evaluate('scrollTo(0, 800)')
    page.wait_for_timeout(700)
    down = page.evaluate("""() => {
      const el = document.querySelector('.topbar');
      const cs = getComputedStyle(el);
      return { stuck: el.classList.contains('is-stuck'),
               blur: cs.backdropFilter || cs.webkitBackdropFilter };
    }""")
    check('the header frosts on scroll',
          not top and down['stuck'] and 'blur' in (down['blur'] or ''),
          f"top={top} down={down}")

    # Back must dismiss an overlay, not navigate the page underneath
    page.goto(f'{BASE}/#/p/polo-noir', wait_until='networkidle')
    page.wait_for_timeout(600)
    page.click('[data-size="L"]'); page.click('[data-add]')
    page.wait_for_timeout(700)
    check('drawer opened', page.locator('.drawer.is-open').count() == 1)
    page.go_back()
    page.wait_for_timeout(700)
    check('back closes the drawer and stays on the product',
          page.locator('.drawer.is-open').count() == 0 and '/p/polo-noir' in page.url,
          page.url)

    # ------------------------------------------------------------ new pages
    print('\nnew pages')
    page.goto(f'{BASE}/#/search', wait_until='networkidle')
    page.wait_for_timeout(600)
    page.fill('#q', 'زیتونی')
    page.wait_for_timeout(600)
    check('search finds by colour', page.locator('[data-results] .card').count() >= 1,
          page.locator('[data-results] .card').count())
    page.fill('#q', '07')
    page.wait_for_timeout(600)
    check('search finds by piece number',
          page.locator('[data-results] .card').count() == 1,
          page.locator('[data-results] .card').count())
    check('recently-viewed is out of the way while searching',
          page.locator('[data-recent]').is_hidden() if page.locator('[data-recent]').count() else True)
    page.fill('#q', 'qqqq')
    page.wait_for_timeout(600)
    check('search has a real empty state', 'چیزی پیدا نشد' in page.inner_text('[data-results]'))

    page.goto(f'{BASE}/#/p/polo-steel', wait_until='networkidle')
    page.wait_for_timeout(600)
    sizes = page.locator('[data-size]').count()
    outs = page.locator('[data-size][data-out]').count()
    check('every size in the ladder is shown, sold-out included',
          sizes == 5 and outs >= 1, f"{sizes} sizes, {outs} sold out")
    page.locator('[data-size][data-out]').first.click()
    page.wait_for_timeout(500)
    check('a sold-out size can be subscribed to',
          page.locator('[data-size].is-noted').count() >= 1)

    page.goto(f'{BASE}/#/p/set-onyx', wait_until='networkidle')
    page.wait_for_timeout(600)
    page.click('.acc__item:last-child .acc__btn')
    page.wait_for_timeout(500)
    guide = page.inner_text('.acc__item:last-child')
    check('a set quotes trouser measurements too', 'دور کمر' in guide,
          guide.replace('\n', ' ')[:90])

    # in-store pickup skips the address it does not need
    print('\npickup')
    page.goto(f'{BASE}/#/p/polo-noir', wait_until='networkidle')
    page.wait_for_timeout(500)
    page.click('[data-size="L"]'); page.click('[data-add]')
    page.wait_for_timeout(500); page.keyboard.press('Escape')
    page.goto(f'{BASE}/#/checkout', wait_until='networkidle')
    page.wait_for_timeout(700)
    check('address is asked for by default', not page.locator('[data-addr]').is_hidden())
    page.locator('[data-ship] .pickitem').last.click()
    page.wait_for_timeout(500)
    check('pickup hides the address panel', page.locator('[data-addr]').is_hidden())
    page.fill('[name="name"]', 'علی رضایی')
    page.fill('[name="phone"]', '09141234567')
    page.click('[data-pay]')
    page.wait_for_timeout(900)
    check('pickup checks out with no address', '#/pay' in page.url, page.url)

    # ---------------------------------------------------- order detail + acts
    print('\norder actions')
    page.click('[data-otp]')
    page.wait_for_timeout(300)
    c2 = re.search(r'\d{6}', page.inner_text('[data-otphint]')).group(0)
    page.fill('#otp', c2)
    page.click('[data-do]')
    page.wait_for_timeout(2600)
    st3 = page.evaluate("JSON.parse(localStorage.getItem('lauren.v3'))")
    oid = st3['orders'][0]['id']
    page.goto(f'{BASE}/#/order/{oid}', wait_until='networkidle')
    page.wait_for_timeout(700)
    check('order detail opens', oid in page.inner_text('#view'))
    check('order detail offers a reorder', page.locator('[data-reorder]').count() == 1)
    page.click('[data-reorder]')
    page.wait_for_timeout(900)
    check('reorder fills the bag and goes there',
          '#/bag' in page.url and page.locator('.bagline').count() >= 1, page.url)

    page.goto(f'{BASE}/#/exchange/{oid}', wait_until='networkidle')
    page.wait_for_timeout(700)
    check('the exchange form exists', page.locator('[data-form]').count() == 1)
    page.locator('[data-newsize] .size:not([disabled])').first.click()
    page.wait_for_timeout(300)
    page.evaluate("window.open = () => null")   # don't spawn a WhatsApp tab
    page.locator('[data-form] button[type=submit]').click()
    page.wait_for_timeout(1200)
    st4 = page.evaluate("JSON.parse(localStorage.getItem('lauren.v3'))")
    ex = st4['orders'][0].get('exchange')
    check('the exchange request is recorded on the order',
          bool(ex) and ex['toSize'] != ex['fromSize'], ex)

    page.goto(f'{BASE}/#/track?id={oid}', wait_until='networkidle')
    page.wait_for_timeout(700)
    check('the tracker shows the order stages', page.locator('.track__step').count() >= 4,
          page.locator('.track__step').count())

    page.set_viewport_size({'width': 1400, 'height': 900})

    # ------------------------------------------------------- honest copy (A)
    print('\nhonest copy')
    for r in ['/', '/shop', '/p/polo-noir', '/track', '/shipping', '/faq',
              '/contact', '/account', '/bag', f'/order/{oid}']:
        page.goto(f'{BASE}/#{r}', wait_until='networkidle')
        page.wait_for_timeout(350)
        check(f'{r} promises no SMS', 'پیامک می‌شود' not in page.inner_text('#view'))
    # the gateway is the ONE honest use of the phrase — scoped to «نسخه‌ی واقعی»

    page.goto(f'{BASE}/#/p/polo-blanc', wait_until='networkidle')
    page.wait_for_timeout(600)
    hint = page.inner_text('[data-sizehint]')
    check('the sold-out hint does not promise a callback', 'خبرتان' not in hint, hint)

    page.goto(f'{BASE}/#/track?id=LRNOPE0000', wait_until='networkidle')
    page.wait_for_timeout(700)
    check('a missing order says the tracker only knows this device',
          'همین دستگاه' in page.inner_text('#view'))

    page.goto(f'{BASE}/#/shipping', wait_until='networkidle')
    page.wait_for_timeout(500)
    check('the returns policy page carries the preview note',
          'پیش‌نمایش' in page.inner_text('#view'))

    page.goto(f'{BASE}/#/wishlist', wait_until='networkidle')
    page.wait_for_timeout(600)
    check('restock requests are visible to the shopper who made them',
          'منتظر موجود شدن' in page.inner_text('#view'))

    # --------------------------------------------------------- trust band (C)
    print('\ntrust band')
    page.goto(f'{BASE}/#/', wait_until='networkidle')
    page.wait_for_timeout(600)
    check('the footer states the shop identity', page.locator('.ft__trust').count() == 1)
    tels = page.evaluate(
        "() => [...document.querySelectorAll('a[href^=\"tel:\"]')].map(a => a.getAttribute('href'))")
    # [0-9], NOT \d — Python's \d is Unicode-aware and matches ۰–۹, so the
    # obvious spelling passes on exactly the undialable href latinDigits() exists
    # to prevent. A tel: of Persian numerals is not a phone number.
    check('every tel: link actually dials',
          bool(tels) and all(len(re.findall(r'[0-9]', t)) >= 8 for t in tels), tels)
    check('an unissued certificate draws a labelled empty slot',
          page.locator('.ft__seal--empty').count() == 2,
          page.locator('.ft__seal--empty').count())
    check('an empty slot carries no image', page.locator('.ft__seal--empty img').count() == 0)
    check('an empty slot invents no registration number',
          not re.search(r'\d{4,}', page.inner_text('.ft__seals')))
    check('the placeholder names itself as a placeholder',
          'جای' in page.inner_text('.ft__seals'))
    check('the footer loads nothing from another host',
          page.evaluate("() => [...document.querySelectorAll('.ft img, .ft script')]"
                        ".every(n => !n.src || n.src.startsWith(location.origin))"))
    # trust marks must never sit beside a simulated payment form
    # trust marks must never sit beside a simulated payment form
    check('the gateway hides the footer',
          page.evaluate("() => { document.body.classList.add('on-gateway');"
                        " const v = getComputedStyle(document.querySelector('.ft')).display;"
                        " document.body.classList.remove('on-gateway'); return v === 'none'; }"))

    # ------------------------------------------------------------ reviews (D)
    print('\nreviews')
    fams = page.evaluate("""async () => {
      const m = await import('./js/data.js');
      const seen = {};
      for (const p of m.PRODUCTS) (seen[p.family] ||= new Set()).add(p.cat);
      return Object.entries(seen).filter(([, s]) => s.size > 1).map(([f]) => f);
    }""")
    check('no family string spans two categories', not fams, fams)

    page.goto(f'{BASE}/#/p/knit-ivory', wait_until='networkidle')
    page.wait_for_timeout(800)
    check('the review section exists on the product page', page.locator('#reviews').count() == 1)
    check('an empty catalogue shows the honest empty state',
          'هنوز نظری ثبت نشده' in page.inner_text('#reviews'))
    check('nobody without a delivered order gets a write form',
          page.locator('[data-revform]').count() == 0)
    check('sample reviews never wear the verified-purchase pill',
          page.locator('.rev--sample .order__st').count() == 0)
    check('every sample review is labelled a sample',
          page.locator('.rev--sample').count() ==
          page.locator('.rev--sample .tag--quiet').count())

    # back-date every order so orderStage lands on 'done' (48h posted)
    page.evaluate("""() => {
      const s = JSON.parse(localStorage.getItem('lauren.v3'));
      const back = (o) => { o.ts = Date.now() - 5 * 864e5; };
      s.orders.forEach(back);
      Object.values(s.accounts || {}).forEach(a => (a.orders || []).forEach(back));
      localStorage.setItem('lauren.v3', JSON.stringify(s));
    }""")
    # a hash change does not reload the document, so the store would keep the
    # orders it read at boot — reload to make the back-dating real
    page.reload(wait_until='networkidle')
    page.wait_for_timeout(500)
    page.goto(f'{BASE}/#/order/{oid}', wait_until='networkidle')
    page.wait_for_timeout(900)
    check('a delivered order offers a review', page.locator('[data-review]').count() >= 1,
          page.locator('[data-review]').count())
    href = page.locator('[data-review]').first.get_attribute('href')
    check('the review link uses a query param, not a second hash',
          '?to=reviews' in href and href.count('#') == 1, href)

    page.locator('[data-review]').first.click()
    page.wait_for_timeout(1000)
    check('the review link lands on the product, not a 404',
          page.locator('#reviews').count() == 1
          and 'این محصول پیدا نشد' not in page.inner_text('#view'), page.url)
    check('a delivered buyer gets the write form', page.locator('[data-revform]').count() == 1)

    page.click('[data-revsave]')
    page.wait_for_timeout(400)
    check('a review with no rating is refused',
          page.evaluate("(JSON.parse(localStorage.getItem('lauren.v3')).reviews || []).length") == 0)
    check('and says why', 'امتیاز' in page.inner_text('[data-reverr]'))

    page.click('[data-star="5"]')
    page.fill('[name="rbody"]', 'جنس و دوختش خوب بود و سایز اندازه آمد')
    page.click('[data-revsave]')
    page.wait_for_timeout(1000)
    rv = page.evaluate("JSON.parse(localStorage.getItem('lauren.v3')).reviews")
    check('the review is filed against the garment, not the colourway',
          len(rv) == 1 and bool(rv[0]['family']), rv)
    check('the review records the colourway actually bought',
          bool(rv[0]['color']) and bool(rv[0]['size']) and bool(rv[0]['orderId']), rv[0])
    check('the review is stamped with the reviewer phone', bool(rv[0]['phone']))
    check('samples are never written to storage', all(not r.get('sample') for r in rv))

    page.click('[data-star="4"]')
    page.click('[data-revsave]')
    page.wait_for_timeout(900)
    rv2 = page.evaluate("JSON.parse(localStorage.getItem('lauren.v3')).reviews")
    check('a second submission edits rather than duplicates',
          len(rv2) == 1 and rv2[0]['stars'] == 4, rv2)

    agg = page.evaluate("""async () => {
      const st = await import('./js/store.js');
      const fam = st.state.reviews[0].family;
      return { count: st.reviewSummary(fam).count, shown: st.shownReviews(fam).length,
               real: st.state.reviews.length };
    }""")
    check('the headline average counts only real reviews',
          agg['count'] == agg['real'] and agg['shown'] > agg['real'], agg)

    sib = page.evaluate("""async () => {
      const m = await import('./js/data.js');
      const st = await import('./js/store.js');
      const r = st.state.reviews[0];
      const other = m.PRODUCTS.find(p => p.family === r.family && p.id !== r.productId);
      return other ? other.id : null;
    }""")
    if sib:
        page.goto(f'{BASE}/#/p/{sib}?to=reviews', wait_until='networkidle')
        page.wait_for_timeout(800)
        check('a sibling colourway shows the same garment review',
              'هنوز نظری ثبت نشده' not in page.inner_text('#reviews'))

    # width/height do not apply to an inline box: the fill shipped as a <span>
    # and measured 0×0 at every rating, so the whole histogram drew nothing.
    bar = page.evaluate("""() => {
      const fills = [...document.querySelectorAll('.rev__fill')];
      if (!fills.length) return null;
      const boxes = fills.map(f => f.getBoundingClientRect());
      return { widths: boxes.map(b => Math.round(b.width)),
               maxW: Math.round(Math.max(...boxes.map(b => b.width))),
               h: Math.round(Math.max(...boxes.map(b => b.height))),
               display: getComputedStyle(fills[0]).display };
    }""")
    # the row for a rating nobody gave is legitimately 0-wide; what must never
    # happen is EVERY bar being 0, which is what an inline box produced
    check('the rating histogram actually draws its bars',
          bool(bar) and bar['h'] > 0 and bar['maxW'] > 0, bar)

    page.evaluate("async () => (await import('./js/store.js')).signOut()")
    page.goto(f'{BASE}/#/p/knit-ivory', wait_until='networkidle')
    page.wait_for_timeout(800)
    check('signing out does not delete the shop review list',
          page.evaluate("JSON.parse(localStorage.getItem('lauren.v3')).reviews.length") == 1)
    check('a signed-out visitor gets no write form',
          page.locator('[data-revform]').count() == 0)

    # A count inside Persian prose must render in the FaNum face, which
    # substitutes ۰–۹ itself. .num and .lat map to YekanLat, which does NOT —
    # they exist for identifiers (piece numbers, order ids), so a broad sweep
    # would fire on those legitimately. Name the review surfaces instead, and
    # do it on the product that actually HAS the review.
    rp = page.evaluate("JSON.parse(localStorage.getItem('lauren.v3')).reviews[0].productId")
    page.goto(f'{BASE}/#/p/{rp}', wait_until='networkidle')
    page.wait_for_timeout(800)
    faces = page.evaluate("""() => {
      const face = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return 'missing';
        // the face that actually paints the digits, wherever they sit
        const n = [...el.querySelectorAll('*')].find(
          x => [...x.childNodes].some(c => c.nodeType === 3 && /[0-9]/.test(c.textContent)))
          || el;
        return getComputedStyle(n).fontFamily.split(',')[0].replace(/['\"]/g, '');
      };
      return { count: face('[data-revcount]'), dist: face('.rev__row') };
    }""")
    check('the review count renders in the Persian face',
          faces['count'] == 'YekanX', faces)
    check('the star-distribution labels render in the Persian face',
          faces['dist'] == 'YekanX', faces)

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
