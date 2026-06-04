# -*- coding: utf-8 -*-
"""Genere un logo Google G stylise (4 couleurs officielles) en PNG.

Approche : 4 arcs colores formant l'anneau du G, ouverture en haut a droite,
barre horizontale bleue. Anti-alias via supersampling x4.
"""
from PIL import Image, ImageDraw
import os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "google-g.png"

SCALE = 4
S = 192 * SCALE  # supersampled
im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(im)

cx, cy = S // 2, S // 2
R = int(S * 0.45)
r = int(S * 0.28)
W = R - r  # ring width

# Couleurs officielles Google
BLUE   = (66, 133, 244, 255)
RED    = (234, 67,  53,  255)
YELLOW = (251, 188, 5,   255)
GREEN  = (52,  168, 83,  255)

def arc(c1, c2, color, w=W):
    # arc allant de c1 a c2 (PIL: 0=right, 90=bottom)
    d.arc((cx - R, cy - R, cx + R, cy + R), c1, c2, fill=color, width=w)

# Anneau exterieur :
# 0° = est (3h), 90° = sud (6h), 180° = ouest (9h), 270° = nord (12h)
# G logo: l'ouverture est en haut-droite (entre ~-25° (nord-est) et ~25° (est-nord-est))
# Couleurs : bleu (haut/droite), rouge (haut/gauche), jaune (gauche/bas), vert (bas/droite)
arc(165, 290, RED)       # top-left red
arc(290, 360+85, YELLOW) # bottom-left yellow
# yellow wrap-around: PIL n'accepte que c2>c1 normalement; on coupe
arc(85, 165, RED)        # close red gap

# Reset (over-paint) :
# Le plus simple : peindre 4 secteurs separes
im2 = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d2 = ImageDraw.Draw(im2)

# Re-peint l'anneau en 4 secteurs propres :
# Convention PIL: 0=East, 90=South (down), 180=West, 270=North (up)
# Couleurs (en commencant par l'ouverture haut-droite et tournant horaire) :
#   - Ouverture (gap)         : 295° -> 5°  (env. -65° -> +5°)
#   - Bleu (droite)           : 5°   -> 65°
#   - Vert (bas-droit)        : 65°  -> 145°
#   - Jaune (bas-gauche)      : 145° -> 215°
#   - Rouge (haut)            : 215° -> 295°
def sec(c1, c2, color):
    d2.arc((cx - R, cy - R, cx + R, cy + R), c1, c2, fill=color, width=W)

sec(5,   65,  BLUE)
sec(65,  145, GREEN)
sec(145, 215, YELLOW)
sec(215, 295, RED)

# Barre horizontale bleue (depuis le centre du G vers la droite)
bar_h = int(W * 0.95)
bar_w = R + int(W * 0.55)
d2.rectangle(
    (cx + int(R * 0.12), cy - bar_h // 2, cx + bar_w, cy + bar_h // 2),
    fill=BLUE,
)

# Petit cap arrondi en bout de barre
d2.ellipse(
    (cx + bar_w - bar_h, cy - bar_h // 2, cx + bar_w, cy + bar_h // 2),
    fill=BLUE,
)

# Downsample
out = im2.resize((192, 192), Image.LANCZOS)
out.save(OUT, optimize=True)
print("OK", OUT, os.path.getsize(OUT), "bytes", out.size)
