#!/usr/bin/env python3
"""Draw the red numbered callouts and magnified insets on the captured HACO
Benchmark figures.

Consumes the annotations.json sidecar written by
tests/capture-appendix-shots.mjs, which records each callout region's viewport
rect at the exact moment its figure was captured, together with that
screenshot's crop origin and device pixel ratio.

Style is measured from the reference document's own annotated figures
(HYDE Appendix D):

    box     pure #FF0000, 3 px stroke, ~8 px corner radius
    badge   filled #FF0000 disc 26 px across, white bold numeral,
            centre at the box's top-left corner + (10, 4) so the disc
            straddles the corner

A callout may also carry `inset`, which reproduces HYDE's zoom idiom for
controls that are too small to read at the 6in appendix column width. The
source rect is cropped from the *clean* screenshot, upscaled with NEAREST
(so the magnification reads as pixelation, exactly as in the reference), and
pasted into a dark rounded panel with a heavier red border. A straight red
leader joins the panel to the small box it came from, and the badge is
repeated on the panel's top-left corner.

Usage:
    python3 annotate_appendix_figures.py [--dir DIR] [--dry-run] [--only SLUG]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT_CANDIDATES = [
    "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]

# Fallbacks if the measured spec is absent from the sidecar.
DEFAULT_STYLE = {
    "color": [255, 0, 0],
    "strokeWidth": 3,
    "radius": 8,
    "badgeRadius": 13,
    "badgeOffset": [10, 4],
}

DEFAULT_INSET_STYLE = {
    "color": [255, 0, 0],
    "strokeWidth": 5,
    "radius": 18,
    "leaderWidth": 4,
    "maxZoom": 4.5,
    "defaultTarget": 200,
    "padding": 10,
    "panelColor": [10, 10, 12],
    "margin": 56,
    "gap": 48,
    "bandHeight": 0.62,   # inset band height as a fraction of figure height
    "skipMaxHeight": 0.55, # region taller than this fraction of the frame cannot be usefully zoomed
    "skipMaxWidth": 0.62,  # nor one wider than this, which would overflow the frame
    # A region already covering this much of the figure is legible at the 6in
    # column width, so magnifying it only lays a duplicate panel over unrelated
    # content and tends to run off the frame edge. Zoom small controls only.
    "skipMaxArea": 0.05,
    "maxInsetHeight": 0.45, # an inset taller than this stops being a callout
    "minZoom": 1.4,
    "hardMaxZoom": 6.0,
}

# HYDE never puts more than two magnified insets on one figure.
MAX_INSETS_PER_FIGURE = 2

_FONT_PATH: str | None = None


def load_font() -> ImageFont.FreeTypeFont:
    return load_font_at(20)


def fit_font(draw: ImageDraw.ImageDraw, text: str, radius: int) -> ImageFont.FreeTypeFont:
    """Largest size at which `text` fits inside the badge, capped at 20 px."""
    limit = radius * 1.42  # usable inner diameter before glyphs touch the rim
    size = 20
    font = load_font_at(size)
    while size > 9:
        font = load_font_at(size)
        left, _, right, _ = draw.textbbox((0, 0), text, font=font)
        if right - left <= limit:
            return font
        size -= 1
    return font


def load_font_at(size: int) -> ImageFont.FreeTypeFont:
    global _FONT_PATH
    if _FONT_PATH is None:
        for path in FONT_CANDIDATES:
            if Path(path).is_file():
                _FONT_PATH = path
                break
        if _FONT_PATH is None:
            raise SystemExit(
                "no bold TrueType font found; install fonts-dejavu-core or fonts-liberation"
            )
    return ImageFont.truetype(_FONT_PATH, size)


def draw_badge(draw: ImageDraw.ImageDraw, label: str, cx: float, cy: float,
               radius: int, color: tuple[int, int, int]) -> None:
    """Filled disc with a white bold numeral, centred on (cx, cy)."""
    font = fit_font(draw, label, radius)
    left, top, right, bottom = draw.textbbox((0, 0), label, font=font)
    tw, th = right - left, bottom - top
    tx = cx - tw / 2 - left
    ty = cy - th / 2 - top
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=color)
    draw.text((tx, ty), label, font=font, fill=(255, 255, 255))


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def region_size(region: tuple[float, float, float, float]) -> tuple[float, float]:
    """(x0, y0, x1, y1) -> (width, height). Regions are stored as corners."""
    x0, y0, x1, y1 = region
    return x1 - x0, y1 - y0


def desired_inset(region: tuple[float, float, float, float], target: int,
                  max_w: float, max_h: float, style: dict) -> tuple[float, float, float]:
    """Magnification that makes `region` legible within a panel budget.

    The scale is driven by a target inset height, so a 28px toolbar button and
    a 400px panel both land at a readable size. Aspect ratio is preserved, so
    the inset is a true zoom rather than a stretch.
    """
    rw, rh = region_size(region)
    if rw <= 0 or rh <= 0:
        raise SystemExit("inset region has no area")
    s = _clamp(target / rh, style["minZoom"],
               min(style["hardMaxZoom"], style["maxZoom"]))
    if rh * s > max_h:
        s = max_h / rh
    if rw * s > max_w:
        s = max_w / rw
    return rw * s, rh * s, s


def _overlaps(a: tuple, b: tuple, pad: float = 0.0) -> bool:
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    return not (
        ax1 + pad <= bx0 or bx1 + pad <= ax0
        or ay1 + pad <= by0 or by1 + pad <= ay0
    )


def _centre_dist(a: tuple, b: tuple) -> float:
    return (((a[0] + a[2]) / 2 - (b[0] + b[2]) / 2) ** 2
            + ((a[1] + a[3]) / 2 - (b[1] + b[3]) / 2) ** 2) ** 0.5


def _candidates(region: tuple, w: float, h: float, W: int, H: int, gap: int):
    """Rectangles to try for one inset, nearest to its source box first.

    Adjacency is what makes this read like the reference: HYDE's leader lines
    are short because each inset sits just beyond the control it magnifies.
    A fixed band at the bottom of the frame does not work here, because on the
    Run and Simulate screens the callouts themselves sit at the bottom and a
    band-sized panel buries the very box it is explaining.
    """
    x0, y0, x1, y1 = region
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    out = [
        # directly below, then directly above, centred on the source
        (cx - w / 2, y1 + gap, cx + w / 2, y1 + gap + h),
        (cx - w / 2, y0 - gap - h, cx + w / 2, y0 - gap),
        # below / above, aligned to the source's leading edge
        (x0, y1 + gap, x0 + w, y1 + gap + h),
        (x0, y0 - gap - h, x0 + w, y0 - gap),
        # beside the source, vertically centred
        (x1 + gap, cy - h / 2, x1 + gap + w, cy + h / 2),
        (x0 - gap - w, cy - h / 2, x0 - gap, cy + h / 2),
    ]
    # corner bands, as a last resort
    out += [
        (W * 0.03, H - gap - h, W * 0.03 + w, H - gap),
        (W * 0.97 - w, H - gap - h, W * 0.97, H - gap),
        (W * 0.03, gap, W * 0.03 + w, gap + h),
        (W * 0.97 - w, gap, W * 0.97, gap + h),
    ]
    return out


def _overlap_area(a: tuple, b: tuple) -> float:
    w = min(a[2], b[2]) - max(a[0], b[0])
    h = min(a[3], b[3]) - max(a[1], b[1])
    return w * h if w > 0 and h > 0 else 0.0


def layout_insets(items: list, W: int, H: int, style: dict,
                  boxes: list[tuple]) -> list[tuple]:
    """Place every inset beside its own callout, never over it.

    An inset must magnify: its scale is never allowed below 1.0, and a region
    too wide or too tall to be enlarged inside the frame is left alone rather
    than rendered as a shrunken copy. Each inset then takes the free position
    closest to its source box, preferring positions that also clear the other
    callouts. Overlapping ordinary UI is fine -- the reference does that too --
    but an inset never covers the control it is explaining.
    """
    gap = style["gap"]
    margin = style["margin"]
    max_w = W - 2 * margin
    max_h = H * style["bandHeight"]

    placed: list[tuple] = []
    out: list[tuple | None] = [None] * len(items)
    # Small insets are the hardest to fit and the ones that most need the
    # magnification, so they choose their positions first.
    order = sorted(
        range(len(items)),
        key=lambda i: (lambda rw, rh: rw * rh)(*region_size(items[i][1])),
    )
    for i in order:
        box, region, target = items[i]
        dw, dh, s = desired_inset(region, target, max_w, max_h, style)
        floor = min(1.0, 1.0 / s) if s > 0 else 1.0
        best = None
        # Step down to, but never below, 1:1.
        for shrink in (1.0, 0.9, 0.8, 0.72, 0.65, 0.58, 0.52, 0.46, 0.4,
                       0.35, 0.3, 0.26, 0.22, 0.19, 0.16):
            if shrink < floor:
                break
            w, h = dw * shrink, dh * shrink
            for cand in _candidates(region, w, h, W, H, gap):
                # Nudge a candidate back inside the frame instead of discarding
                # it: a callout in the corner would otherwise have no valid slot.
                x0 = _clamp(cand[0], margin, W - margin - w)
                y0 = _clamp(cand[1], margin, H - margin - h)
                cand = (x0, y0, x0 + w, y0 + h)
                if _overlaps(cand, region, 6):
                    continue          # never cover the control being magnified
                if any(_overlaps(cand, r, 8) for r in placed):
                    continue          # never cover another inset
                # Crossing another callout is acceptable but discouraged.
                cost = _centre_dist(cand, region)
                cost += sum(_overlap_area(cand, r) for r in boxes) / 400.0
                if best is None or cost < best[0]:
                    best = (cost, cand, w, h, s * shrink)
            if best is not None:
                break
        if best is None:
            print(f"    step {box['step']}: no room for a {s:.1f}x inset, left unzoomed")
            continue
        _, rect, w, h, sc = best
        placed.append(rect)
        out[i] = (rect[0], rect[1], w, h, sc)
    return [o for o in out if o is not None]


def paste_inset(image: Image.Image, region: tuple[float, float, float, float],
                panel: tuple[float, float, float, float], label: str,
                scale: float, color: tuple[int, int, int],
                style: dict, box_style: dict) -> None:
    """Composite one magnified inset panel plus its leader line onto `image`."""
    W, H = image.size
    px, py, pw, ph = panel
    pad = style["padding"]
    radius = style["radius"]
    stroke = style["strokeWidth"]

    # 1. leader line, drawn first so the panel covers its far end.
    #    It joins the nearest points of the source box and the panel, which
    #    keeps it short now that each inset sits beside its own callout.
    sx0, sy0, sx1, sy1 = region
    px1, py1 = px + pw, py + ph
    ax = _clamp((px + px1) / 2, sx0, sx1)
    bx = _clamp((sx0 + sx1) / 2, px, px1)
    ay = _clamp((py + py1) / 2, sy0, sy1)
    by = _clamp((sy0 + sy1) / 2, py, py1)
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).line(
        [ax, ay, bx, by], fill=(*color, 255), width=style["leaderWidth"]
    )
    image.alpha_composite(layer)

    # 2. crop from the clean image and upscale with NEAREST.
    box = (
        max(0, int(round(sx0))),
        max(0, int(round(sy0))),
        min(W, int(round(sx1))),
        min(H, int(round(sy1))),
    )
    crop = image.crop(box)
    tw, th = max(1, round(pw - 2 * pad)), max(1, round(ph - 2 * pad))
    crop = crop.resize((tw, th), Image.NEAREST)

    # 3. soft drop shadow under the panel.
    shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    off = 7
    sd.rounded_rectangle(
        [px + off, py + off, px + pw + off, py + ph + off],
        radius=radius, fill=(0, 0, 0, 190),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(9))
    image.alpha_composite(shadow)

    # 4. panel background, then the crop, then the red border.
    panel_layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    pd = ImageDraw.Draw(panel_layer)
    pd.rounded_rectangle([px, py, px + pw, py + ph], radius=radius,
                         fill=(*style["panelColor"], 255))
    image.alpha_composite(panel_layer)
    image.alpha_composite(crop.convert("RGBA"), (int(round(px + pad)), int(round(py + pad))))

    edge = Image.new("RGBA", image.size, (0, 0, 0, 0))
    ImageDraw.Draw(edge).rounded_rectangle(
        [px, py, px + pw, py + ph], radius=radius, outline=(*color, 255), width=stroke
    )
    image.alpha_composite(edge)

    # 5. repeat the badge on the panel's top-left corner, as HYDE does.
    badge_r = box_style["badgeRadius"]
    draw_badge(ImageDraw.Draw(image), label,
               px + box_style["badgeOffset"][0] * scale,
               py + box_style["badgeOffset"][1] * scale,
               max(8, round(badge_r * min(scale, 2.2))), color)


def annotate_one(src: Path, dst: Path, fig: dict, style: dict, inset_style: dict) -> tuple[int, int]:
    scale = fig["scale"]
    clip = fig["clip"]
    color = tuple(style["color"])
    stroke = max(1, round(style["strokeWidth"] * scale))
    radius = style["radius"] * scale
    badge_r = style["badgeRadius"] * scale
    off_x, off_y = style["badgeOffset"]

    with Image.open(src) as im:
        image = im.convert("RGBA")
    draw = ImageDraw.Draw(image)
    W, H = image.size

    placed: list[tuple[dict, tuple[float, float, float, float]]] = []
    drawn = 0

    for box in fig["boxes"]:
        # viewport CSS px -> image px, relative to this screenshot's crop
        x0 = (box["x"] - clip["x"]) * scale
        y0 = (box["y"] - clip["y"]) * scale
        x1 = x0 + box["width"] * scale
        y1 = y0 + box["height"] * scale

        # clip to the figure; skip regions that fall entirely outside
        if x1 <= 0 or y1 <= 0 or x0 >= W or y0 >= H:
            print(f"    step {box['step']}: outside figure, skipped")
            continue
        region = (max(0.0, x0), max(0.0, y0), min(float(W), x1), min(float(H), y1))
        placed.append((box, region))

    # A region that already fills much of the frame is legible as-is; zooming it
    # would only bury the figure it is meant to explain.
    eligible = []
    for b, r in placed:
        if not b.get("inset"):
            continue
        # Height is what drives the zoom: a region taller than the inset band
        # can only be shrunk, which defeats the purpose. A wide-but-short
        # region (a toolbar, a chart card) zooms perfectly well, so only height
        # and total area disqualify a region.
        rw, rh = region_size(r)
        target = int(b["inset"].get("target", inset_style["defaultTarget"]))
        # An inset only earns its place if it magnifies *and* stays small enough
        # to behave like a callout beside the control. Zooming a tall region --
        # a chart cell, say -- yields a panel most of the frame, which then has
        # nowhere to go but on top of the other callouts. Such a region is
        # legible as it stands, so it keeps its box and gets no inset.
        _, need_h, _ = desired_inset(
            r, target, W - 2 * inset_style["margin"],
            H * inset_style["bandHeight"], inset_style,
        )
        why = None
        if rw > W * inset_style["skipMaxWidth"]:
            why = f"{rw:.0f}px wide, a zoom would overflow the {W:.0f}px frame"
        elif rh > H * inset_style["skipMaxHeight"]:
            why = f"{rh:.0f}px tall, past the inset band"
        elif rw * rh > H * W * inset_style["skipMaxArea"]:
            why = f"already covers {100*rw*rh/(W*H):.0f}% of the frame"
        elif need_h > H * inset_style["maxInsetHeight"]:
            why = f"a {need_h:.0f}px panel would not read as a callout"
        if why:
            print(f"    step {b['step']}: no inset, {rw:.0f}x{rh:.0f} -- {why}")
            continue
        eligible.append((b, r, target))
    wanted = eligible[:MAX_INSETS_PER_FIGURE]
    dropped = len(eligible) - len(wanted)
    if dropped:
        print(f"    note: {dropped} inset(s) dropped, HYDE caps a figure at {MAX_INSETS_PER_FIGURE}")

    # Insets are composited first and the callout boxes on top of them, so a
    # panel can never hide the very control it is magnifying. Where the inset
    # had to overlap a box, the box and its badge still read clearly.
    if wanted:
        box_rects = [r for _, r in placed]
        for (box, region, _), (px, py, pw, ph, z) in zip(
            wanted, layout_insets(wanted, W, H, inset_style, box_rects)
        ):
            pw_i, ph_i = max(1, round(pw)), max(1, round(ph))
            print(f"    step {box['step']}: inset {pw_i}x{ph_i} at ({px:.0f},{py:.0f}) zoom {z:.1f}x")
            paste_inset(image, region, (px, py, pw_i, ph_i), str(box["step"]), z,
                        color, inset_style, style)

    draw = ImageDraw.Draw(image)
    for box, region in placed:
        x0, y0, x1, y1 = region
        draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, outline=color, width=stroke)
        # badge straddling the top-left corner, kept fully inside the figure
        cx = min(max(x0 + off_x * scale, badge_r), W - badge_r)
        cy = min(max(y0 + off_y * scale, badge_r), H - badge_r)
        draw_badge(draw, str(box["step"]), cx, cy, badge_r, color)
        drawn += 1

    image.convert("RGB").save(dst)
    return drawn, len(wanted)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dir",
        default="/home/joshua_bermas/projects/image",
        help="directory holding the captures and annotations.json",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--only", help="annotate only figures whose slug contains this")
    args = parser.parse_args()

    base = Path(args.dir)
    sidecar = base / "annotations.json"
    if not sidecar.is_file():
        raise SystemExit(f"missing {sidecar}")

    data = json.loads(sidecar.read_text())
    style = {**DEFAULT_STYLE, **data.get("style", {})}
    inset_style = {**DEFAULT_INSET_STYLE, **data.get("insetStyle", {})}
    figures = data["figures"]
    if args.only:
        figures = [f for f in figures if args.only in f["slug"]]
    print(f"{len(figures)} figures, "
          f"{sum(len(f['boxes']) for f in figures)} callouts, style={style}")

    total = insets = 0
    for idx, fig in enumerate(figures, start=1):
        src = base / fig["file"]
        # One base capture backs several callout sets, so the output name is
        # keyed on the figure index rather than the source file stem.
        dst = src.with_name(f"{src.stem}-fig{idx:02d}-{fig['slug']}-annotated.png")
        if not src.is_file():
            raise SystemExit(f"missing figure {src}")
        print(f"  fig{idx:02d} {fig['slug']}  <- {fig['file']}  ({len(fig['boxes'])} callouts)")
        if args.dry_run:
            continue
        n, k = annotate_one(src, dst, fig, style, inset_style)
        total += n
        insets += k
        print(f"          -> {dst.name}  ({n} boxes, {k} insets)")

    if not args.dry_run:
        print(f"annotated {total} callouts and {insets} insets across {len(figures)} figures")
    return 0


if __name__ == "__main__":
    sys.exit(main())