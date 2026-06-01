# -*- coding: utf-8 -*-
"""
gen-splash-belote.py v3 - Ultra-stylish splash (image background + typo dramatique).

Design v3:
  - RICH IMAGE-LIKE BACKGROUND : multi-layer gradient violet-deep-blue +
    bokeh light particles + diagonal velvet shimmer + heavy vignette
  - Three-card fan (Spades / Hearts / Clubs) in the upper center with
    drop-shadow + soft inner glow
  - HUGE "SALLY BELOTE" wordmark : double-toned (white + gold) with
    gold underline accent + soft gold halo
  - Italic gold-on-velvet tagline "L'art du pli, l'esprit du Maghreb"
  - Crown emoji + tiny "Salistar Company - sallycards.salistar.com" footer

Output: apps/mobile/belote/assets/splash.png  (1242x2436)
Also mirrored to apps-deploy/sally-belote/assets/splash.png
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance
from pathlib import Path
import math

W, H = 1242, 2436
ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")
OUT_MONO   = ROOT / "apps" / "mobile" / "belote" / "assets" / "splash.png"
OUT_DEPLOY = ROOT / "apps-deploy" / "sally-belote" / "assets" / "splash.png"

GOLD       = (252, 211, 77)
GOLD_DEEP  = (212, 175, 55)
WHITE      = (255, 255, 255)
NAVY_DEEP  = (4, 8, 32)
ROYAL      = (40, 80, 200)
PURPLE     = (90, 30, 140)


def load_font(size, bold=True):
    candidates = (
        ["segoeuib.ttf", "arialbd.ttf", "calibrib.ttf"] if bold
        else ["segoeui.ttf", "arial.ttf", "calibri.ttf"]
    )
    for fn in candidates:
        try: return ImageFont.truetype(fn, size)
        except Exception: continue
    return ImageFont.load_default()


def make_background():
    """Multi-layer rich background: radial royal-purple gradient + bokeh + velvet."""
    base = Image.new("RGB", (W, H), NAVY_DEEP)
    px = base.load()
    # radial gradient
    cx, cy = W // 2, int(H * 0.38)
    max_r = math.hypot(max(cx, W - cx), max(cy, H - cy))
    for y in range(H):
        for x in range(W):
            r = math.hypot(x - cx, y - cy)
            t = min(1.0, (r / max_r) ** 1.25)
            # 3-stop: ROYAL -> PURPLE -> NAVY_DEEP
            if t < 0.55:
                k = t / 0.55
                c1, c2 = ROYAL, PURPLE
            else:
                k = (t - 0.55) / 0.45
                c1, c2 = PURPLE, NAVY_DEEP
            r0 = int(c1[0] + (c2[0] - c1[0]) * k)
            g0 = int(c1[1] + (c2[1] - c1[1]) * k)
            b0 = int(c1[2] + (c2[2] - c1[2]) * k)
            px[x, y] = (r0, g0, b0)
    base = base.convert("RGBA")

    # Velvet diagonal shimmer (subtle)
    shimmer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shimmer)
    for i in range(-W, W * 2, 80):
        sd.line([(i, 0), (i + H, H)], fill=(255, 255, 255, 6), width=2)
    base = Image.alpha_composite(base, shimmer)

    # Bokeh particles (gold dots, varying sizes, gaussian blur)
    bokeh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bokeh)
    import random
    random.seed(42)
    for _ in range(80):
        x = random.randint(0, W)
        y = random.randint(0, H)
        r = random.randint(8, 40)
        a = random.randint(35, 110)
        bd.ellipse([x - r, y - r, x + r, y + r], fill=(255, 230, 150, a))
    bokeh = bokeh.filter(ImageFilter.GaussianBlur(radius=18))
    base = Image.alpha_composite(base, bokeh)

    # Big suit silhouettes in corners (very subtle)
    suit_font = load_font(620, bold=True)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    for (txt, pos, alpha) in [
        ("♠", (-100,  80), 18),       # spade top-left
        ("♥", (W - 540, H - 760), 22), # heart bottom-right
        ("♣", (W - 600, 60),  16),     # club  top-right
        ("♦", (-80, H - 800), 22),     # diamond bottom-left
    ]:
        ld.text(pos, txt, font=suit_font, fill=(255, 255, 255, alpha))
    base = Image.alpha_composite(base, layer)

    # Vignette (heavy bottom + corner darken)
    vign = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vign)
    for y in range(H):
        a = int(min(160, max(0, (y - H * 0.55) * 0.6)))
        vd.line([(0, y), (W, y)], fill=(0, 0, 0, a))
    base = Image.alpha_composite(base, vign)

    return base


def draw_glossy_card(suit, fill_color, w=480, h=680, angle=0):
    """A single playing card with rounded corners + suit, ready to paste rotated."""
    img = Image.new("RGBA", (w + 60, h + 60), (0, 0, 0, 0))
    # drop shadow
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle(
        [30, 40, w + 30, h + 40], radius=int(w * 0.08), fill=(0, 0, 0, 160))
    sh = sh.filter(ImageFilter.GaussianBlur(radius=18))
    img.alpha_composite(sh)
    # card body
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([30, 30, w + 30, h + 30],
                        radius=int(w * 0.08),
                        fill=(252, 252, 248, 255),
                        outline=(20, 30, 60, 255), width=5)
    # corner suit (small)
    f_small = load_font(int(h * 0.10), bold=True)
    d.text((54, 50),     suit, font=f_small, fill=fill_color + (255,))
    # bottom-right rotated small suit
    sr = Image.new("RGBA", (160, 200), (0, 0, 0, 0))
    ImageDraw.Draw(sr).text((10, 10), suit, font=f_small, fill=fill_color + (255,))
    sr = sr.rotate(180, resample=Image.BICUBIC)
    img.alpha_composite(sr, (w - 100, h - 130))
    # big center suit
    f_big = load_font(int(h * 0.50), bold=True)
    bbox = d.textbbox((0, 0), suit, font=f_big)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((img.width - bw) // 2 - bbox[0],
            (img.height - bh) // 2 - bbox[1] - 14),
           suit, font=f_big, fill=fill_color + (255,))
    # glossy diagonal highlight
    gloss = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(gloss)
    gd.polygon([(50, 35), (220, 35), (140, h + 25), (40, h + 25)],
               fill=(255, 255, 255, 28))
    gloss = gloss.filter(ImageFilter.GaussianBlur(radius=8))
    img.alpha_composite(gloss)
    # rotate
    if angle:
        img = img.rotate(angle, resample=Image.BICUBIC, expand=True)
    return img


def draw_glossy_text(text, font, fill, glow_color, glow_radius=20):
    """Render `text` with a soft outer glow then the gloss fill."""
    bbox_dummy = ImageDraw.Draw(Image.new("RGBA", (10, 10))).textbbox((0, 0), text, font=font)
    tw, th = bbox_dummy[2] - bbox_dummy[0], bbox_dummy[3] - bbox_dummy[1]
    pad = glow_radius * 2
    layer = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, 0))
    # glow pass
    glow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.text((pad - bbox_dummy[0], pad - bbox_dummy[1]), text, font=font,
            fill=glow_color + (180,))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=glow_radius))
    layer.alpha_composite(glow)
    # text shadow (subtle dark)
    sd = ImageDraw.Draw(layer)
    sd.text((pad - bbox_dummy[0] + 4, pad - bbox_dummy[1] + 6), text,
            font=font, fill=(0, 0, 0, 180))
    # main fill
    d = ImageDraw.Draw(layer)
    d.text((pad - bbox_dummy[0], pad - bbox_dummy[1]), text, font=font,
           fill=fill + (255,))
    return layer, tw, th, pad


def main():
    bg = make_background()

    # ----- 3-card fan in the upper-middle -----
    cards_y = int(H * 0.30)
    cards_x = W // 2

    spade  = draw_glossy_card("♠", (12, 22, 60),   w=520, h=720, angle=-12)
    heart  = draw_glossy_card("♥", (155, 25, 35),  w=560, h=760, angle=0)
    club   = draw_glossy_card("♣", (12, 22, 60),   w=520, h=720, angle=12)

    # paste left-spade, then right-club (behind), then heart (front)
    bg.alpha_composite(spade, (cards_x - spade.width // 2 - 220, cards_y - spade.height // 2 + 30))
    bg.alpha_composite(club,  (cards_x - club.width  // 2 + 220, cards_y - club.height  // 2 + 30))
    bg.alpha_composite(heart, (cards_x - heart.width // 2, cards_y - heart.height // 2))

    # 3 gold stars accent above the cards (Segoe Symbol is widely supported)
    star_font = None
    for fn in ("seguisym.ttf", "arial.ttf", "segoeuib.ttf"):
        try:
            star_font = ImageFont.truetype(fn, 180)
            break
        except Exception:
            continue
    if star_font is None:
        star_font = load_font(180, bold=True)
    d = ImageDraw.Draw(bg)
    stars_txt = "★ ★ ★"
    bbox = d.textbbox((0, 0), stars_txt, font=star_font)
    tw = bbox[2] - bbox[0]
    # gold halo
    halo = Image.new("RGBA", (tw + 200, 280), (0, 0, 0, 0))
    ImageDraw.Draw(halo).text((100 - bbox[0], 50 - bbox[1]), stars_txt,
                              font=star_font, fill=GOLD + (140,))
    halo = halo.filter(ImageFilter.GaussianBlur(radius=22))
    bg.alpha_composite(halo, ((W - halo.width) // 2, cards_y - 800))
    # the stars themselves
    d.text(((W - tw) // 2, cards_y - 750), stars_txt, font=star_font, fill=GOLD + (255,))

    # ----- Wordmark "SALLY BELOTE" -----
    sally_font  = load_font(140, bold=True)
    belote_font = load_font(220, bold=True)

    # SALLY (white with soft cyan glow)
    layer, tw, th, pad = draw_glossy_text("SALLY", sally_font, WHITE, (140, 200, 255), glow_radius=18)
    bg.alpha_composite(layer, ((W - tw) // 2 - pad, int(H * 0.62) - pad))

    # BELOTE (gold with warm halo)
    layer, tw, th, pad = draw_glossy_text("BELOTE", belote_font, GOLD, (252, 211, 77), glow_radius=30)
    by = int(H * 0.66)
    bg.alpha_composite(layer, ((W - tw) // 2 - pad, by - pad))

    # Gold underline accent under BELOTE
    d = ImageDraw.Draw(bg)
    underline_w = int(tw * 0.55)
    ux1 = (W - underline_w) // 2
    uy  = by + th + 35
    d.rounded_rectangle([ux1, uy, ux1 + underline_w, uy + 8], radius=4, fill=GOLD + (255,))

    # Tagline italic-looking
    sub_font = load_font(46, bold=True)
    txt = "L'art du pli  -  L'esprit du Maghreb"
    bbox = d.textbbox((0, 0), txt, font=sub_font)
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) // 2, uy + 36), txt, font=sub_font, fill=(220, 230, 255, 230))

    # Suit chips row (small)
    chip_font = load_font(56, bold=True)
    chips = ["♠", "♥", "♣", "♦"]
    chip_colors = [(20, 30, 60), (200, 30, 30), (20, 30, 60), (200, 30, 30)]
    chip_w = 90
    total_w = chip_w * 4 + 18 * 3
    sx = (W - total_w) // 2
    for i, (c, col) in enumerate(zip(chips, chip_colors)):
        x = sx + i * (chip_w + 18)
        y = uy + 130
        # gold chip
        ImageDraw.Draw(bg).rounded_rectangle(
            [x, y, x + chip_w, y + chip_w],
            radius=18, fill=(252, 250, 240, 240),
            outline=GOLD + (255,), width=3)
        # suit char centered
        cbox = ImageDraw.Draw(bg).textbbox((0, 0), c, font=chip_font)
        cw, ch = cbox[2] - cbox[0], cbox[3] - cbox[1]
        ImageDraw.Draw(bg).text(
            (x + (chip_w - cw) // 2 - cbox[0],
             y + (chip_w - ch) // 2 - cbox[1] - 4),
            c, font=chip_font, fill=col + (255,))

    # ----- Footer -----
    foot_font = load_font(34, bold=False)
    txt = "Salistar Company  -  sallycards.salistar.com"
    bbox = d.textbbox((0, 0), txt, font=foot_font)
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) // 2, H - 120), txt, font=foot_font, fill=(255, 255, 255, 170))

    bg.convert("RGB").save(OUT_MONO, "PNG", optimize=True)
    print(f"OK -> {OUT_MONO}  ({OUT_MONO.stat().st_size // 1024} KB)")
    bg.convert("RGB").save(OUT_DEPLOY, "PNG", optimize=True)
    print(f"OK -> {OUT_DEPLOY}  ({OUT_DEPLOY.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
