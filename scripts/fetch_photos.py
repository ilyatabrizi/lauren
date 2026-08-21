#!/usr/bin/env python3
"""LAUREN — placeholder photography for the v5 design direction.

These are FREE STOCK PHOTOGRAPHS from Pexels, not Lauren's garments. They exist
so the design can be judged with real, full-bleed imagery instead of 740px phone
grabs. Every one must be replaced with a real shoot before this goes near a
paying customer — see README.

Pexels License: free to use, commercial use allowed, no attribution required,
no need to ask permission. https://www.pexels.com/license/

    python3 scripts/fetch_photos.py            # download + process everything
    python3 scripts/fetch_photos.py --force    # re-download even if cached
"""
import io
import pathlib
import sys
import urllib.request

from PIL import Image, ImageEnhance, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / 'scripts' / '.photo-cache'
OUT = ROOT / 'assets' / 'photos'
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'}

# key -> (pexels id, vertical focal point 0..1, note[, zoom])
# The focal point keeps a face or a garment centred when the crop is tall; the
# optional 4th value crops in first, for frames where the subject sits too far
# back to read as a product shot.
SHOTS = {
    # ---- pique-stripe polos
    'polo-noir':      (34894401, .34, 'black polo, outdoors'),
    'polo-blanc':     (17898556, .30, 'light polo and jeans', 1.25),
    'polo-steel':     (17984122, .32, 'grey polo, studio'),
    # ---- jacquard knit
    'polo-jade':      (26588155, .32, 'green polo, indoors'),
    'polo-bordeaux':  (12277160, .32, 'red polo'),
    # ---- contrast collar
    'polo-collar':    (21938719, .32, 'blue polo against a wall'),
    # ---- rib knit
    'knit-ivory':     (15235481, .34, 'pale knit, moody close-up'),
    'knit-sand':      (10571777, .34, 'warm knit, side view'),
    # ---- co-ord sets
    'set-onyx':       (28540142, .40, 'black set, close-up'),
    'set-cacao':      (6158668,  .32, 'maroon set, urban', 1.2),
    'set-olive':      (18078033, .72, 'green set, brick wall', 1.45),
    'set-slate':      (28870038, .34, 'grey set'),
    # ---- editorial + hero
    'hero':           (6328563,  .38, 'knit on dark rock — the hero'),
    'ed-atelier':     (9775768,  .40, 'two models, minimal studio'),
    'ed-portrait':    (3938465,  .30, 'b&w knit portrait'),
    'ed-street':      (20775155, .30, 'b&w model portrait'),
}

# name -> (width, height, quality). Real photography can finally run large.
SIZES = {
    'card':   (1000, 1250, 80),   # 4:5 catalogue tile @2x
    'detail': (1500, 1875, 82),   # 4:5 product page @2x
    'closeup':(1200, 1200, 80),   # square, cropped in on the cloth
    'wide':   (2200, 1240, 80),   # ~16:9 editorial band
    'hero':   (2600, 1460, 80),   # full-bleed hero
}
# max bytes per rendition
BUDGET = {'card': 150_000, 'detail': 300_000, 'closeup': 190_000,
          'wide': 320_000, 'hero': 420_000}

PER_KEY = {
    'hero':        ['hero', 'wide'],
    'ed-atelier':  ['wide'],
    'ed-portrait': ['wide', 'card'],
    'ed-street':   ['wide'],
}
DEFAULT = ['card', 'detail', 'closeup']


def fetch(pid, force=False):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / f'{pid}.jpg'
    if f.exists() and not force:
        return Image.open(f).convert('RGB')
    url = (f'https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg'
           '?auto=compress&cs=tinysrgb&w=2600')
    req = urllib.request.Request(url, headers=UA)
    data = urllib.request.urlopen(req, timeout=60).read()
    f.write_bytes(data)
    return Image.open(io.BytesIO(data)).convert('RGB')


def grade(im):
    """Pull sixteen unrelated stock frames into one collection.

    Stock photography reads as stock mostly because every frame was graded by a
    different person: one is warm, one is teal, one is a bright studio white.
    Desaturating, flattening the contrast a little and settling everything onto
    a common slightly-cool black is what a stylist would do to a lookbook, and
    it is the difference between a grid that looks bought and a grid that looks
    art-directed."""
    im = ImageEnhance.Color(im).enhance(.62)      # take the colour down, not out
    im = ImageEnhance.Contrast(im).enhance(1.06)
    im = ImageEnhance.Brightness(im).enhance(.96)
    # a cool, lifted black point so nothing crushes against the page ground
    r, g, b = im.split()
    r = r.point(lambda v: int(10 + v * .955))
    g = g.point(lambda v: int(10 + v * .955))
    b = b.point(lambda v: int(14 + v * .955))
    return Image.merge('RGB', (r, g, b))


def zoom_in(im, factor, focal):
    if factor <= 1:
        return im
    w, h = int(im.width / factor), int(im.height / factor)
    x = (im.width - w) // 2
    y = max(0, min(int(im.height * focal - h / 2), im.height - h))
    return im.crop((x, y, x + w, y + h))


def crop_to(im, w, h, focal):
    """Cover-crop to w:h, biasing the window towards the focal point."""
    tw, th = w / h, im.width / im.height
    if th > tw:                                  # too wide — trim the sides
        nw = int(im.height * tw)
        x = (im.width - nw) // 2
        im = im.crop((x, 0, x + nw, im.height))
    else:                                        # too tall — trim to the focus
        nh = int(im.width / tw)
        y = int(im.height * focal - nh / 2)
        y = max(0, min(y, im.height - nh))
        im = im.crop((0, y, im.width, y + nh))
    # never upscale past the source
    if im.width < w:
        w, h = im.width, int(im.width / (w / h))
    return im.resize((w, h), Image.LANCZOS)


def main():
    force = '--force' in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for key, spec in SHOTS.items():
        pid, focal, note = spec[0], spec[1], spec[2]
        zoom = spec[3] if len(spec) > 3 else 1.0
        src = None
        for attempt in range(3):                  # the CDN drops a connection now and then
            try:
                src = fetch(pid, force)
                break
            except Exception as e:                # noqa: BLE001
                err = e
        if src is None:
            print(f'  !! {key}: {err}')
            continue
        for size in PER_KEY.get(key, DEFAULT):
            w, h, q = SIZES[size]
            src_t = ImageOps.exif_transpose(src)
            if size == 'closeup':
                base = zoom_in(src_t, max(zoom, 1.0) * 2.1, min(focal + .22, .9))
                out = grade(crop_to(base, w, h, .5))
            else:
                base = zoom_in(src_t, zoom, focal)
                out = grade(crop_to(base, w, h, focal))
            path = OUT / f'{key}--{size}.jpg'
            # Stay inside a byte budget: a busy frame at q80 can triple a calm
            # one, and this repo is served straight off GitHub Pages.
            budget = BUDGET[size]
            for attempt in range(q, 54, -6):
                out.save(path, 'JPEG', quality=attempt, optimize=True, progressive=True)
                if path.stat().st_size <= budget:
                    break
            kb = path.stat().st_size // 1024
            total += kb
            print(f'  {path.name:26} {out.width}x{out.height}  {kb}KB   {note}')
    print(f'\n{total // 1024}.{total % 1024 // 100}MB total in {OUT.relative_to(ROOT)}')
    write_lqip()


def write_lqip():
    """Blur-up placeholders: a 20px JPEG per rendition, inlined as a data URI
    and painted behind the real photograph until it decodes."""
    rows = []
    for f in sorted(OUT.glob('*.jpg')):
        im = Image.open(f).convert('RGB')
        im.thumbnail((20, 20), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, 'JPEG', quality=32)
        import base64
        uri = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
        rows.append(f'"{f.stem}": "{uri}"')
    js = ('// generated by scripts/fetch_photos.py — blur-up placeholders\n'
          'export const LQIP = {\n' + ',\n'.join(rows) + '\n};\n')
    (ROOT / 'js' / 'placeholders.js').write_text(js, encoding='utf-8')
    print(f'wrote js/placeholders.js — {len(rows)} placeholders')


if __name__ == '__main__':
    main()
