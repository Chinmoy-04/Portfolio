"""
Builds the site icon: a dot-matrix "C" in off-white on the page black, with
its last cell lit amber (the signal in the noise).

  src/app/icon.svg        modern browsers
  src/app/favicon.ico     16, 32 and 48 px for everything else
  src/app/apple-icon.png  180 px, square (iOS rounds the corners itself)

Run: python scripts/favicon.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "src" / "app"

BG = "#0a0b0d"  # --bg
TEXT = "#e9eaec"  # --text
AMBER = "#ffb020"  # --accent

# "#" off-white cell, "A" amber cell, "." empty.
GLYPH = [".###", "#...", "#...", "#...", ".##A"]

SIZE = 512
RADIUS = 96
PAD = 72
CELL = (SIZE - 2 * PAD) / len(GLYPH)
GAP = CELL * 0.08
OX = (SIZE - len(GLYPH[0]) * CELL) / 2
OY = PAD


def cells():
    for y, row in enumerate(GLYPH):
        for x, v in enumerate(row):
            if v != ".":
                yield OX + x * CELL + GAP, OY + y * CELL + GAP, CELL - 2 * GAP, AMBER if v == "A" else TEXT


def svg() -> str:
    rects = "".join(
        f'<rect x="{x:.1f}" y="{y:.1f}" width="{s:.1f}" height="{s:.1f}" fill="{c}"/>' for x, y, s, c in cells()
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">'
        f'<rect width="{SIZE}" height="{SIZE}" rx="{RADIUS}" fill="{BG}"/>{rects}</svg>\n'
    )


def raster(rounded: bool) -> Image.Image:
    im = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if rounded:
        d.rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=RADIUS, fill=BG)
    else:
        d.rectangle((0, 0, SIZE - 1, SIZE - 1), fill=BG)
    for x, y, s, c in cells():
        d.rectangle((x, y, x + s, y + s), fill=c)
    return im


def main() -> None:
    (APP / "icon.svg").write_text(svg(), encoding="utf-8", newline="\n")
    raster(True).save(APP / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    raster(False).resize((180, 180), Image.LANCZOS).convert("RGB").save(APP / "apple-icon.png", optimize=True)
    print("icon.svg, favicon.ico, apple-icon.png written")


if __name__ == "__main__":
    main()
