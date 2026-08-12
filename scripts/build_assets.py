#!/usr/bin/env python3
"""LAUREN — asset pipeline.

Takes the raw store photos in assets/products/_src plus the master logo and
produces everything the site ships: 4:5 catalogue images, zoomed detail
shots, colourway variants, blur-up placeholders, brand SVG/PNG and the full
PWA icon set.

    python3 scripts/build_assets.py

Idempotent — safe to re-run after dropping new photos into _src.
"""

import base64
import io
import json
import pathlib
import colorsys

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "products" / "_src"
OUT = ROOT / "assets" / "products"
ICONS = ROOT / "assets" / "icons"
BRAND = ROOT / "assets" / "brand"

CARD = (1200, 1500)      # 4:5 catalogue card — 2x-clean at grid size
ZOOM = (1200, 1500)      # detail crop, same frame
HERO = (2200, 1210)      # wide letterbox for the home hero
QUALITY = 82

# --------------------------------------------------------------------------
# Third-party maker's labels visible in the raw photos get defocused before
# any cropping — the preview shouldn't reproduce someone else's trademark.
#   source -> [(left, top, right, bottom), ...]
# --------------------------------------------------------------------------
#   ("blur", box)              — feathered defocus, reads as shallow depth of field
#   ("clone", box, dx, dy)     — borrow clean fabric from (dx, dy) away and feather it in
RETOUCH = {
    "src1": [("blur", (186, 436, 304, 502)), ("blur", (482, 436, 578, 492))],
    "src2": [("clone", (390, 440, 710, 760), -210, 172)],
    "src3": [("blur", (246, 96, 422, 194))],
    "src4": [("blur", (214, 254, 354, 316))],
}

# --------------------------------------------------------------------------
# crops:  key -> (source, box)     box is (l, t, r, b) in source px, at 4:5
# --------------------------------------------------------------------------
CROPS = {
    # src1 754x1296 — noir + blanc polo on the brass rail
    "polo-noir":           ("src1", (0, 370, 420, 895)),
    "polo-noir--detail":   ("src1", (150, 420, 470, 820)),
    "polo-blanc":          ("src1", (390, 400, 754, 855)),
    "polo-blanc--detail":  ("src1", (430, 420, 750, 820)),
    # src2 762x1148 — jade jacquard layered over the contrast-collar polo
    "polo-jade":           ("src2", (60, 170, 660, 920)),
    "polo-jade--detail":   ("src2", (40, 560, 440, 1060)),
    "polo-collar":         ("src2", (190, 0, 762, 715)),
    "polo-collar--detail": ("src2", (210, 20, 530, 420)),
    # src3 760x1076 — ivory ribbed knit, rust trim
    "knit-ivory":          ("src3", (180, 20, 740, 720)),
    "knit-ivory--detail":  ("src3", (250, 100, 570, 500)),
    # src4 740x1146 — onyx jacquard polo styled with the ivory trouser
    "set-onyx":            ("src4", (40, 190, 640, 940)),
    "set-onyx--detail":    ("src4", (200, 250, 520, 650)),
    # src5 726x934 — cacao tee + short set
    "set-cacao":           ("src5", (0, 15, 726, 922)),
    "set-cacao--detail":   ("src5", (220, 80, 540, 480)),
}

# Wide hero — a letterbox band across the rail shot: brass, marble, collars.
HERO_CROP = ("src1", (0, 286, 754, 700))

# --------------------------------------------------------------------------
# colourways: new_key -> (base_key, recipe)
#   hue   — rotate hue of saturated pixels (for already-coloured garments)
#   tint  — recolour the light pixels, keeping luminance (for white / ivory)
#   wash  — drain saturation first, then tint (for muddy -> neutral)
# --------------------------------------------------------------------------
VARIANTS = {
    "polo-steel":            ("polo-blanc", ("tint", (122, 148, 175), 0.80)),
    "polo-steel--detail":    ("polo-blanc--detail", ("tint", (122, 148, 175), 0.80)),
    "polo-bordeaux":         ("polo-jade", ("hue", -0.40, 1.05)),
    "polo-bordeaux--detail": ("polo-jade--detail", ("hue", -0.40, 1.05)),
    "knit-sand":             ("knit-ivory", ("tint", (196, 168, 126), 0.72)),
    "knit-sand--detail":     ("knit-ivory--detail", ("tint", (196, 168, 126), 0.72)),
    "set-olive":             ("set-cacao", ("hue", 0.115, 0.86)),
    "set-olive--detail":     ("set-cacao--detail", ("hue", 0.115, 0.86)),
    "set-slate":             ("set-cacao", ("wash", (122, 128, 138), 0.80)),
    "set-slate--detail":     ("set-cacao--detail", ("wash", (122, 128, 138), 0.80)),
}


# ---------------------------------------------------------------- helpers --
def grade(im):
    """One house grade so every photo reads as the same shoot."""
    im = ImageEnhance.Color(im).enhance(0.94)
    im = ImageEnhance.Contrast(im).enhance(1.06)
    im = ImageEnhance.Brightness(im).enhance(1.01)
    # gentle corner falloff
    w, h = im.size
    vig = Image.new("L", (w, h), 0)
    inner = Image.new("L", (int(w * 1.35), int(h * 1.35)), 255)
    inner = inner.filter(ImageFilter.GaussianBlur(min(w, h) * 0.16))
    vig.paste(inner.resize((w, h)), (0, 0))
    vig = ImageOps.autocontrast(vig)
    dark = ImageEnhance.Brightness(im).enhance(0.80)
    return Image.composite(im, dark, vig)


def hue_rotate(im, shift, sat=1.0):
    """Rotate hue; leaves near-grey pixels alone so backgrounds stay put."""
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y][:3]
            hh, ss, vv = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if ss > 0.10:
                weight = min(1.0, (ss - 0.10) / 0.18)
                hh = (hh + shift * weight) % 1.0
                ss = min(1.0, ss * (1 + (sat - 1) * weight))
            r, g, b = colorsys.hsv_to_rgb(hh, ss, vv)
            px[x, y] = (int(r * 255), int(g * 255), int(b * 255))
    return im


def tint_lights(im, colour, strength):
    """Push bright pixels toward `colour`; dark pixels are untouched.

    Luminance is preserved — only the hue of the light areas moves — so the
    fabric keeps its folds and the marble backdrop stays neutral.
    """
    lum = im.convert("L")
    mask = lum.point(lambda v: int(min(255, max(0, v - 96) / 159 * 255 * strength)))
    tinted = ImageOps.colorize(lum, black=(0, 0, 0), white=colour)
    return Image.composite(tinted, im, mask)


def wash(im, colour, strength):
    """Drain the colour out, then lay a neutral back over the light areas."""
    flat = ImageEnhance.Color(im).enhance(0.12)
    return tint_lights(flat, colour, strength)


def _feathered(im, box, replacement, feather):
    """Blend `replacement` over `box` behind a soft-edged mask.

    `replacement` covers the whole box; the mask is drawn *inset* by `feather`
    and then blurred, so it is fully opaque over the middle of the box and
    fades to nothing exactly at the box edge. (Blurring a mask drawn at full
    box size instead would leave the centre translucent and the label showing
    through — and growing it past the box leaves a hard donor seam.)
    So: give the box ~1.5x the feather of margin around whatever it hides.
    """
    l, t, r, b = box
    base = im.crop(box)
    over = replacement.filter(ImageFilter.GaussianBlur(1))
    mask = Image.new("L", base.size, 0)
    f = int(feather)
    ImageDraw.Draw(mask).rounded_rectangle(
        (f, f, (r - l) - f, (b - t) - f),
        radius=int(min(r - l, b - t) * 0.18), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather * 0.55))
    im.paste(Image.composite(over, base, mask), (l, t))
    return im


def match_levels(donor, target):
    """Match the donor's per-channel mean to the target's so a clone blends."""
    from PIL import ImageStat
    ds, ts = ImageStat.Stat(donor).mean, ImageStat.Stat(target).mean
    bands = []
    for band, dm, tm in zip(donor.split(), ds, ts):
        shift = tm - dm
        bands.append(band.point(lambda v, s=shift: int(min(255, max(0, v + s)))))
    return Image.merge("RGB", bands)


def retouch(im, ops):
    """Take maker's labels out of shot — we don't republish anyone's mark.

    A feathered defocus reads as shallow depth of field; on flat fabric a
    clone from a clean patch nearby disappears completely.
    """
    for op in ops:
        kind, box = op[0], op[1]
        w, h = box[2] - box[0], box[3] - box[1]
        if kind == "clone":
            dx, dy = op[2], op[3]
            donor = im.crop((box[0] + dx, box[1] + dy,
                             box[2] + dx, box[3] + dy))
            donor = match_levels(donor, im.crop(box))
            im = _feathered(im, box, donor, max(8, min(w, h) * 0.13))
        else:
            # smudge the woven label down to an unbranded blur
            patch = im.crop(box)
            patch = patch.filter(ImageFilter.GaussianBlur(max(5, min(w, h) * 0.42)))
            patch = ImageEnhance.Contrast(patch).enhance(0.72)
            im = _feathered(im, box, patch, max(6, min(w, h) * 0.26))
    return im


def fit(im, size):
    return ImageOps.fit(im, size, method=Image.LANCZOS, centering=(0.5, 0.5))


def save_jpg(im, path, quality=QUALITY):
    im.convert("RGB").save(path, "JPEG", quality=quality,
                           optimize=True, progressive=True)


def lqip(im):
    """Tiny base64 blur-up placeholder."""
    small = im.convert("RGB").resize((16, 20), Image.LANCZOS)
    buf = io.BytesIO()
    small.save(buf, "JPEG", quality=40)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


# ------------------------------------------------------------------ build --
def build_photos():
    placeholders = {}
    made = {}
    sources = {}
    for name in sorted({s for s, _ in CROPS.values()}):
        im = Image.open(SRC / f"{name}.png").convert("RGB")
        sources[name] = retouch(im, RETOUCH.get(name, []))

    for key, (src, box) in CROPS.items():
        im = sources[src]
        w, h = im.size
        box = (max(0, box[0]), max(0, box[1]), min(w, box[2]), min(h, box[3]))
        crop = im.crop(box)
        target = ZOOM if key.endswith("--detail") else CARD
        out = grade(fit(crop, target))
        save_jpg(out, OUT / f"{key}.jpg")
        made[key] = out
        placeholders[key] = lqip(out)
        print(f"  photo  {key}.jpg  {out.size}")

    for key, (base, recipe) in VARIANTS.items():
        im = made[base].copy()
        mode, arg, amount = recipe
        if mode == "hue":
            im = hue_rotate(im, arg, amount)
        elif mode == "wash":
            im = wash(im, arg, amount)
        else:
            im = tint_lights(im, arg, amount)
        save_jpg(im, OUT / f"{key}.jpg")
        placeholders[key] = lqip(im)
        print(f"  colour {key}.jpg")

    src, box = HERO_CROP
    hero = grade(fit(sources[src].crop(box), HERO))
    save_jpg(hero, BRAND / "hero.jpg", 80)
    placeholders["hero"] = lqip(hero)
    print(f"  hero   brand/hero.jpg  {hero.size}")

    (ROOT / "js" / "placeholders.js").write_text(
        "// generated by scripts/build_assets.py — blur-up placeholders\n"
        "export const LQIP = " + json.dumps(placeholders, indent=0) + ";\n",
        encoding="utf-8")
    print(f"  wrote js/placeholders.js ({len(placeholders)} entries)")


def build_icons():
    logo = Image.open(BRAND / "logo-source.png").convert("RGBA")
    # trim transparent margin
    logo = logo.crop(logo.getbbox())

    def recoloured(src, rgb):
        out = Image.new("RGBA", src.size, rgb + (255,))
        out.putalpha(src.split()[3])
        return out

    def web(src, name, width):
        im = src.copy()
        im.thumbnail((width, width * 4), Image.LANCZOS)
        im.save(BRAND / name)
        return im

    # full lockup — bone for the dark UI, ink for anything on paper
    web(recoloured(logo, (237, 234, 228)), "logo-bone.png", 1400)
    web(logo, "logo-ink.png", 1400)

    # just the chevron mark (the lockup's top ~73% is the symbol)
    mark = logo.crop((0, 0, logo.width, int(logo.height * 0.735)))
    mark = mark.crop(mark.getbbox())
    mark_bone = recoloured(mark, (237, 234, 228))
    web(mark_bone, "mark-bone.png", 512)
    web(mark, "mark-ink.png", 512)
    web(recoloured(mark, (194, 163, 107)), "mark-brass.png", 512)

    for size in (48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512, 1024):
        canvas = Image.new("RGBA", (size, size), (10, 10, 11, 255))
        inner = int(size * 0.66)
        m = mark_bone.copy()
        m.thumbnail((inner, inner), Image.LANCZOS)
        canvas.paste(m, ((size - m.width) // 2, (size - m.height) // 2), m)
        canvas.convert("RGB").save(ICONS / f"icon-{size}.png")

    # maskable — more padding so the safe zone survives the circle mask
    for size in (192, 512):
        canvas = Image.new("RGBA", (size, size), (10, 10, 11, 255))
        inner = int(size * 0.46)
        m = mark_bone.copy()
        m.thumbnail((inner, inner), Image.LANCZOS)
        canvas.paste(m, ((size - m.width) // 2, (size - m.height) // 2), m)
        canvas.convert("RGB").save(ICONS / f"maskable-{size}.png")

    # apple touch icon sits on the brand black
    canvas = Image.new("RGBA", (180, 180), (10, 10, 11, 255))
    m = mark_bone.copy()
    m.thumbnail((116, 116), Image.LANCZOS)
    canvas.paste(m, ((180 - m.width) // 2, (180 - m.height) // 2), m)
    canvas.convert("RGB").save(ICONS / "apple-touch-icon.png")

    # og image
    og = Image.new("RGB", (1200, 630), (10, 10, 11))
    m = mark_bone.copy()
    m.thumbnail((300, 300), Image.LANCZOS)
    og.paste(m, ((1200 - m.width) // 2, (630 - m.height) // 2 - 20), m)
    og.save(BRAND / "og.jpg", "JPEG", quality=88)
    print("  icons + og written")


if __name__ == "__main__":
    for d in (OUT, ICONS, BRAND):
        d.mkdir(parents=True, exist_ok=True)
    print("LAUREN assets")
    build_photos()
    build_icons()
    print("done.")
