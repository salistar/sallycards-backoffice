# -*- coding: utf-8 -*-
"""
gen-hero-tile-character.py — Generate hero PNGs for Okey (tile) and Quiestce (character)
to replace the card image on welcome.tsx slide 1. Saves to:
  - apps/mobile/okey/assets/tile-hero.png
  - apps-deploy/sally-okey/assets/tile-hero.png
  - apps/mobile/quiestce/assets/character-hero.png
  - apps-deploy/sally-quiestce/assets/character-hero.png

Aspect: 600x900 (2:3, fits 140x210 RN container at @x4).
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pathlib import Path

W, H = 600, 900
ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")


def load_font(size, bold=True):
    cand = (["segoeuib.ttf", "arialbd.ttf"] if bold else ["segoeui.ttf", "arial.ttf"])
    for fn in cand:
        try:
            return ImageFont.truetype(fn, size)
        except Exception:
            continue
    return ImageFont.load_default()


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def gradient_card(size, top, bot, radius_pct=0.06):
    w, h = size
    base = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    p = base.load()
    for y in range(h):
        t = y / h
        r = int(top[0] * (1 - t) + bot[0] * t)
        g = int(top[1] * (1 - t) + bot[1] * t)
        b = int(top[2] * (1 - t) + bot[2] * t)
        for x in range(w):
            p[x, y] = (r, g, b, 255)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w, h], radius=int(w * radius_pct), fill=255)
    base.putalpha(mask)
    return base


def make_tile_hero():
    """Single big Okey tile: dark green bg + numbered tile (7 blue) centered."""
    bg_top, bg_bot = hex_to_rgb("#10B981"), hex_to_rgb("#047857")
    bg = gradient_card((W, H), bg_top, bg_bot, radius_pct=0.04)
    # Inner tile
    tw, th = 380, 540
    blue_top, blue_bot = hex_to_rgb("#3B82F6"), hex_to_rgb("#1E40AF")
    tile = gradient_card((tw, th), blue_top, blue_bot, radius_pct=0.10)
    # Inner highlight rectangle
    inner = Image.new("RGBA", (tw - 40, th - 40), (255, 255, 255, 40))
    mask = Image.new("L", inner.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, inner.size[0], inner.size[1]],
                                            radius=int(tw * 0.07), fill=255)
    inner.putalpha(mask)
    tile.alpha_composite(inner, (20, 20))
    # Number 7 large
    td = ImageDraw.Draw(tile)
    nf = load_font(int(th * 0.55), bold=True)
    bbox = td.textbbox((0, 0), "7", font=nf)
    nw, nh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    # Shadow
    td.text(((tw - nw) // 2 - bbox[0] + 5, (th - nh) // 2 - bbox[1] - 8 + 5),
            "7", font=nf, fill=(0, 0, 0, 160))
    td.text(((tw - nw) // 2 - bbox[0], (th - nh) // 2 - bbox[1] - 8),
            "7", font=nf, fill=(255, 255, 255, 255))
    # Small "OKEY" label
    sf = load_font(28, bold=True)
    bbox = td.textbbox((0, 0), "OKEY", font=sf)
    sw = bbox[2] - bbox[0]
    td.text(((tw - sw) // 2 - bbox[0], th - 60 - bbox[1]),
            "OKEY", font=sf, fill=(252, 211, 77, 255))
    # Composite tile onto bg
    tile_shadow = Image.new("RGBA", (tw + 40, th + 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(tile_shadow)
    sd.rounded_rectangle([20, 30, tw + 20, th + 30], radius=int(tw * 0.10), fill=(0, 0, 0, 180))
    tile_shadow = tile_shadow.filter(ImageFilter.GaussianBlur(radius=22))
    bg.alpha_composite(tile_shadow, ((W - tile_shadow.width) // 2, (H - tile_shadow.height) // 2))
    bg.alpha_composite(tile, ((W - tw) // 2, (H - th) // 2))
    out_mono = ROOT / "apps" / "mobile" / "okey" / "assets" / "tile-hero.png"
    out_deploy = ROOT / "apps-deploy" / "sally-okey" / "assets" / "tile-hero.png"
    out_mono.parent.mkdir(parents=True, exist_ok=True)
    out_deploy.parent.mkdir(parents=True, exist_ok=True)
    bg.save(out_mono, "PNG", optimize=True)
    bg.save(out_deploy, "PNG", optimize=True)
    print(f"OK tile-hero: {out_mono.stat().st_size // 1024} KB")


def make_character_hero():
    """Single character portrait: indigo bg + stylized face card."""
    bg_top, bg_bot = hex_to_rgb("#6366F1"), hex_to_rgb("#4338CA")
    bg = gradient_card((W, H), bg_top, bg_bot, radius_pct=0.04)
    # Portrait card
    pw, ph = 420, 600
    rose_top, rose_bot = hex_to_rgb("#FF6B9D"), hex_to_rgb("#C026D3")
    portrait = gradient_card((pw, ph), rose_top, rose_bot, radius_pct=0.10)
    # Face circle
    pd = ImageDraw.Draw(portrait)
    face_r = int(pw * 0.30)
    fcx, fcy = pw // 2, int(ph * 0.35)
    # Skin
    pd.ellipse([fcx - face_r, fcy - face_r, fcx + face_r, fcy + face_r], fill=(255, 235, 205, 255))
    # Eyes
    eye_r = int(pw * 0.04)
    eye_dx = int(pw * 0.10)
    eye_y = fcy - int(pw * 0.05)
    pd.ellipse([fcx - eye_dx - eye_r, eye_y - eye_r, fcx - eye_dx + eye_r, eye_y + eye_r], fill=(40, 30, 60, 255))
    pd.ellipse([fcx + eye_dx - eye_r, eye_y - eye_r, fcx + eye_dx + eye_r, eye_y + eye_r], fill=(40, 30, 60, 255))
    # Eyebrows
    pd.line([fcx - eye_dx - eye_r - 5, eye_y - 30, fcx - eye_dx + eye_r + 5, eye_y - 25], fill=(60, 30, 30, 255), width=5)
    pd.line([fcx + eye_dx - eye_r - 5, eye_y - 25, fcx + eye_dx + eye_r + 5, eye_y - 30], fill=(60, 30, 30, 255), width=5)
    # Nose
    pd.line([fcx, eye_y + 20, fcx - 6, eye_y + 50], fill=(180, 140, 120, 255), width=3)
    pd.line([fcx - 6, eye_y + 50, fcx + 4, eye_y + 52], fill=(180, 140, 120, 255), width=3)
    # Smile
    smile_y = fcy + int(pw * 0.10)
    pd.arc([fcx - int(pw * 0.13), smile_y - int(pw * 0.05),
            fcx + int(pw * 0.13), smile_y + int(pw * 0.07)],
           start=20, end=160, fill=(60, 30, 30, 255), width=5)
    # Hair (top arc)
    hair_top = fcy - face_r - 10
    pd.pieslice([fcx - face_r - 5, hair_top, fcx + face_r + 5, fcy + 10],
                start=180, end=360, fill=(252, 211, 77, 255))
    # "?" badge bottom
    nf = load_font(int(ph * 0.18), bold=True)
    bbox = pd.textbbox((0, 0), "?", font=nf)
    nw = bbox[2] - bbox[0]
    nh = bbox[3] - bbox[1]
    badge_x = (pw - nw) // 2 - bbox[0]
    badge_y = int(ph * 0.78) - bbox[1]
    pd.text((badge_x + 5, badge_y + 5), "?", font=nf, fill=(0, 0, 0, 160))
    pd.text((badge_x, badge_y), "?", font=nf, fill=(255, 255, 255, 255))
    # Small "QUI EST-CE?" label below
    sf = load_font(24, bold=True)
    bbox = pd.textbbox((0, 0), "QUI EST-CE?", font=sf)
    sw = bbox[2] - bbox[0]
    pd.text(((pw - sw) // 2 - bbox[0], ph - 50 - bbox[1]),
            "QUI EST-CE?", font=sf, fill=(252, 211, 77, 255))
    # Shadow
    shadow = Image.new("RGBA", (pw + 40, ph + 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([20, 30, pw + 20, ph + 30], radius=int(pw * 0.10), fill=(0, 0, 0, 180))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=24))
    bg.alpha_composite(shadow, ((W - shadow.width) // 2, (H - shadow.height) // 2))
    bg.alpha_composite(portrait, ((W - pw) // 2, (H - ph) // 2))
    out_mono = ROOT / "apps" / "mobile" / "quiestce" / "assets" / "character-hero.png"
    out_deploy = ROOT / "apps-deploy" / "sally-quiestce" / "assets" / "character-hero.png"
    out_mono.parent.mkdir(parents=True, exist_ok=True)
    out_deploy.parent.mkdir(parents=True, exist_ok=True)
    bg.save(out_mono, "PNG", optimize=True)
    bg.save(out_deploy, "PNG", optimize=True)
    print(f"OK character-hero: {out_mono.stat().st_size // 1024} KB")


if __name__ == "__main__":
    make_tile_hero()
    make_character_hero()
