# -*- coding: utf-8 -*-
"""Generate splash v5 for Tarot + Scopa (same style as Belote v5)."""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pathlib import Path
import random

W, H = 1242, 2436
ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")

# bg color must match app.json backgroundColor for invisible boundary
APPS = [
    # slug,         bg_hex,    accent_hex, title,        tagline
    ("tarot",       "#1E1145",  "#FCD34D",  "TAROT",      "Petite · Garde · Chelem"),
    ("scopa",       "#0A2F1A",  "#FCD34D",  "SCOPA",      "Capture · Settebello · Primiera"),
]

GOLD = (252, 211, 77)
WHITE = (255, 255, 255)


def load_font(size, bold=True):
    cand = (["segoeuib.ttf","arialbd.ttf","calibrib.ttf"] if bold
            else ["segoeui.ttf","arial.ttf","calibri.ttf"])
    for fn in cand:
        try: return ImageFont.truetype(fn, size)
        except Exception: continue
    return ImageFont.load_default()


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def draw_card(size, suit, fill_color):
    w, h = size
    img = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle(
        [20, 30, w + 20, h + 30], radius=int(w * 0.07), fill=(0, 0, 0, 140))
    sh = sh.filter(ImageFilter.GaussianBlur(radius=18))
    img.alpha_composite(sh)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([20, 20, w + 20, h + 20],
                        radius=int(w * 0.07),
                        fill=(252, 252, 248, 255),
                        outline=(20, 30, 60, 255), width=5)
    f_small = load_font(int(h * 0.10), bold=True)
    d.text((54, 50), suit, font=f_small, fill=fill_color + (255,))
    sr = Image.new("RGBA", (160, 200), (0, 0, 0, 0))
    ImageDraw.Draw(sr).text((10, 10), suit, font=f_small, fill=fill_color + (255,))
    sr = sr.rotate(180, resample=Image.BICUBIC)
    img.alpha_composite(sr, (w - 100, h - 130))
    f_big = load_font(int(h * 0.50), bold=True)
    bbox = d.textbbox((0, 0), suit, font=f_big)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((img.width - bw) // 2 - bbox[0], (img.height - bh) // 2 - bbox[1] - 14),
           suit, font=f_big, fill=fill_color + (255,))
    return img


def make_splash(slug, bg_hex, accent_hex, title, tagline):
    BG = hex_to_rgb(bg_hex)
    base = Image.new("RGBA", (W, H), BG + (255,))

    # Soft radial highlight
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = W // 2, int(H * 0.42)
    accent_rgb = hex_to_rgb(accent_hex)
    for r in range(820, 0, -40):
        a = int(28 * (1 - r / 820) ** 1.5)
        gd.ellipse([cx - r, cy - r, cx + r, cy + r],
                   fill=(accent_rgb[0], accent_rgb[1], accent_rgb[2], a))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=80))
    base = Image.alpha_composite(base, glow)

    # Bokeh
    bokeh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bokeh)
    random.seed(7 if slug == "tarot" else 11)
    for _ in range(35):
        x = random.randint(0, W); y = random.randint(0, H)
        r = random.randint(10, 35); a = random.randint(20, 60)
        bd.ellipse([x - r, y - r, x + r, y + r], fill=(255, 230, 150, a))
    bokeh = bokeh.filter(ImageFilter.GaussianBlur(radius=22))
    base = Image.alpha_composite(base, bokeh)

    # 3 gold stars at top
    star_font = None
    for fn in ("seguisym.ttf", "arial.ttf", "segoeuib.ttf"):
        try: star_font = ImageFont.truetype(fn, 180); break
        except Exception: continue
    if star_font is None: star_font = load_font(180, bold=True)
    d = ImageDraw.Draw(base)
    stars_txt = "★ ★ ★"
    bbox = d.textbbox((0, 0), stars_txt, font=star_font)
    tw = bbox[2] - bbox[0]
    halo = Image.new("RGBA", (tw + 200, 280), (0, 0, 0, 0))
    ImageDraw.Draw(halo).text((100 - bbox[0], 50 - bbox[1]), stars_txt,
                              font=star_font, fill=GOLD + (140,))
    halo = halo.filter(ImageFilter.GaussianBlur(radius=22))
    cards_y = int(H * 0.30)
    base.alpha_composite(halo, ((W - halo.width) // 2, cards_y - 800))
    d.text(((W - tw) // 2, cards_y - 750), stars_txt, font=star_font, fill=GOLD + (255,))

    # 3-card fan (different suits per app)
    if slug == "tarot":
        suits = [("♚", (12, 22, 60)), ("♛", (155, 25, 35)), ("♜", (12, 22, 60))]
    else:  # scopa: napoletan suits represented by symbols
        suits = [("🪙", (155, 100, 25)), ("☘", (12, 80, 30)), ("⚔", (60, 60, 130))]
    cw, ch = 520, 720
    ch_mid_w, ch_mid_h = 560, 760
    cards_x = W // 2
    left  = draw_card((cw, ch), suits[0][0], suits[0][1])
    mid   = draw_card((ch_mid_w, ch_mid_h), suits[1][0], suits[1][1])
    right = draw_card((cw, ch), suits[2][0], suits[2][1])
    left  = left.rotate(-12, resample=Image.BICUBIC, expand=True)
    right = right.rotate(12, resample=Image.BICUBIC, expand=True)
    base.alpha_composite(left, (cards_x - left.width // 2 - 220, cards_y - left.height // 2 + 30))
    base.alpha_composite(right,(cards_x - right.width// 2 + 220, cards_y - right.height// 2 + 30))
    base.alpha_composite(mid, (cards_x - mid.width // 2, cards_y - mid.height // 2))

    # Wordmark: SALLY + TITLE (gold)
    d = ImageDraw.Draw(base)
    sally_font = load_font(140, bold=True)
    title_font = load_font(220, bold=True)
    txt = "SALLY"
    bbox = d.textbbox((0, 0), txt, font=sally_font)
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) // 2, int(H * 0.62)), txt, font=sally_font, fill=WHITE + (240,))
    bbox = d.textbbox((0, 0), title, font=title_font)
    tw = bbox[2] - bbox[0]
    by = int(H * 0.66)
    d.text(((W - tw) // 2 + 6, by + 6), title, font=title_font, fill=(0, 0, 0, 140))
    d.text(((W - tw) // 2, by), title, font=title_font, fill=GOLD)
    # Gold underline
    underline_w = int(tw * 0.55)
    ux1 = (W - underline_w) // 2
    th = bbox[3] - bbox[1]
    uy = by + th + 35
    d.rounded_rectangle([ux1, uy, ux1 + underline_w, uy + 8], radius=4, fill=GOLD + (255,))
    # Tagline
    sub_font = load_font(46, bold=True)
    bbox = d.textbbox((0, 0), tagline, font=sub_font)
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) // 2, uy + 36), tagline, font=sub_font, fill=(220, 230, 255, 230))
    # Footer
    foot_font = load_font(34, bold=False)
    foot_txt = "Salistar Company  -  sallycards.salistar.com"
    bbox = d.textbbox((0, 0), foot_txt, font=foot_font)
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) // 2, H - 110), foot_txt, font=foot_font, fill=(255, 255, 255, 170))

    out_mono   = ROOT / "apps" / "mobile" / slug / "assets" / "splash.png"
    out_deploy = ROOT / "apps-deploy" / f"sally-{slug}" / "assets" / "splash.png"
    base.convert("RGB").save(out_mono, "PNG", optimize=True)
    base.convert("RGB").save(out_deploy, "PNG", optimize=True)
    print(f"  OK {slug}: {out_mono.stat().st_size // 1024} KB")


for app in APPS:
    make_splash(*app)
