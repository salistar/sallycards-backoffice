# -*- coding: utf-8 -*-
"""
gen-card-hero-per-app.py — Generate unique signature card hero per app.

Each app gets its own iconic card design instead of the generic King-12.
Output: apps/mobile/<slug>/assets/card-hero.png + mirror in apps-deploy/sally-<slug>/assets/card-hero.png
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")

# Per-app signature card spec
SIGNATURES = [
    # (slug, accent_hex, deck_tone, signature_text, sub_text, badge_emoji, suit_color_rgb)
    ("belote",   "#3B82F6", "#1E40AF", "VALET",    "Atout",                "♠", (40, 50, 130)),
    ("okey",     "#10B981", "#047857", "OKEY",     "Joker",                "★", (252, 211, 77)),
    ("quiestce", "#6366F1", "#4338CA", "MYSTÈRE",  "Devinez la personne", "?", (255, 107, 157)),
    ("scopa",    "#059669", "#065F46", "7 DENARI", "Settebello",           "🪙", (185, 100, 25)),
    ("tarot",    "#8B5CF6", "#6D28D9", "EXCUSE",   "21 atouts",            "✨", (252, 211, 77)),
    ("solitaire","#14B8A6", "#0F766E", "AS",       "192 variantes",       "♣", (40, 60, 90)),
    ("kdoub",    "#C084FC", "#7C3AED", "BLUFF",    "Mensonge organisé",   "🎭", (255, 200, 50)),
    ("poker",    "#EF4444", "#991B1B", "QUINTE",   "Texas Hold'em",        "♥", (220, 30, 40)),
    ("ronda",    "#10B981", "#047857", "TRINGLA",  "Capture parfaite",    "🌙", (252, 211, 77)),
    ("concentration", "#EC4899", "#BE185D", "MEMORY", "Trouvez les paires","🧠", (236, 72, 153)),
    ("kantcopy", "#0F766E", "#064E3B", "COPY",     "Original SallyStar",  "✨", (45, 212, 191)),
]

W, H = 600, 900


def load_font(size, bold=True):
    cand = (["segoeuib.ttf", "arialbd.ttf"] if bold else ["segoeui.ttf", "arial.ttf"])
    for fn in cand:
        try: return ImageFont.truetype(fn, size)
        except Exception: continue
    return ImageFont.load_default()


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def gradient_card(size, top, bot, radius_pct=0.06):
    w, h = size
    base = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    p = base.load()
    for y in range(h):
        t = y / h
        r = int(top[0] * (1-t) + bot[0] * t)
        g = int(top[1] * (1-t) + bot[1] * t)
        b = int(top[2] * (1-t) + bot[2] * t)
        for x in range(w):
            p[x, y] = (r, g, b, 255)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w, h], radius=int(w * radius_pct), fill=255)
    base.putalpha(mask)
    return base


def make_card_hero(slug, accent_hex, deck_hex, sig_text, sub_text, badge, suit_color):
    """Generate a single iconic card hero for an app."""
    accent_rgb = hex_to_rgb(accent_hex)
    deck_rgb = hex_to_rgb(deck_hex)

    # Background gradient (full image)
    bg = gradient_card((W, H), accent_rgb, deck_rgb, radius_pct=0.03)

    # Subtle radial glow
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = W // 2, int(H * 0.45)
    for r in range(360, 0, -20):
        a = int(40 * (1 - r / 360) ** 2)
        gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(252, 211, 77, a))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=30))
    bg = Image.alpha_composite(bg, glow)

    # Card body (white parchment style) — centered, ~400x600
    cw, ch = 380, 560
    cx_pos = (W - cw) // 2
    cy_pos = int(H * 0.10)

    # Drop shadow
    shadow = Image.new("RGBA", (cw + 40, ch + 40), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [20, 30, cw + 20, ch + 30], radius=int(cw * 0.06), fill=(0, 0, 0, 180))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=20))
    bg.alpha_composite(shadow, (cx_pos - 20, cy_pos - 20))

    # Card body (cream paper)
    card = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle([0, 0, cw, ch], radius=int(cw * 0.06),
                          fill=(252, 252, 248, 255),
                          outline=(20, 30, 60, 255), width=4)

    # Top-left corner: number + suit
    f_corner_n = load_font(72, bold=True)
    f_corner_s = load_font(48, bold=True)
    cd.text((30, 30), "I", font=f_corner_n, fill=suit_color + (255,))
    cd.text((30, 110), badge, font=f_corner_s, fill=suit_color + (255,))

    # Center large badge emoji
    f_center = load_font(180, bold=True)
    bbox = cd.textbbox((0, 0), badge, font=f_center)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    cd.text(((cw - bw) // 2 - bbox[0], (ch - bh) // 2 - bbox[1] - 30),
            badge, font=f_center, fill=suit_color + (255,))

    # Signature text below center
    f_sig = load_font(48, bold=True)
    bbox = cd.textbbox((0, 0), sig_text, font=f_sig)
    sw = bbox[2] - bbox[0]
    cd.text(((cw - sw) // 2 - bbox[0], int(ch * 0.70) - bbox[1]),
            sig_text, font=f_sig, fill=accent_rgb + (255,))

    # Subtext small italic
    f_sub = load_font(24, bold=False)
    bbox = cd.textbbox((0, 0), sub_text, font=f_sub)
    sw = bbox[2] - bbox[0]
    cd.text(((cw - sw) // 2 - bbox[0], int(ch * 0.80) - bbox[1]),
            sub_text, font=f_sub, fill=(80, 90, 110, 220))

    # Bottom-right corner (rotated 180): number + suit
    cr = Image.new("RGBA", (140, 160), (0, 0, 0, 0))
    crd = ImageDraw.Draw(cr)
    crd.text((10, 10), "I", font=f_corner_n, fill=suit_color + (255,))
    crd.text((10, 90), badge, font=f_corner_s, fill=suit_color + (255,))
    cr = cr.rotate(180, resample=Image.BICUBIC)
    card.alpha_composite(cr, (cw - 140, ch - 160))

    bg.alpha_composite(card, (cx_pos, cy_pos))

    # Brand line below card
    d2 = ImageDraw.Draw(bg)
    f_brand = load_font(28, bold=True)
    brand = f"Sally {slug.upper()}"
    bbox = d2.textbbox((0, 0), brand, font=f_brand)
    bw2 = bbox[2] - bbox[0]
    d2.text(((W - bw2) // 2 - bbox[0], H - 60 - bbox[1]),
            brand, font=f_brand, fill=(255, 255, 255, 230))

    out_mono = ROOT / "apps" / "mobile" / slug / "assets" / "card-hero.png"
    out_deploy = ROOT / "apps-deploy" / f"sally-{slug}" / "assets" / "card-hero.png"
    out_mono.parent.mkdir(parents=True, exist_ok=True)
    out_deploy.parent.mkdir(parents=True, exist_ok=True)
    final = bg.convert("RGB")
    final.save(out_mono, "PNG", optimize=True)
    final.save(out_deploy, "PNG", optimize=True)
    print(f"  OK {slug}: {out_mono.stat().st_size // 1024} KB")


if __name__ == "__main__":
    for spec in SIGNATURES:
        make_card_hero(*spec)
    print(f"\nDONE — {len(SIGNATURES)} unique card heroes generated")
