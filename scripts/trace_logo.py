#!/usr/bin/env python3
"""Trace the LAUREN logo PNG into clean SVG paths.

The master logo is an 8500px raster. At architectural scale — a hero that makes
the chevron the event — a raster goes soft, and it can't be stroked, outlined or
drawn on. This walks the alpha channel, extracts each shape's outline, simplifies
it, and writes real vector.

    python3 scripts/trace_logo.py

Writes assets/brand/mark.svg (chevron only) and assets/brand/logo.svg (lockup).
Pure stdlib + Pillow — no potrace, no autotrace.
"""

import pathlib
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "brand" / "logo-source.png"
OUT = ROOT / "assets" / "brand"

# Trace at this width; higher = truer curves, slower. The art is mostly straight
# runs with rounded joins, so this is plenty.
WORK_W = 1400
ALPHA_CUT = 128
EPSILON = 2.0          # Douglas-Peucker tolerance, in working pixels
MIN_AREA = 40          # drop speckle


def load_mask(path, width):
    im = Image.open(path).convert("RGBA")
    im = im.crop(im.getbbox())
    h = round(im.height * width / im.width)
    im = im.resize((width, h), Image.LANCZOS)
    a = im.split()[3]
    px = a.load()
    return [[1 if px[x, y] >= ALPHA_CUT else 0 for x in range(width)]
            for y in range(h)], width, h


def components(mask, w, h):
    """Label 4-connected foreground blobs, iteratively (no recursion limits)."""
    seen = [[False] * w for _ in range(h)]
    blobs = []
    for sy in range(h):
        for sx in range(w):
            if mask[sy][sx] == 0 or seen[sy][sx]:
                continue
            stack = [(sx, sy)]
            seen[sy][sx] = True
            cells = []
            while stack:
                x, y = stack.pop()
                cells.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and mask[ny][nx]:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            if len(cells) >= MIN_AREA:
                blobs.append(cells)
    return blobs


def trace_outline(cells, w, h):
    """All closed rings bounding one blob — outer edge plus any holes.

    Collects the unit "crack" segments between a solid pixel and empty space,
    directed so the interior stays on one side, then chains them head-to-tail.
    Chaining directed edges is exact; a Moore/square-trace walk has to guess at
    diagonal pinches and can double back on itself.
    """
    cellset = set(cells)
    edges = {}
    for x, y in cells:
        if (x, y - 1) not in cellset:                 # top,    heading +x
            edges.setdefault((x, y), []).append((x + 1, y))
        if (x + 1, y) not in cellset:                 # right,  heading +y
            edges.setdefault((x + 1, y), []).append((x + 1, y + 1))
        if (x, y + 1) not in cellset:                 # bottom, heading -x
            edges.setdefault((x + 1, y + 1), []).append((x, y + 1))
        if (x - 1, y) not in cellset:                 # left,   heading -y
            edges.setdefault((x, y + 1), []).append((x, y))

    rings = []
    while edges:
        start = next(iter(edges))
        ring = [start]
        node = start
        while True:
            outs = edges.get(node)
            if not outs:
                break
            nxt = outs.pop()
            if not outs:
                del edges[node]
            if nxt == start:
                break
            ring.append(nxt)
            node = nxt
        if len(ring) >= 4:
            rings.append(ring)
    return rings


def _rdp_open(pts, eps):
    """Douglas-Peucker on an open polyline."""
    if len(pts) < 3:
        return pts
    x1, y1 = pts[0]
    x2, y2 = pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = (dx * dx + dy * dy) ** 0.5
    worst, idx = -1.0, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        if norm < 1e-9:
            dist = ((px - x1) ** 2 + (py - y1) ** 2) ** 0.5
        else:
            dist = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / norm
        if dist > worst:
            worst, idx = dist, i
    if worst > eps:
        return _rdp_open(pts[:idx + 1], eps)[:-1] + _rdp_open(pts[idx:], eps)
    return [pts[0], pts[-1]]


def rdp(ring, eps):
    """Douglas-Peucker on a closed ring.

    Run straight on a ring and the first and last point coincide, so every
    perpendicular distance is measured against a zero-length line and the whole
    thing collapses to a point. Split at the two farthest-apart anchors first.
    """
    if len(ring) < 4:
        return ring
    sys.setrecursionlimit(20000)
    a = 0
    far = max(range(len(ring)),
              key=lambda i: (ring[i][0] - ring[a][0]) ** 2 + (ring[i][1] - ring[a][1]) ** 2)
    first = _rdp_open(ring[a:far + 1], eps)
    second = _rdp_open(ring[far:] + [ring[a]], eps)
    return first[:-1] + second[:-1]


def to_path(rings, scale, ox, oy, precision=1):
    out = []
    for ring in rings:
        if len(ring) < 3:
            continue
        pts = [((x - ox) * scale, (y - oy) * scale) for x, y in ring]
        d = f"M{pts[0][0]:.{precision}f} {pts[0][1]:.{precision}f}"
        for x, y in pts[1:]:
            d += f"L{x:.{precision}f} {y:.{precision}f}"
        out.append(d + "Z")
    return " ".join(out)


def build(mask, w, h, view_w=1000):
    blobs = components(mask, w, h)
    blobs.sort(key=len, reverse=True)
    rings = [rdp(r, EPSILON) for b in blobs for r in trace_outline(b, w, h)]
    scale = view_w / w
    return rings, scale, blobs


def svg(paths_d, vw, vh, title):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw:.0f} {vh:.0f}" '
        f'fill="currentColor" role="img" aria-label="{title}">'
        f'<path fill-rule="evenodd" d="{paths_d}"/></svg>'
    )


def main():
    mask, w, h = load_mask(SRC, WORK_W)
    rings, scale, blobs = build(mask, w, h)
    print(f"  {len(blobs)} shapes traced from {w}x{h}")

    vw, vh = w * scale, h * scale
    (OUT / "logo.svg").write_text(svg(to_path(rings, scale, 0, 0), vw, vh, "LAUREN"),
                                  encoding="utf-8")

    # The mark is everything above the wordmark. Find the horizontal gap that
    # separates them rather than guessing a fraction.
    rows = [any(mask[y][x] for x in range(w)) for y in range(h)]
    gaps, run = [], None
    for y, filled in enumerate(rows):
        if not filled and run is None:
            run = y
        elif filled and run is not None:
            gaps.append((run, y))
            run = None
    body = [g for g in gaps if g[0] > h * 0.4 and g[1] < h * 0.95]
    split = max(body, key=lambda g: g[1] - g[0])[0] if body else int(h * 0.735)
    print(f"  mark/wordmark split at y={split} of {h}")

    mark_blobs = [b for b in blobs if max(y for _, y in b) < split]
    mark_rings = [rdp(r, EPSILON) for b in mark_blobs for r in trace_outline(b, w, h)]
    xs = [x for b in mark_blobs for x, _ in b]
    ys = [y for b in mark_blobs for _, y in b]
    ox, oy = min(xs), min(ys)
    mw, mh = (max(xs) - ox + 1), (max(ys) - oy + 1)
    ms = 1000 / mw
    (OUT / "mark.svg").write_text(
        svg(to_path(mark_rings, ms, ox, oy), 1000, mh * ms, "LAUREN"),
        encoding="utf-8")
    print(f"  mark.svg  {len(mark_blobs)} shapes  viewBox 0 0 1000 {mh * ms:.0f}")

    for f in ("logo.svg", "mark.svg"):
        print(f"  {f}: {(OUT / f).stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
