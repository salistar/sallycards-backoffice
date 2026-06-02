# -*- coding: utf-8 -*-
"""
gen-splash-v6-design.py — Premium splash v6 for 5 apps per design spec.

Design constraints:
- Belote: CARDS FAN (Spanish deck — keep gold accents)
- Okey:   TILES rack (NO CARDS) — 3 colored tiles 13/7/5
- Quiestce: CHARACTER PORTRAITS (NO CARDS) — 4 portraits 2x2 grid
- Scopa:  CARDS FAN (Spanish deck — bronze accents)
- Tarot:  CARDS FAN (with gold mystical aura)

Gradient backgrounds + 3 gold stars + wordmark + tagline.
Outputs to apps/mobile/<slug>/assets/splash.png + apps-deploy/sally-<slug>/assets/splash.png
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pathlib import Path
import random

W, H = 1242, 2436
ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")

# (slug, bg_top, bg_bot, accent, title, tagline, visual_kind)
APPS = [
    ("belote",   "#3B82F6", "#1E40AF", "#FFD700", "BÉLOTE",      "Classique · Coinche · Marocaine",   "cards"),
    ("okey",     "#10B981", "#047857", "#FCD34D", "OKEY",        "Tiles · Sets · Runs",                "tiles"),
    ("quiestce", "#6366F1", "#4338CA", "#FF6B9D", "QUI EST-CE?", "Guess · Deduce · Win",               "characters"),
    ("scopa",    "#059669", "#065F46", "#B87333", "SCOPA",       "Capture · Settebello · Primiera",   "cards-scopa"),
    ("tarot",    "#8B5CF6", "#6D28D9", "#FFD700", "TAROT",       "Petite · Garde · Chelem",            "cards-tarot"),
]

WHITE = (255, 255, 255)


def load_font(size, bold=True):
    cand = (["segoeuib.ttf", "arialbd.ttf", "calibrib.ttf"] if bold
            else ["segoeui.ttf", "arial.ttf", "calibri.ttf"])
    for fn in cand:
        try:
            return ImageFont.truetype(fn, size)
        except Exception:
            continue
    return ImageFont.load_default()


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def make_gradient_bg(top_rgb, bot_rgb):
    """45° gradient — actually a simple top-to-bottom for splash robustness."""
    base = Image.new("RGB", (W, H), top_rgb)
    px = base.load()
    for y in range(H):
        t = y / H
        r = int(top_rgb[0] * (1 - t) + bot_rgb[0] * t)
        g = int(top_rgb[1] * (1 - t) + bot_rgb[1] * t)
        b = int(top_rgb[2] * (1 - t) + bot_rgb[2] * t)
        for x in range(W):
            px[x, y] = (r, g, b)
    return base.convert("RGBA")


def add_glow_and_bokeh(base, accent_hex, seed=7):
    """Soft accent glow + bokeh particles."""
    accent_rgb = hex_to_rgb(accent_hex)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = W // 2, int(H * 0.42)
    for r in range(820, 0, -40):
        a = int(30 * (1 - r / 820) ** 1.5)
        gd.ellipse([cx - r, cy - r, cx + r, cy + r],
                   fill=(accent_rgb[0], accent_rgb[1], accent_rgb[2], a))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=80))
    base = Image.alpha_composite(base, glow)

    # Bokeh
    bokeh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bokeh)
    random.seed(seed)
    for _ in range(40):
        x = random.randint(0, W)
        y = random.randint(0, H)
        r = random.randint(10, 35)
        a = random.randint(20, 60)
        bd.ellipse([x - r, y - r, x + r, y + r], fill=(255, 230, 150, a))
    bokeh = bokeh.filter(ImageFilter.GaussianBlur(radius=22))
    return Image.alpha_composite(base, bokeh)


def draw_card(size, suit, fill_color):
    """Single rounded playing card with corner+center suit symbol."""
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
    f_big = load_font(int(h * 0.50), bold=True)
    bbox = d.textbbox((0, 0), suit, font=f_big)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((img.width - bw) // 2 - bbox[0], (img.height - bh) // 2 - bbox[1] - 14),
           suit, font=f_big, fill=fill_color + (255,))
    return img


def draw_tile(size, number, color_top, color_bot, num_fill):
    """Single Okey tile — gradient rectangle with bold number."""
    w, h = size
    img = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    # Shadow
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle(
        [20, 30, w + 20, h + 30], radius=int(w * 0.10), fill=(0, 0, 0, 160))
    sh = sh.filter(ImageFilter.GaussianBlur(radius=20))
    img.alpha_composite(sh)
    # Tile body gradient
    tile = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    tp = tile.load()
    for y in range(h):
        t = y / h
        r = int(color_top[0] * (1 - t) + color_bot[0] * t)
        g = int(color_top[1] * (1 - t) + color_bot[1] * t)
        b = int(color_top[2] * (1 - t) + color_bot[2] * t)
        for x in range(w):
            tp[x, y] = (r, g, b, 255)
    # Round corners by masking
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w, h], radius=int(w * 0.10), fill=255)
    tile.putalpha(mask)
    # Inner highlight panel
    inner = Image.new("RGBA", (w - 30, h - 30), (255, 255, 255, 30))
    inner_mask = Image.new("L", inner.size, 0)
    ImageDraw.Draw(inner_mask).rounded_rectangle([0, 0, inner.size[0], inner.size[1]],
                                                  radius=int(w * 0.07), fill=255)
    inner.putalpha(inner_mask)
    tile.alpha_composite(inner, (15, 15))
    # Number
    td = ImageDraw.Draw(tile)
    nf = load_font(int(h * 0.55), bold=True)
    bbox = td.textbbox((0, 0), str(number), font=nf)
    nw, nh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    td.text(((w - nw) // 2 - bbox[0], (h - nh) // 2 - bbox[1] - 8),
            str(number), font=nf, fill=num_fill + (255,))
    img.alpha_composite(tile, (20, 20))
    return img


def draw_character_portrait(size, initial, bg_top, bg_bot, accent_rgb):
    """Single character portrait — colored rounded card with initial + face suggestion."""
    w, h = size
    img = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    # Shadow
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle(
        [20, 30, w + 20, h + 30], radius=int(w * 0.12), fill=(0, 0, 0, 150))
    sh = sh.filter(ImageFilter.GaussianBlur(radius=18))
    img.alpha_composite(sh)
    # Card body gradient
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cp = card.load()
    for y in range(h):
        t = y / h
        r = int(bg_top[0] * (1 - t) + bg_bot[0] * t)
        g = int(bg_top[1] * (1 - t) + bg_bot[1] * t)
        b = int(bg_top[2] * (1 - t) + bg_bot[2] * t)
        for x in range(w):
            cp[x, y] = (r, g, b, 255)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w, h], radius=int(w * 0.12), fill=255)
    card.putalpha(mask)
    cd = ImageDraw.Draw(card)
    # Face circle (suggestion of avatar)
    face_r = int(w * 0.25)
    face_cx, face_cy = w // 2, int(h * 0.35)
    cd.ellipse([face_cx - face_r, face_cy - face_r,
                face_cx + face_r, face_cy + face_r], fill=accent_rgb + (220,))
    # Inner face highlight
    inner_r = int(face_r * 0.85)
    cd.ellipse([face_cx - inner_r, face_cy - inner_r,
                face_cx + inner_r, face_cy + inner_r], fill=(255, 235, 205, 255))
    # Eyes
    eye_r = int(w * 0.04)
    eye_dx = int(w * 0.10)
    eye_y = face_cy - int(w * 0.05)
    cd.ellipse([face_cx - eye_dx - eye_r, eye_y - eye_r,
                face_cx - eye_dx + eye_r, eye_y + eye_r], fill=(40, 30, 60, 255))
    cd.ellipse([face_cx + eye_dx - eye_r, eye_y - eye_r,
                face_cx + eye_dx + eye_r, eye_y + eye_r], fill=(40, 30, 60, 255))
    # Smile
    smile_y = face_cy + int(w * 0.10)
    cd.arc([face_cx - int(w * 0.12), smile_y - int(w * 0.06),
            face_cx + int(w * 0.12), smile_y + int(w * 0.08)],
           start=20, end=160, fill=(60, 30, 30, 255), width=4)
    # Initial badge bottom
    nf = load_font(int(h * 0.16), bold=True)
    bbox = cd.textbbox((0, 0), initial, font=nf)
    nw = bbox[2] - bbox[0]
    cd.text(((w - nw) // 2 - bbox[0], int(h * 0.75) - bbox[1]),
            initial, font=nf, fill=(255, 255, 255, 255))
    img.alpha_composite(card, (20, 20))
    return img


def render_cards_belote(base, cards_y):
    """3-card fan: ♠ ♥ ♣ (Spanish-style with gold)."""
    suits = [("♠", (12, 22, 60)), ("♥", (155, 25, 35)), ("♣", (12, 22, 60))]
    cw, ch = 520, 720
    mid_w, mid_h = 560, 760
    left = draw_card((cw, ch), suits[0][0], suits[0][1])
    mid = draw_card((mid_w, mid_h), suits[1][0], suits[1][1])
    right = draw_card((cw, ch), suits[2][0], suits[2][1])
    left = left.rotate(-15, resample=Image.BICUBIC, expand=True)
    right = right.rotate(15, resample=Image.BICUBIC, expand=True)
    base.alpha_composite(left, (W // 2 - left.width // 2 - 240, cards_y - left.height // 2 + 30))
    base.alpha_composite(right, (W // 2 - right.width // 2 + 240, cards_y - right.height // 2 + 30))
    base.alpha_composite(mid, (W // 2 - mid.width // 2, cards_y - mid.height // 2))


def render_tiles_okey(base, cards_y):
    """3 tiles: Red 13, Blue 7, Yellow 5 — Okey tile rack (NO CARDS)."""
    tile_w, tile_h = 380, 520
    mid_w, mid_h = 420, 580
    red_top, red_bot = (239, 68, 68), (153, 27, 27)
    blue_top, blue_bot = (59, 130, 246), (30, 58, 138)
    yel_top, yel_bot = (252, 211, 77), (217, 119, 6)
    left = draw_tile((tile_w, tile_h), 13, red_top, red_bot, (255, 255, 255))
    mid = draw_tile((mid_w, mid_h), 7, blue_top, blue_bot, (255, 255, 255))
    right = draw_tile((tile_w, tile_h), 5, yel_top, yel_bot, (60, 30, 5))
    left = left.rotate(-10, resample=Image.BICUBIC, expand=True)
    right = right.rotate(10, resample=Image.BICUBIC, expand=True)
    base.alpha_composite(left, (W // 2 - left.width // 2 - 240, cards_y - left.height // 2 + 30))
    base.alpha_composite(right, (W // 2 - right.width // 2 + 240, cards_y - right.height // 2 + 30))
    base.alpha_composite(mid, (W // 2 - mid.width // 2, cards_y - mid.height // 2))


def render_characters_quiestce(base, cards_y):
    """4 character portraits in 2x2 grid — Sophie / Pierre / Maria / Jean (NO CARDS)."""
    pw, ph = 360, 460
    indigo_top, indigo_bot = (99, 102, 241), (67, 56, 202)
    pink_top, pink_bot = (255, 107, 157), (192, 38, 211)
    sky_top, sky_bot = (129, 140, 248), (79, 70, 229)
    rose_top, rose_bot = (244, 114, 182), (190, 24, 93)
    sophie = draw_character_portrait((pw, ph), "S", indigo_top, indigo_bot, (252, 211, 77))
    pierre = draw_character_portrait((pw, ph), "P", pink_top, pink_bot, (165, 180, 252))
    maria = draw_character_portrait((pw, ph), "M", sky_top, sky_bot, (251, 207, 232))
    jean = draw_character_portrait((pw, ph), "J", rose_top, rose_bot, (147, 197, 253))
    gap_x, gap_y = 40, 40
    grid_w = 2 * pw + gap_x
    grid_h = 2 * ph + gap_y
    x0 = (W - grid_w) // 2
    y0 = cards_y - grid_h // 2
    base.alpha_composite(sophie, (x0 - 20, y0 - 20))
    base.alpha_composite(pierre, (x0 + pw + gap_x - 20, y0 - 20))
    base.alpha_composite(maria, (x0 - 20, y0 + ph + gap_y - 20))
    base.alpha_composite(jean, (x0 + pw + gap_x - 20, y0 + ph + gap_y - 20))


def render_cards_scopa(base, cards_y):
    """3-card fan with Italian deck symbols (Coppe / Spade / Bastoni)."""
    suits = [("🪙", (155, 100, 25)), ("☘", (12, 80, 30)), ("⚔", (60, 60, 130))]
    cw, ch = 520, 720
    mid_w, mid_h = 560, 760
    left = draw_card((cw, ch), suits[0][0], suits[0][1])
    mid = draw_card((mid_w, mid_h), suits[1][0], suits[1][1])
    right = draw_card((cw, ch), suits[2][0], suits[2][1])
    left = left.rotate(-12, resample=Image.BICUBIC, expand=True)
    right = right.rotate(12, resample=Image.BICUBIC, expand=True)
    base.alpha_composite(left, (W // 2 - left.width // 2 - 220, cards_y - left.height // 2 + 30))
    base.alpha_composite(right, (W // 2 - right.width // 2 + 220, cards_y - right.height // 2 + 30))
    base.alpha_composite(mid, (W // 2 - mid.width // 2, cards_y - mid.height // 2))


def render_cards_tarot(base, cards_y):
    """3-card fan: King / Queen / Knight (Tarot Major Arcana style)."""
    suits = [("♚", (12, 22, 60)), ("♛", (155, 25, 35)), ("♜", (12, 22, 60))]
    cw, ch = 520, 720
    mid_w, mid_h = 560, 760
    left = draw_card((cw, ch), suits[0][0], suits[0][1])
    mid = draw_card((mid_w, mid_h), suits[1][0], suits[1][1])
    right = draw_card((cw, ch), suits[2][0], suits[2][1])
    left = left.rotate(-12, resample=Image.BICUBIC, expand=True)
    right = right.rotate(12, resample=Image.BICUBIC, expand=True)
    base.alpha_composite(left, (W // 2 - left.width // 2 - 220, cards_y - left.height // 2 + 30))
    base.alpha_composite(right, (W // 2 - right.width // 2 + 220, cards_y - right.height // 2 + 30))
    base.alpha_composite(mid, (W // 2 - mid.width // 2, cards_y - mid.height // 2))


def render_stars(base, accent_rgb, cards_y):
    """3 gold stars above the visual."""
    star_font = None
    for fn in ("seguisym.ttf", "arial.ttf", "segoeuib.ttf"):
        try:
            star_font = ImageFont.truetype(fn, 180)
            break
        except Exception:
            continue
    if star_font is None:
        star_font = load_font(180, bold=True)
    d = ImageDraw.Draw(base)
    stars_txt = "★ ★ ★"
    bbox = d.textbbox((0, 0), stars_txt, font=star_font)
    tw = bbox[2] - bbox[0]
    halo = Image.new("RGBA", (tw + 200, 280), (0, 0, 0, 0))
    ImageDraw.Draw(halo).text((100 - bbox[0], 50 - bbox[1]), stars_txt,
                              font=star_font, fill=accent_rgb + (140,))
    halo = halo.filter(ImageFilter.GaussianBlur(radius=22))
    base.alpha_composite(halo, ((W - halo.width) // 2, cards_y - 800))
    d.text(((W - tw) // 2, cards_y - 750), stars_txt, font=star_font, fill=accent_rgb + (255,))


def render_wordmark(base, title, tagline, accent_rgb):
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
    d.text(((W - tw) // 2, by), title, font=title_font, fill=accent_rgb + (255,))
    # Underline
    underline_w = int(tw * 0.55)
    ux1 = (W - underline_w) // 2
    th = bbox[3] - bbox[1]
    uy = by + th + 35
    d.rounded_rectangle([ux1, uy, ux1 + underline_w, uy + 8], radius=4, fill=accent_rgb + (255,))
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


def make_splash(slug, bg_top_hex, bg_bot_hex, accent_hex, title, tagline, visual_kind):
    top_rgb = hex_to_rgb(bg_top_hex)
    bot_rgb = hex_to_rgb(bg_bot_hex)
    accent_rgb = hex_to_rgb(accent_hex)
    base = make_gradient_bg(top_rgb, bot_rgb)
    base = add_glow_and_bokeh(base, accent_hex, seed=hash(slug) & 0xFF)
    cards_y = int(H * 0.30)
    render_stars(base, accent_rgb, cards_y)
    if visual_kind == "cards":
        render_cards_belote(base, cards_y)
    elif visual_kind == "tiles":
        render_tiles_okey(base, cards_y)
    elif visual_kind == "characters":
        render_characters_quiestce(base, cards_y)
    elif visual_kind == "cards-scopa":
        render_cards_scopa(base, cards_y)
    elif visual_kind == "cards-tarot":
        render_cards_tarot(base, cards_y)
    render_wordmark(base, title, tagline, accent_rgb)
    out_mono = ROOT / "apps" / "mobile" / slug / "assets" / "splash.png"
    out_deploy = ROOT / "apps-deploy" / f"sally-{slug}" / "assets" / "splash.png"
    out_mono.parent.mkdir(parents=True, exist_ok=True)
    out_deploy.parent.mkdir(parents=True, exist_ok=True)
    final = base.convert("RGB")
    final.save(out_mono, "PNG", optimize=True)
    final.save(out_deploy, "PNG", optimize=True)
    print(f"  OK {slug}: {out_mono.stat().st_size // 1024} KB")


if __name__ == "__main__":
    for app in APPS:
        make_splash(*app)
    print("DONE v6")
