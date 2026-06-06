"""Generate a 1200x630 OG image for Smashly."""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os

OUTPUT = "/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/public/images/og/smashly-og-1200x630.png"
ICON_PATH = "/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/public/images/icons/smashly-icon.png"

WIDTH, HEIGHT = 1200, 630

FONT_CANDIDATES_BOLD = [
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]
FONT_CANDIDATES_REGULAR = [
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def load_font(paths, size):
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


# --- Gradient background (green palette) ---
img = Image.new("RGB", (WIDTH, HEIGHT), (15, 40, 24))
draw = ImageDraw.Draw(img)
gradient = [
    (15, 40, 24),    # #0f2818
    (20, 83, 45),    # #14532d
    (22, 101, 52),   # #166534
    (21, 128, 61),   # #15803d
]
for y in range(HEIGHT):
    t = y / (HEIGHT - 1)
    seg = t * (len(gradient) - 1)
    i = int(seg)
    frac = seg - i
    c0 = gradient[i]
    c1 = gradient[min(i + 1, len(gradient) - 1)]
    color = tuple(int(c0[k] + (c1[k] - c0[k]) * frac) for k in range(3))
    draw.line([(0, y), (WIDTH, y)], fill=color)

# Soft radial highlights
overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
odraw = ImageDraw.Draw(overlay)
odraw.ellipse([WIDTH - 500, -200, WIDTH + 200, 500], fill=(255, 255, 255, 28))
odraw.ellipse([-200, HEIGHT - 300, 400, HEIGHT + 200], fill=(34, 197, 94, 38))
overlay = overlay.filter(ImageFilter.GaussianBlur(80))
img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
draw = ImageDraw.Draw(img)

# Subtle grid
for x in range(0, WIDTH, 60):
    draw.line([(x, 0), (x, HEIGHT)], fill=(255, 255, 255, 8), width=1)
for y in range(0, HEIGHT, 60):
    draw.line([(0, y), (WIDTH, y)], fill=(255, 255, 255, 8), width=1)

# --- Logo circle (top-left) ---
LOGO_SIZE = 130
LOGO_X = 90
LOGO_Y = 80
circle_bg = Image.new("RGBA", (LOGO_SIZE + 24, LOGO_SIZE + 24), (0, 0, 0, 0))
cd = ImageDraw.Draw(circle_bg)
cd.ellipse([0, 0, LOGO_SIZE + 24, LOGO_SIZE + 24], fill=(255, 255, 255, 24))
circle_bg = circle_bg.filter(ImageFilter.GaussianBlur(1))
img.paste(circle_bg, (LOGO_X - 12, LOGO_Y - 12), circle_bg)

if os.path.exists(ICON_PATH):
    icon = Image.open(ICON_PATH).convert("RGBA")
    icon = icon.resize((LOGO_SIZE, LOGO_SIZE), Image.LANCZOS)
    mask = Image.new("L", (LOGO_SIZE, LOGO_SIZE), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse([0, 0, LOGO_SIZE, LOGO_SIZE], fill=255)
    img.paste(icon, (LOGO_X, LOGO_Y), mask)

# Brand "Smashly" next to logo
font_brand = load_font(FONT_CANDIDATES_BOLD, 64)
draw.text((LOGO_X + LOGO_SIZE + 24, LOGO_Y + 18), "Smashly", font=font_brand, fill=(255, 255, 255))

# Eyebrow tag
font_tag = load_font(FONT_CANDIDATES_BOLD, 24)
tag_x, tag_y = 90, 280
draw.text(
    (tag_x, tag_y),
    "COMPARADOR DE PALAS DE PÁDEL · IA",
    font=font_tag,
    fill=(134, 239, 172),
)

# Big title (single line fits in left column)
font_title = load_font(FONT_CANDIDATES_BOLD, 90)
title_y = 320
draw.text((tag_x, title_y), "Encuentra tu Pala", font=font_title, fill=(255, 255, 255))
draw.text((tag_x, title_y + 100), "de Pádel Perfecta", font=font_title, fill=(134, 239, 172))

# Subtitle bullets
font_subtitle = load_font(FONT_CANDIDATES_REGULAR, 30)
sub_y = title_y + 220
draw.text(
    (tag_x, sub_y),
    "+800 modelos   ·   Precios en tiempo real   ·   RAG + IA",
    font=font_subtitle,
    fill=(220, 252, 231),
)

# --- Right-side decorative "compare" cards ---
def draw_card(x, y, w, h, title, body, accent=(134, 239, 172)):
    card_bg = Image.new("RGBA", (w, h), (255, 255, 255, 16))
    # No blur to avoid the card bleeding off the canvas
    img.paste(card_bg, (x, y), card_bg)
    draw.rectangle(
        [x, y, x + w, y + h],
        outline=(255, 255, 255, 100),
        width=2,
    )
    f_title = load_font(FONT_CANDIDATES_BOLD, 22)
    f_body = load_font(FONT_CANDIDATES_REGULAR, 18)
    draw.text((x + 18, y + 14), title, font=f_title, fill=accent)
    draw.text((x + 18, y + 50), body, font=f_body, fill=(220, 252, 231))


draw_card(WIDTH - 320, 80, 250, 80, "Marca", "Adidas · Nox · Head")
draw_card(WIDTH - 320, 175, 250, 80, "Forma", "Redonda · Diamante")
draw_card(WIDTH - 320, 270, 250, 80, "Nivel", "Iniciación · Avanzado")
draw_card(WIDTH - 320, 365, 250, 80, "Precios", "Tiempo real · 3 tiendas", accent=(187, 247, 208))
draw_card(WIDTH - 320, 460, 250, 80, "IA", "Recomendador RAG", accent=(187, 247, 208))

# --- Bottom bar ---
bar_y = HEIGHT - 60
draw.rectangle([(0, bar_y), (WIDTH, HEIGHT)], fill=(0, 0, 0, 70))
draw.text(
    (90, bar_y + 16),
    "smashly-app.es",
    font=load_font(FONT_CANDIDATES_BOLD, 26),
    fill=(187, 247, 208),
)
draw.text(
    (WIDTH - 360, bar_y + 16),
    "Smashly © 2026",
    font=load_font(FONT_CANDIDATES_REGULAR, 22),
    fill=(187, 247, 208),
)

# --- Bottom bar ---
bar_y = HEIGHT - 60
draw.rectangle([(0, bar_y), (WIDTH, HEIGHT)], fill=(0, 0, 0, 70))
draw.text(
    (90, bar_y + 16),
    "smashly-app.es",
    font=load_font(FONT_CANDIDATES_BOLD, 26),
    fill=(187, 247, 208),
)
draw.text(
    (WIDTH - 360, bar_y + 16),
    "Smashly © 2026",
    font=load_font(FONT_CANDIDATES_REGULAR, 22),
    fill=(187, 247, 208),
)

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
img.save(OUTPUT, "PNG", optimize=True)
print(f"OK {OUTPUT} {os.path.getsize(OUTPUT) // 1024} KB")
