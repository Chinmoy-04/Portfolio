"""
Builds the About-section portrait from public/portrait.jpg:

  public/portrait-duotone.png   page background to off-white, amber in the mids

The white studio background and the black corners are flood-filled away from
the image edge, so the subject sits directly on the page background.

Run: python scripts/portrait.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "portrait.jpg"

BG = np.array([0x0A, 0x0B, 0x0D], float)  # --bg
TEXT = np.array([0xE9, 0xEA, 0xEC], float)  # --text
AMBER = np.array([0xFF, 0xB0, 0x20], float)  # --accent



def subject_mask(rgb: np.ndarray) -> np.ndarray:
    """True where the person is. Background = bright, unsaturated, or pure black, reached from the edge."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    hi, lo = rgb.max(-1), rgb.min(-1)
    white = (lo > 214) & (hi - lo < 18)
    black = hi < 6
    candidate = white | black
    labels, _ = ndimage.label(candidate)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.isin(labels, edge[edge > 0])
    # The white wall also touches the black corners, so include white regions touching black ones.
    bg |= white & ndimage.binary_dilation(bg, iterations=2) & np.isin(labels, np.unique(labels[bg]))
    subject = ~bg
    # The photo is a disc: drop its anti-aliased rim, which is neither white nor black.
    h, w = subject.shape
    yy, xx = np.mgrid[:h, :w]
    subject &= np.hypot(yy - h / 2, xx - w / 2) < 0.985 * min(h, w) / 2
    subject = ndimage.binary_opening(subject, iterations=2)
    subject = ndimage.binary_fill_holes(subject)
    # Pull the edge in so no light fringe from the wall survives around the hair.
    return ndimage.binary_erosion(subject, iterations=4)


def soft(mask: np.ndarray, radius: float = 2.0) -> np.ndarray:
    img = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))
    return np.asarray(img, float) / 255.0


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    rgb = np.asarray(im, float)
    mask = subject_mask(rgb)
    # Fade the shoulders out over the bottom fifth instead of ending on the disc's curve.
    h = rgb.shape[0]
    fade = np.clip((0.97 - np.arange(h) / h) / 0.2, 0, 1)[:, None]
    alpha = (soft(mask) * fade)[..., None]

    lum = (rgb @ np.array([0.2126, 0.7152, 0.0722])) / 255.0
    # Lift the shadows a little so hair and jacket keep their shape on near-black.
    lo, hi = np.percentile(lum[mask], [2, 98])
    t = np.clip((lum - lo) / (hi - lo), 0, 1) ** 0.85

    # Duotone with an amber midtone: bg -> amber at the middle -> off-white at the top.
    t3 = t[..., None]
    mid = 0.55
    low = BG + (AMBER * 0.55 + BG * 0.45 - BG) * np.clip(t3 / mid, 0, 1)
    tone = np.where(t3 < mid, low, (AMBER * 0.55 + BG * 0.45) + (TEXT - (AMBER * 0.55 + BG * 0.45)) * ((t3 - mid) / (1 - mid)))
    out = BG + (tone - BG) * alpha
    Image.fromarray(out.clip(0, 255).astype(np.uint8)).resize((800, 800), Image.LANCZOS).save(
        ROOT / "public" / "portrait-duotone.png", optimize=True
    )

    print(f"mask covers {mask.mean():.0%}")


if __name__ == "__main__":
    main()
