# -*- coding: utf-8 -*-
"""
gen-splash-belote.py - Generate a polished splash screen for Belote.

Output: apps/mobile/belote/assets/splash.png  (1242x2436, iOS+Android universal)

Design:
- Deep blue/navy gradient background (matches app primary #2563EB)
- Subtle radial spotlight at center
- Hand of 4 fanned cards in the lower-middle (king/queen/jack/ace silhouettes)
- "Sally" + "Belote" wordmark stacked at top-center
- Strapline "Bluff · Strategie · Victoire" under the wordmark
- "Salistar Company" footer

Reused for both monorepo and deploy.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pathlib import Path
import math

W, H = 1242, 2436
ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")
OUT_MONO = ROOT / "apps" / "mobile" / "belote" / "assets" / "splash.png"
OUT_DEPLOY = ROOT / "apps-deploy" / "sally-belote" / "assets" / "splash.png"

# ---------- helpers ----------

def load_font(size, bold=True):
    for fn in (["segoeuib.ttf","arialbd.ttf","calibrib.ttf"] if bold
               else ["segoeui.ttf","arial.ttf","calibri.ttf"]):
        try: return ImageFont.truetype(fn, size)
        except Exception: continue
    return ImageFont.load_default()


def linear_gradient(size, c_top, c_bot):
    img = Image.new("RGB", size, c_top)
    d = ImageDraw.Draw(img)
    w, h = size
    for y in range(h):
        t = y / (h - 1)
        r = int(c_top[0] + (c_bot[0] - c_top[0]) * t)
        g = int(c_top[1] + (c_bot[1] - c_top[1]) * t)
        b = int(c_top[2] + (c_bot[2] - c_top[2]) * t)
        d.line([(0, y), (w, y)], fill=(r, g, b))
    return img


def radial_glow(size, center, radius, color, max_alpha=120):
    w, h = size
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    cx, cy = center
    # cheap radial: concentric ellipses with decreasing alpha
    for r in range(radius, 0, -8):
        a = int(max_alpha * (1 - r / radius) ** 1.6)
        d.ellipse([cx - r, cy - r, cx + r, cy + r],
                  fill=(color[0], color[1], color[2], a))
    return glow.filter(ImageFilter.GaussianBlur(radius=30))


def draw_card(img, cx, cy, angle_deg, w, h, fill, border=(255,255,255), suit=None):
    """Draw a stylized card (rounded rect) rotated around (cx, cy)."""
    card = Image.new("RGBA", (w + 60, h + 60), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    # card body
    cd.rounded_rectangle([30, 30, w + 30, h + 30], radius=int(w * 0.10),
                         fill=fill, outline=border, width=6)
    # inner decoration: corner indices + center suit
    if suit:
        # corner top-left
        f_small = load_font(int(w * 0.18), bold=True)
        cd.text((52, 50), suit, font=f_small, fill=border)
        # corner bottom-right (rotated)
        f_med = load_font(int(w * 0.50), bold=True)
        bbox = cd.textbbox((0, 0), suit, font=f_med)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        cd.text(((w + 60 - tw) // 2, (h + 60 - th) // 2 - 20),
                suit, font=f_med, fill=border)
    # shadow underneath
    shadow = Image.new("RGBA", card.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([35, 40, w + 35, h + 40], radius=int(w * 0.10),
                         fill=(0, 0, 0, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=12))
    # rotate both
    card = card.rotate(angle_deg, resample=Image.BICUBIC, expand=True)
    shadow = shadow.rotate(angle_deg, resample=Image.BICUBIC, expand=True)
    # paste centered
    px = cx - card.width // 2
    py = cy - card.height // 2
    img.alpha_composite(shadow, (px + 8, py + 12))
    img.alpha_composite(card, (px, py))


# ---------- main ----------

def main():
    # Background
    bg = linear_gradient((W, H), (37, 99, 235), (10, 20, 50))   # #2563EB -> deep navy
    base = bg.convert("RGBA")

    # Spotlight glow behind the card fan
    glow = radial_glow((W, H), (W // 2, int(H * 0.62)),
                       radius=800, color=(120, 180, 255), max_alpha=70)
    base = Image.alpha_composite(base, glow)

    # Decorative suit watermarks (very subtle, in corners)
    df = ImageDraw.Draw(base)
    big_font = load_font(500, bold=True)
    for (txt, pos, alpha) in [
        ("♠", (-60, 80),  18),       # spade top-left
        ("♥", (W - 420, H - 600), 16), # heart bottom-right
        ("♣", (W - 480, 60),  14),    # club top-right
        ("♦", (-40, H - 620), 16),    # diamond bottom-left
    ]:
        wm = Image.new("RGBA", (520, 520), (0, 0, 0, 0))
        wd = ImageDraw.Draw(wm)
        wd.text((0, 0), txt, font=big_font, fill=(255, 255, 255, alpha))
        base.alpha_composite(wm, pos)

    # Wordmark top
    title_font_sally  = load_font(160, bold=True)
    title_font_belote = load_font(220, bold=True)
    tagline_font      = load_font(60, bold=True)
    footer_font       = load_font(46, bold=False)

    df = ImageDraw.Draw(base)

    # "SALLY"
    txt = "SALLY"
    bbox = df.textbbox((0, 0), txt, font=title_font_sally)
    tw = bbox[2] - bbox[0]
    df.text(((W - tw) // 2, 360), txt, font=title_font_sally,
            fill=(255, 255, 255, 230))
    # "BELOTE"
    txt = "BELOTE"
    bbox = df.textbbox((0, 0), txt, font=title_font_belote)
    tw = bbox[2] - bbox[0]
    # text shadow first
    df.text(((W - tw) // 2 + 6, 520 + 6), txt, font=title_font_belote, fill=(0, 0, 0, 140))
    df.text(((W - tw) // 2, 520), txt, font=title_font_belote, fill=(252, 211, 77))   # gold accent

    # Tagline
    txt = "BLUFF · STRATEGIE · VICTOIRE"
    bbox = df.textbbox((0, 0), txt, font=tagline_font)
    tw = bbox[2] - bbox[0]
    df.text(((W - tw) // 2, 800), txt, font=tagline_font,
            fill=(180, 210, 255, 230))

    # Fanned hand of 4 cards
    cy = int(H * 0.62)
    cx = W // 2
    card_w, card_h = 420, 600
    spread = 90    # px gap
    spec = [
        (-18, "♠", (8, 26, 70)),      # spade (left-most, navy)
        (-6,  "♥", (155, 25, 25)),    # heart (red)
        (6,   "♣", (8, 26, 70)),      # club  (navy)
        (18,  "♦", (155, 25, 25)),    # diamond (red)
    ]
    for i, (angle, suit, accent) in enumerate(spec):
        x = int(cx + (i - 1.5) * spread)
        y = int(cy + abs(i - 1.5) * 14)
        draw_card(base, x, y,
                  angle_deg=angle, w=card_w, h=card_h,
                  fill=(255, 255, 255, 255),
                  border=accent, suit=suit)

    # Footer
    txt = "Salistar Company · sallycards.salistar.com"
    bbox = df.textbbox((0, 0), txt, font=footer_font)
    tw = bbox[2] - bbox[0]
    df.text(((W - tw) // 2, H - 160), txt, font=footer_font,
            fill=(255, 255, 255, 180))

    base.convert("RGB").save(OUT_MONO, "PNG", optimize=True)
    print(f"OK -> {OUT_MONO}  ({OUT_MONO.stat().st_size//1024} KB)")
    # mirror to deploy repo
    base.convert("RGB").save(OUT_DEPLOY, "PNG", optimize=True)
    print(f"OK -> {OUT_DEPLOY}  ({OUT_DEPLOY.stat().st_size//1024} KB)")


if __name__ == "__main__":
    main()
