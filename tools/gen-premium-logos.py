# -*- coding: utf-8 -*-
"""
gen-premium-logos.py — Premium hero + adaptive-icon designs for Okey + Quiestce.

Produces:
  - tile-hero.png:        Okey tile rack (4 tiles, detailed shadows + highlights)
  - character-hero.png:   Quiestce 4-character grid (detailed faces)
  - icon.png (Okey):      512×512 adaptive icon — single tile centered
  - icon.png (Quiestce):  512×512 adaptive icon — single character centered

Improvements vs v1:
  - Drop shadows with multiple layers
  - Glossy highlights via radial gradients
  - Better typography (system fonts at correct sizes)
  - Anti-aliased rounded corners via supersampling
  - More face detail (eyes/eyebrows/nose/mouth/hair/cheek blush)
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")


def load_font(size, bold=True):
    cand = (["segoeuib.ttf", "arialbd.ttf", "calibrib.ttf"] if bold
            else ["segoeui.ttf", "arial.ttf", "calibri.ttf"])
    for fn in cand:
        try: return ImageFont.truetype(fn, size)
        except Exception: continue
    return ImageFont.load_default()


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def gradient_fill(size, top_rgb, bot_rgb, radius_pct=0.10, angle='vertical'):
    """Filled rounded rect with vertical/horizontal/diagonal gradient."""
    w, h = size
    base = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    p = base.load()
    if angle == 'vertical':
        for y in range(h):
            t = y / h
            r = int(top_rgb[0] * (1-t) + bot_rgb[0] * t)
            g = int(top_rgb[1] * (1-t) + bot_rgb[1] * t)
            b = int(top_rgb[2] * (1-t) + bot_rgb[2] * t)
            for x in range(w):
                p[x, y] = (r, g, b, 255)
    elif angle == 'diagonal':
        for y in range(h):
            for x in range(w):
                t = (x + y) / (w + h)
                r = int(top_rgb[0] * (1-t) + bot_rgb[0] * t)
                g = int(top_rgb[1] * (1-t) + bot_rgb[1] * t)
                b = int(top_rgb[2] * (1-t) + bot_rgb[2] * t)
                p[x, y] = (r, g, b, 255)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w, h], radius=int(w * radius_pct), fill=255)
    base.putalpha(mask)
    return base


def add_drop_shadow(img, offset=(0, 12), blur=24, opacity=180):
    """Layer drop-shadow behind img, returning composite."""
    w, h = img.size
    sw, sh = w + abs(offset[0]) + blur*2, h + abs(offset[1]) + blur*2
    shadow = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    alpha = img.split()[-1]
    sh_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    black = Image.new("RGBA", img.size, (0, 0, 0, opacity))
    black.putalpha(alpha)
    paste_x = blur + max(0, offset[0])
    paste_y = blur + max(0, offset[1])
    shadow.alpha_composite(black, (paste_x, paste_y))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=blur))
    out = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    out.alpha_composite(shadow)
    out.alpha_composite(img, (blur, blur))
    return out


def make_tile(size, number, color_palette, glossy=True):
    """A single Okey tile — premium look with inner highlight + drop shadow."""
    w, h = size
    top, bot, text_col = color_palette
    tile = gradient_fill((w, h), hex_to_rgb(top), hex_to_rgb(bot), radius_pct=0.12)
    d = ImageDraw.Draw(tile)

    if glossy:
        # Subtle top sheen (much lighter — premium feel, not toy)
        gloss = Image.new("RGBA", (w, int(h * 0.22)), (255, 255, 255, 0))
        gp = gloss.load()
        for y in range(gloss.height):
            t = y / gloss.height
            alpha = int(28 * (1 - t)**2)  # max 28/255 = subtle
            for x in range(w):
                gp[x, y] = (255, 255, 255, alpha)
        gloss_mask = Image.new("L", gloss.size, 0)
        ImageDraw.Draw(gloss_mask).rounded_rectangle(
            [0, 0, gloss.size[0], gloss.size[1]],
            radius=int(w * 0.12), fill=255)
        gloss.putalpha(gloss_mask)
        tile.alpha_composite(gloss, (0, 0))

    # Inner thin highlight border
    pad = int(w * 0.05)
    inset = Image.new("RGBA", (w - pad*2, h - pad*2), (0, 0, 0, 0))
    ImageDraw.Draw(inset).rounded_rectangle(
        [0, 0, inset.size[0]-1, inset.size[1]-1],
        radius=int((w-pad*2) * 0.10),
        outline=(255, 255, 255, 50), width=2)
    tile.alpha_composite(inset, (pad, pad))

    # Number — large, centered, shadowed
    nf = load_font(int(h * 0.55), bold=True)
    bbox = d.textbbox((0, 0), str(number), font=nf)
    nw, nh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    cx = (w - nw) // 2 - bbox[0]
    cy = (h - nh) // 2 - bbox[1] - int(h * 0.04)
    # Shadow
    d.text((cx + 4, cy + 4), str(number), font=nf, fill=(0, 0, 0, 100))
    # Main text
    d.text((cx, cy), str(number), font=nf, fill=hex_to_rgb(text_col) + (255,))
    return tile


def make_tile_hero():
    """Okey tile hero — 5 tiles in a slight V arrangement."""
    W, H = 800, 1200
    bg = gradient_fill((W, H), hex_to_rgb("#10B981"), hex_to_rgb("#047857"),
                       radius_pct=0.04, angle='diagonal')

    # Subtle radial glow behind tiles
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = W // 2, int(H * 0.5)
    for r in range(360, 0, -20):
        a = int(40 * (1 - r / 360) ** 2)
        gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(252, 211, 77, a))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=30))
    bg = Image.alpha_composite(bg, glow)

    palettes = {
        'red':    ("#EF4444", "#991B1B", "#FFFFFF"),
        'blue':   ("#3B82F6", "#1E40AF", "#FFFFFF"),
        'yellow': ("#FCD34D", "#D97706", "#3F2E0F"),
        'green':  ("#34D399", "#047857", "#FFFFFF"),
        'black':  ("#374151", "#1F2937", "#FFFFFF"),
    }
    tiles_def = [
        # (number, color, rel_x, rel_y, size_w, rotation)
        (13, 'red',    0.18, 0.50, 240, -15),
        (7,  'blue',   0.50, 0.45, 280, -2),
        (5,  'yellow', 0.82, 0.50, 240, 15),
        (1,  'green',  0.34, 0.78, 200, -8),
        (11, 'black',  0.66, 0.78, 200, 8),
    ]

    for number, color, rx, ry, sw, rot in tiles_def:
        sh = int(sw * 1.35)
        tile = make_tile((sw, sh), number, palettes[color])
        shadow_layered = add_drop_shadow(tile, offset=(0, 14), blur=28, opacity=170)
        if rot != 0:
            shadow_layered = shadow_layered.rotate(rot, resample=Image.BICUBIC, expand=True)
        px = int(W * rx) - shadow_layered.width // 2
        py = int(H * ry) - shadow_layered.height // 2
        bg.alpha_composite(shadow_layered, (px, py))

    # Wordmark "OKEY" at bottom
    d = ImageDraw.Draw(bg)
    nf = load_font(72, bold=True)
    bbox = d.textbbox((0, 0), "OKEY", font=nf)
    tw = bbox[2] - bbox[0]
    bx = (W - tw) // 2 - bbox[0]
    by = int(H * 0.92) - bbox[1]
    d.text((bx + 4, by + 4), "OKEY", font=nf, fill=(0, 0, 0, 140))
    d.text((bx, by), "OKEY", font=nf, fill=(252, 211, 77, 255))

    out_mono = ROOT / "apps" / "mobile" / "okey" / "assets" / "tile-hero.png"
    out_deploy = ROOT / "apps-deploy" / "sally-okey" / "assets" / "tile-hero.png"
    out_mono.parent.mkdir(parents=True, exist_ok=True)
    out_deploy.parent.mkdir(parents=True, exist_ok=True)
    bg.save(out_mono, "PNG", optimize=True)
    bg.save(out_deploy, "PNG", optimize=True)
    print(f"OK tile-hero v2: {out_mono.stat().st_size // 1024} KB")


def make_face(size, gradient, hair_color, skin_color, accessory=None):
    """Detailed character portrait card."""
    w, h = size
    bg = gradient_fill((w, h), hex_to_rgb(gradient[0]), hex_to_rgb(gradient[1]), radius_pct=0.14)
    d = ImageDraw.Draw(bg)

    # Glossy top highlight
    gloss = Image.new("RGBA", (w, h//3), (0, 0, 0, 0))
    gp = gloss.load()
    for y in range(h//3):
        alpha = int(40 * (1 - y / (h//3))**1.5)
        for x in range(w):
            gp[x, y] = (255, 255, 255, alpha)
    gloss_mask = Image.new("L", (w, h//3), 0)
    ImageDraw.Draw(gloss_mask).rounded_rectangle(
        [0, 0, w, h//3], radius=int(w * 0.14), fill=255)
    gloss.putalpha(gloss_mask)
    bg.alpha_composite(gloss, (0, 0))

    # Face circle (drawn FIRST so hair can overlay only the top crown, not features)
    face_r = int(w * 0.32)
    fcx, fcy = w // 2, int(h * 0.36)
    sk = hex_to_rgb(skin_color)
    # Hair goes here FIRST (above the face features, but below the eye line)
    hair = hex_to_rgb(hair_color)
    hair_h = int(face_r * 0.85)  # hair only top portion of head
    hair_overlay = Image.new("RGBA", (face_r*2 + 30, hair_h + 20), (0, 0, 0, 0))
    ImageDraw.Draw(hair_overlay).pieslice(
        [-10, -10, face_r*2 + 40, face_r*2 + 30 - hair_h],
        start=180, end=360, fill=hair + (255,))
    # We'll paste hair AFTER face but BEFORE eyes — see end of function
    # Outer shadow on face
    sh_face = Image.new("RGBA", (face_r*2 + 30, face_r*2 + 30), (0, 0, 0, 0))
    ImageDraw.Draw(sh_face).ellipse([10, 14, face_r*2 + 10, face_r*2 + 14],
                                      fill=(0, 0, 0, 90))
    sh_face = sh_face.filter(ImageFilter.GaussianBlur(radius=10))
    bg.alpha_composite(sh_face, (fcx - face_r - 10, fcy - face_r - 10))
    # Face
    d.ellipse([fcx - face_r, fcy - face_r, fcx + face_r, fcy + face_r], fill=sk + (255,))
    # Cheek blush
    bl = (255, 150, 180, 80)
    blush_r = int(w * 0.06)
    d.ellipse([fcx - int(w * 0.20) - blush_r, fcy + int(w * 0.02) - blush_r,
               fcx - int(w * 0.20) + blush_r, fcy + int(w * 0.02) + blush_r], fill=bl)
    d.ellipse([fcx + int(w * 0.20) - blush_r, fcy + int(w * 0.02) - blush_r,
               fcx + int(w * 0.20) + blush_r, fcy + int(w * 0.02) + blush_r], fill=bl)
    # Eyes (with white sclera + black pupil)
    eye_w = int(w * 0.06)
    eye_dx = int(w * 0.11)
    eye_y = fcy - int(w * 0.04)
    for sign in (-1, 1):
        ex = fcx + sign * eye_dx
        # Sclera
        d.ellipse([ex - eye_w, eye_y - eye_w*0.7, ex + eye_w, eye_y + eye_w*0.7], fill=(255, 255, 255, 255))
        # Pupil
        d.ellipse([ex - eye_w*0.5, eye_y - eye_w*0.5, ex + eye_w*0.5, eye_y + eye_w*0.5], fill=(40, 30, 60, 255))
        # Highlight
        d.ellipse([ex + eye_w*0.15, eye_y - eye_w*0.35, ex + eye_w*0.35, eye_y - eye_w*0.15], fill=(255, 255, 255, 255))
    # Eyebrows (thick)
    brow_y = eye_y - int(w * 0.10)
    for sign in (-1, 1):
        ex = fcx + sign * eye_dx
        d.line([(ex - eye_w*1.1, brow_y + sign*3), (ex + eye_w*1.1, brow_y - sign*3)],
               fill=(60, 40, 30, 255), width=6)
    # Nose
    d.line([(fcx, eye_y + 18), (fcx - 6, eye_y + 50)], fill=(180, 130, 100, 220), width=4)
    d.line([(fcx - 6, eye_y + 50), (fcx + 6, eye_y + 52)], fill=(180, 130, 100, 220), width=4)
    # Mouth (smile)
    smile_y = fcy + int(w * 0.12)
    d.arc([fcx - int(w * 0.15), smile_y - int(w * 0.05),
           fcx + int(w * 0.15), smile_y + int(w * 0.08)],
          start=20, end=160, fill=(140, 40, 50, 255), width=6)
    # Hair (top crown only — sits just above the eyebrows, doesn't cover face)
    # Position so hair bottom edge ≈ at eyebrow level
    hair_paste_y = fcy - face_r - 10
    bg.alpha_composite(hair_overlay,
                       (fcx - face_r - 15, hair_paste_y))
    # Accessory: glasses if specified
    if accessory == 'glasses':
        for sign in (-1, 1):
            ex = fcx + sign * eye_dx
            d.ellipse([ex - eye_w*1.4, eye_y - eye_w*1.0,
                       ex + eye_w*1.4, eye_y + eye_w*1.0],
                      outline=(40, 30, 30, 255), width=5)
        d.line([(fcx - eye_dx + eye_w*1.4, eye_y),
                (fcx + eye_dx - eye_w*1.4, eye_y)],
               fill=(40, 30, 30, 255), width=4)
    return bg


def make_character_hero():
    """Quiestce character hero — 4 detailed character cards in 2x2 grid."""
    W, H = 800, 1200
    bg = gradient_fill((W, H), hex_to_rgb("#6366F1"), hex_to_rgb("#4338CA"),
                       radius_pct=0.04, angle='diagonal')

    # Aura behind characters
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = W // 2, int(H * 0.5)
    for r in range(380, 0, -20):
        a = int(35 * (1 - r / 380) ** 2)
        gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 107, 157, a))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=30))
    bg = Image.alpha_composite(bg, glow)

    # 4 characters in 2x2
    chars = [
        ('Sophie',  ('#F472B6', '#BE185D'), '#FCD34D', '#FFE0BD', None),       # blonde
        ('Pierre',  ('#818CF8', '#4338CA'), '#475569', '#F3E5D8', 'glasses'),  # brown hair + glasses
        ('Maria',   ('#FB7185', '#9F1239'), '#7F1D1D', '#FFE0BD', None),       # red hair
        ('Jean',    ('#34D399', '#047857'), '#1F2937', '#E8C39E', None),       # black hair
    ]
    pad = 30
    cw = (W - pad*3) // 2
    ch = (H - pad*3 - 80) // 2  # 80 leaves room for wordmark
    grid_y_start = 60

    for i, (name, grad, hair, skin, acc) in enumerate(chars):
        row = i // 2
        col = i % 2
        cx = pad + col * (cw + pad)
        cy = grid_y_start + row * (ch + pad)
        portrait = make_face((cw, ch), grad, hair, skin, accessory=acc)
        shadow_layered = add_drop_shadow(portrait, offset=(0, 10), blur=22, opacity=160)
        bg.alpha_composite(shadow_layered, (cx - 22, cy - 22))
        # Name strip at bottom
        d = ImageDraw.Draw(bg)
        nf = load_font(28, bold=True)
        bbox = d.textbbox((0, 0), name, font=nf)
        nw = bbox[2] - bbox[0]
        nx = cx + (cw - nw) // 2 - bbox[0]
        ny = cy + ch - 38 - bbox[1]
        d.text((nx, ny), name, font=nf, fill=(255, 255, 255, 245))

    # Wordmark "?" at bottom
    d = ImageDraw.Draw(bg)
    nf = load_font(96, bold=True)
    bbox = d.textbbox((0, 0), "?", font=nf)
    tw = bbox[2] - bbox[0]
    bx = (W - tw) // 2 - bbox[0]
    by = int(H * 0.91) - bbox[1]
    d.text((bx + 4, by + 4), "?", font=nf, fill=(0, 0, 0, 150))
    d.text((bx, by), "?", font=nf, fill=(252, 211, 77, 255))

    out_mono = ROOT / "apps" / "mobile" / "quiestce" / "assets" / "character-hero.png"
    out_deploy = ROOT / "apps-deploy" / "sally-quiestce" / "assets" / "character-hero.png"
    out_mono.parent.mkdir(parents=True, exist_ok=True)
    out_deploy.parent.mkdir(parents=True, exist_ok=True)
    bg.save(out_mono, "PNG", optimize=True)
    bg.save(out_deploy, "PNG", optimize=True)
    print(f"OK character-hero v2: {out_mono.stat().st_size // 1024} KB")


def make_icon_okey():
    """512x512 adaptive icon for Okey — single bright tile centered."""
    W = H = 512
    bg = Image.new("RGBA", (W, H), hex_to_rgb("#10B981") + (255,))
    tile = make_tile((280, 380), 7, ("#3B82F6", "#1E40AF", "#FFFFFF"))
    shadowed = add_drop_shadow(tile, offset=(0, 12), blur=24, opacity=180)
    px = (W - shadowed.width) // 2
    py = (H - shadowed.height) // 2 - 10
    bg.alpha_composite(shadowed, (px, py))
    out_mono = ROOT / "apps" / "mobile" / "okey" / "assets" / "icon.png"
    out_deploy = ROOT / "apps-deploy" / "sally-okey" / "assets" / "icon.png"
    # Also adaptive-icon foreground
    out_ad = ROOT / "apps-deploy" / "sally-okey" / "assets" / "adaptive-icon.png"
    final = bg.convert("RGB")
    final.save(out_mono, "PNG", optimize=True)
    final.save(out_deploy, "PNG", optimize=True)
    final.save(out_ad, "PNG", optimize=True)
    print(f"OK okey icon: {out_mono.stat().st_size // 1024} KB")


def make_icon_quiestce():
    """512x512 adaptive icon for Quiestce — single character portrait."""
    W = H = 512
    bg = Image.new("RGBA", (W, H), hex_to_rgb("#6366F1") + (255,))
    portrait = make_face((300, 380),
                         ("#FF6B9D", "#C026D3"), "#FCD34D", "#FFE0BD", None)
    shadowed = add_drop_shadow(portrait, offset=(0, 12), blur=22, opacity=170)
    px = (W - shadowed.width) // 2
    py = (H - shadowed.height) // 2 - 10
    bg.alpha_composite(shadowed, (px, py))
    out_mono = ROOT / "apps" / "mobile" / "quiestce" / "assets" / "icon.png"
    out_deploy = ROOT / "apps-deploy" / "sally-quiestce" / "assets" / "icon.png"
    out_ad = ROOT / "apps-deploy" / "sally-quiestce" / "assets" / "adaptive-icon.png"
    final = bg.convert("RGB")
    final.save(out_mono, "PNG", optimize=True)
    final.save(out_deploy, "PNG", optimize=True)
    final.save(out_ad, "PNG", optimize=True)
    print(f"OK quiestce icon: {out_mono.stat().st_size // 1024} KB")


if __name__ == "__main__":
    make_tile_hero()
    make_character_hero()
    make_icon_okey()
    make_icon_quiestce()
    print("DONE — premium logos generated")
