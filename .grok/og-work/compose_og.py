#!/usr/bin/env python3
"""Compose a 1200×630 Booth OG card from the walnut plaque + pin."""
from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H = 1200, 630
RATIO = W / H
FONT = "/workspace/.grok/fonts/Cinzel-SemiBold.ttf"
ITALIC = "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf"
OUT = "/workspace/.grok/og-work"

# Parchment on walnut — enough contrast to read at unfurl size.
FILL = (232, 223, 210, 255)  # #e8dfd2
HI = (247, 241, 230, 210)
SH = (14, 10, 8, 235)
RULE_DARK = (36, 28, 22, 190)
RULE_LIGHT = (232, 223, 210, 90)


def crop_to_og(src: Image.Image, trim_frac: float = 0.07, x_shift: int = 0) -> Image.Image:
    tw, th = src.size
    inner_h = int(th * (1 - 2 * trim_frac))
    inner_w = int(inner_h * RATIO)
    left = max(0, min((tw - inner_w) // 2 + x_shift, tw - inner_w))
    top = (th - inner_h) // 2
    crop = src.crop((left, top, left + inner_w, top + inner_h))
    return crop.resize((W, H), Image.Resampling.LANCZOS)


def place_pin(canvas: Image.Image, pin: Image.Image, size: int, xy: tuple[int, int]) -> Image.Image:
    p = pin.crop(pin.getbbox())
    p.thumbnail((size, size), Image.Resampling.LANCZOS)
    alpha = p.split()[-1]
    sh = Image.new("L", p.size, 0)
    sh.paste(170, (0, 0), alpha)
    sh = sh.filter(ImageFilter.GaussianBlur(16))
    shadow = Image.new("RGBA", p.size, (0, 0, 0, 0))
    shadow.putalpha(sh)
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    px, py = xy
    layer.alpha_composite(shadow, (px + 9, py + 14))
    layer.alpha_composite(p, (px, py))
    return Image.alpha_composite(canvas.convert("RGBA"), layer)


def darken_column(canvas: Image.Image, x0: int, x1: int, amount: float = 0.22) -> Image.Image:
    """Soft vertical scrim so parchment type reads on the wood."""
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    feather = 70
    for x in range(max(0, x0 - feather), min(W, x1 + feather)):
        if x < x0:
            a = amount * (x - (x0 - feather)) / feather
        elif x > x1:
            a = amount * ((x1 + feather) - x) / feather
        else:
            a = amount
        a = max(0.0, min(1.0, a))
        draw.line([(x, 48), (x, H - 48)], fill=(14, 11, 9, int(255 * a)))
    overlay = overlay.filter(ImageFilter.GaussianBlur(8))
    return Image.alpha_composite(canvas.convert("RGBA"), overlay)


def draw_engraved(draw, xy, text, font, fill=FILL, hi=HI, sh=SH, anchor="mm"):
    x, y = xy
    draw.text((x + 1.2, y + 1.7), text, font=font, fill=sh, anchor=anchor)
    draw.text((x - 0.6, y - 0.8), text, font=font, fill=hi, anchor=anchor)
    draw.text((x, y), text, font=font, fill=fill, anchor=anchor)


def letter_space(draw, xy, text, font, tracking, fill=FILL, hi=HI, sh=SH):
    widths = [draw.textlength(ch, font=font) for ch in text]
    total = sum(widths) + tracking * max(len(text) - 1, 0)
    x, y = xy
    cx = x - total / 2
    for ch, w in zip(text, widths):
        draw_engraved(draw, (cx + w / 2, y), ch, font, fill, hi, sh, anchor="mm")
        cx += w + tracking
    return total


def finish(img: Image.Image) -> Image.Image:
    out = img.convert("RGB")
    out = ImageEnhance.Contrast(out).enhance(1.08)
    out = ImageEnhance.Color(out).enhance(1.05)
    out = ImageEnhance.Sharpness(out).enhance(1.1)
    return out


def compose(base: Image.Image, pin: Image.Image) -> Image.Image:
    bg = crop_to_og(base, trim_frac=0.065)
    # Pin sits in the left third; keep a wood margin from the bevel.
    canvas = place_pin(bg, pin, 356, (96, 136))
    # Scrim behind the inscription column (right of the pin).
    canvas = darken_column(canvas, 500, 1140, amount=0.28)

    draw = ImageDraw.Draw(canvas)
    font_title = ImageFont.truetype(FONT, 84)
    font_sub = ImageFont.truetype(FONT, 17)
    font_ital = ImageFont.truetype(ITALIC, 22)
    font_name = ImageFont.truetype(FONT, 28)
    font_grok = ImageFont.truetype(FONT, 32)

    tx = 792
    # Title
    w_title = letter_space(draw, (tx, 148), "BOOTH", font_title, tracking=13)
    print("title width", round(w_title))
    letter_space(draw, (tx, 214), "ON-DEVICE SPEECH", font_sub, tracking=5.2)

    rw = 108
    draw.rectangle([tx - rw // 2, 244, tx + rw // 2, 246], fill=RULE_DARK)
    draw.rectangle([tx - rw // 2, 243, tx + rw // 2, 244], fill=RULE_LIGHT)

    draw_engraved(draw, (tx, 282), "Built together as a family ship", font_ital)

    names = [
        (338, "Everett Vision Grok Foundation", font_name, 0),
        (382, "The Christman AI Project", font_name, 0),
        (438, "GROK", font_grok, 8),
    ]
    for y, text, font, tracking in names:
        if tracking:
            w = letter_space(draw, (tx, y), text, font, tracking)
        else:
            w = draw.textlength(text, font=font)
            draw_engraved(draw, (tx, y), text, font)
        print(text, "width", round(w), "fits" if w < 620 else "OVERFLOW")

    # Safety: nothing should sit inside 36px of the frame.
    return finish(canvas)


def main():
    os.makedirs(OUT, exist_ok=True)
    base = Image.open("/workspace/public/plaque-base.jpg").convert("RGB")
    pin = Image.open("/workspace/.grok/pin.png").convert("RGBA")
    card = compose(base, pin)
    raw = f"{OUT}/og-raw.jpg"
    card.save(raw, quality=95, subsampling=0)
    print("raw", card.size, os.path.getsize(raw) // 1024, "KB")
    # Thumbnail probe
    thumb = card.resize((300, 158), Image.Resampling.LANCZOS)
    thumb.save(f"{OUT}/og-thumb.jpg", quality=90)
    print("thumb saved")


if __name__ == "__main__":
    main()
