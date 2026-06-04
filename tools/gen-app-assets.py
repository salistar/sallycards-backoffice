# -*- coding: utf-8 -*-
"""Genere les assets PNG par-app : splash.png + google-g.png.

- google-g.png : logo officiel 4 couleurs Google (192x192 ; copie identique
  dans chaque app -> assets/google-g.png).
- splash.png : 1242x2436 PNG avec dégradé de la couleur primaire de l'app
  + watermarks de cartes pour un look "table de jeu". Chaque app a donc un
  splash unique.
"""
import os, sys, math, random
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS_DIR = os.path.join(ROOT, "apps", "mobile")

# Couleurs/themes par app (extraits de chaque app.config.ts)
APPS = {
    "ronda":         {"name": "Ronda",         "color": "#10B981", "card": "12O"},
    "kdoub":         {"name": "Kdoub",         "color": "#C084FC", "card": "1O"},
    "belote":        {"name": "Belote",        "color": "#3B82F6", "card": "12E"},
    "tarot":         {"name": "Tarot",         "color": "#A855F7", "card": "12C"},
    "scopa":         {"name": "Scopa",         "color": "#F59E0B", "card": "7O"},
    "okey":          {"name": "Okey",          "color": "#06B6D4", "card": "11B"},
    "quiestce":      {"name": "Qui Est-Ce ?",  "color": "#F97316", "card": "12O"},
    "poker":         {"name": "Poker",         "color": "#EF4444", "card": "1E"},
    "concentration": {"name": "Concentration", "color": "#EC4899", "card": "10E"},
    "kantcopy":      {"name": "Kant Copy",     "color": "#0F766E", "card": "3O"},
    "solitaire":     {"name": "Solitaire",     "color": "#14B8A6", "card": "1B"},
}

# Liste de cartes pour les watermarks (varies par app via seed du nom)
ALL_CARDS = [f"{n}{s}" for s in "BCEO" for n in (1, 7, 10, 11, 12)]


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def darken(rgb, k=0.45):
    return tuple(int(c * k) for c in rgb)


def lighten(rgb, k=0.3):
    return tuple(min(255, int(c + (255 - c) * k)) for c in rgb)


def gen_google_g(path):
    """Logo Google G 4 couleurs (anti-alias x4)."""
    SCALE = 4
    S = 192 * SCALE
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = cy = S // 2
    R = int(S * 0.45)
    W = int(S * 0.17)

    BLUE = (66, 133, 244, 255)
    RED = (234, 67, 53, 255)
    YELLOW = (251, 188, 5, 255)
    GREEN = (52, 168, 83, 255)

    def sec(c1, c2, color):
        d.arc((cx - R, cy - R, cx + R, cy + R), c1, c2, fill=color, width=W)

    # Secteurs : 0=East -> 90=South -> 180=West -> 270=North
    # Ouverture du G : 295° -> 5° (haut-droite)
    sec(5, 65, BLUE)
    sec(65, 145, GREEN)
    sec(145, 215, YELLOW)
    sec(215, 295, RED)

    # Barre horizontale bleue + cap arrondi
    bar_h = int(W * 0.95)
    bar_w_end = cx + R + int(W * 0.05)
    d.rectangle((cx + int(R * 0.12), cy - bar_h // 2,
                 bar_w_end, cy + bar_h // 2), fill=BLUE)
    d.ellipse((bar_w_end - bar_h, cy - bar_h // 2,
               bar_w_end, cy + bar_h // 2), fill=BLUE)

    out = im.resize((192, 192), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    out.save(path, optimize=True)
    return os.path.getsize(path)


def load_card(app_slug, code, size):
    """Charge une carte depuis assets/cards/<code>.png et la dimensionne."""
    p = os.path.join(APPS_DIR, app_slug, "assets", "cards", f"{code}.png")
    if not os.path.isfile(p):
        return None
    im = Image.open(p).convert("RGBA")
    return ImageOps.contain(im, size, Image.LANCZOS)


def gen_splash(app_slug, conf, out_path):
    """Splash 1242x2436 : degrade primaire + cartes watermarks + nom."""
    W, H = 1242, 2436
    rgb = hex_to_rgb(conf["color"])
    bg_dark = darken(rgb, 0.18)
    bg_mid = darken(rgb, 0.32)

    # Degrade vertical
    grad = Image.new("RGB", (1, H))
    for y in range(H):
        t = y / (H - 1)
        # darker top, primary tint mid, dark bottom
        if t < 0.55:
            f = t / 0.55
            col = tuple(int(bg_dark[i] + (rgb[i] - bg_dark[i]) * 0.85 * f) for i in range(3))
        else:
            f = (t - 0.55) / 0.45
            col = tuple(int(rgb[i] * (1 - f * 0.7) + bg_mid[i] * f * 0.7) for i in range(3))
        grad.putpixel((0, y), col)
    im = grad.resize((W, H), Image.NEAREST).convert("RGBA")

    # Watermark cards a faible opacite, eparpilles deterministe par app
    rnd = random.Random(sum(ord(c) for c in app_slug))
    cards = list(ALL_CARDS)
    rnd.shuffle(cards)
    for i, code in enumerate(cards[:7]):
        card = load_card(app_slug, code, (300, 450))
        if not card:
            continue
        # rotate
        card = card.rotate(rnd.uniform(-30, 30), resample=Image.BICUBIC, expand=True)
        # alpha
        a = card.split()[3].point(lambda p: int(p * (0.10 + rnd.random() * 0.10)))
        card.putalpha(a)
        x = rnd.randint(-50, W - 250)
        y = rnd.randint(-100, H - 350)
        im.alpha_composite(card, (x, y))

    # Glow central
    glow_r = 420
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = W // 2, int(H * 0.42)
    light = lighten(rgb, 0.55) + (130,)
    gd.ellipse((cx - glow_r, cy - glow_r, cx + glow_r, cy + glow_r), fill=light)
    glow = glow.filter(__import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(140))
    im.alpha_composite(glow)

    # Carte centrale (hero card) tres visible
    hero = load_card(app_slug, conf["card"], (560, 840))
    if hero:
        # subtle drop shadow
        sh = Image.new("RGBA", (hero.size[0] + 60, hero.size[1] + 60), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        sd.rounded_rectangle((30, 30, sh.size[0] - 10, sh.size[1] - 10),
                             radius=24, fill=(0, 0, 0, 110))
        sh = sh.filter(__import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(28))
        hx = (W - hero.size[0]) // 2
        hy = (H - hero.size[1]) // 2 - 200
        im.alpha_composite(sh, (hx - 30, hy - 20))
        im.alpha_composite(hero, (hx, hy))

    # Texte "Sally <Name>"
    d = ImageDraw.Draw(im)
    font_path = r"C:\Windows\Fonts\arialbd.ttf"
    try:
        f_big = ImageFont.truetype(font_path, 88)
        f_sm = ImageFont.truetype(font_path, 38)
    except Exception:
        f_big = ImageFont.load_default()
        f_sm = ImageFont.load_default()
    title = f"Sally  {conf['name']}"
    tw, th = d.textbbox((0, 0), title, font=f_big)[2:]
    tx = (W - tw) // 2
    ty = int(H * 0.66)
    # shadow
    d.text((tx + 4, ty + 6), title, font=f_big, fill=(0, 0, 0, 200))
    d.text((tx, ty), title, font=f_big, fill=(255, 255, 255, 255))
    sub = "SallyCards"
    sw = d.textbbox((0, 0), sub, font=f_sm)[2]
    d.text(((W - sw) // 2, ty + th + 14), sub, font=f_sm,
           fill=lighten(rgb, 0.4) + (235,))

    # Vignette douce
    vign = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vign)
    vd.rectangle((0, 0, W, H), fill=0)
    vd.ellipse((-300, -300, W + 300, H + 300), fill=255)
    vign = vign.filter(__import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(180))
    black = Image.new("RGB", (W, H), (0, 0, 0))
    im_rgb = im.convert("RGB")
    final = Image.composite(im_rgb, black, vign)

    final.save(out_path, optimize=True, quality=92)
    return os.path.getsize(out_path)


def main():
    for slug, conf in APPS.items():
        app_dir = os.path.join(APPS_DIR, slug)
        if not os.path.isdir(app_dir):
            print("skip", slug, "(no dir)")
            continue
        assets = os.path.join(app_dir, "assets")
        g_path = os.path.join(assets, "google-g.png")
        sp_path = os.path.join(assets, "splash.png")
        gsz = gen_google_g(g_path)
        ssz = gen_splash(slug, conf, sp_path)
        print(f"{slug:14s}  google-g={gsz:>6} B   splash={ssz:>8} B")


if __name__ == "__main__":
    main()
