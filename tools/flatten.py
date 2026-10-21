"""Even out lighting and crease shadows on photos of unmounted xuan paper.

The approach is classic flat-field correction, the same idea scanners and
document-capture apps use. Nothing is generated or painted in.

1. Find the bare paper: pixels that are bright relative to their surroundings
   and nearly colorless. Ink and paint are excluded.
2. Estimate how the light falls across the sheet (the "illumination map") by
   smoothly interpolating the paper's brightness, including across painted
   areas, from the paper around them.
3. Divide the photo by that map, so every part of the sheet is lit like its
   best-lit paper. Paint and ink are divided by the same map, so they keep
   their relationship to the paper beneath them.

4. Folds make the light change in a sharp step, which a smooth map can't
   follow. A median-filtered pass over the bare paper adds those steps to the
   map while ignoring finer detail, so paper fibers and grain are kept.

Thin ridge lines at the very crest of a fold are narrower than the median
window, so a faint trace of them stays. That's intended: the result still
looks like a photo of paper, just evenly lit.

Usage:
  python tools/flatten.py IN.jpg OUT.jpg [--strength 1.0] [--detail 3.0] [--crease 1.0] [--rotate 0]
"""

import argparse

import cv2
import numpy as np


def srgb_to_linear(x):
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * x ** (1 / 2.4) - 0.055)


def blur(img, sigma):
    return cv2.GaussianBlur(img, (0, 0), sigmaX=sigma, sigmaY=sigma, borderType=cv2.BORDER_REFLECT)


def paper_mask(srgb, size):
    """1.0 where the pixel is bare paper, 0.0 where there is ink or paint."""
    lum = srgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    chroma = srgb.max(axis=2) - srgb.min(axis=2)

    # Rough lighting estimate: the brightest values nearby, smoothed.
    k = max(3, int(size * 0.03) | 1)
    rough = cv2.dilate(lum, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    rough = blur(rough, size * 0.02)

    relative = lum / np.maximum(rough, 1e-3)

    # Judge color relative to the paper's own tint, so warm or cool paper
    # (or a camera's white balance) isn't mistaken for paint.
    bright = relative > 0.9
    if bright.sum() > 100:
        tint = np.median(srgb[bright], axis=0)
        balanced = srgb / np.maximum(tint, 1e-3) * tint.mean()
        chroma = balanced.max(axis=2) - balanced.min(axis=2)
    mask = ((relative > 0.82) & (chroma < 0.10)).astype(np.float32)

    # Pull back from painted edges so soft washes aren't mistaken for paper.
    e = max(3, int(size * 0.006) | 1)
    mask = cv2.erode(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (e, e)))
    return mask


def illumination(linear, mask, size, detail):
    """Per-channel light falloff across the sheet, interpolated under paint.

    Two scales: a fine one that follows crease shading on open paper, and a
    broad one that fills in under large painted areas.
    """
    fine_sigma = size * 0.012 / max(detail, 0.05)
    broad_sigma = size * 0.06
    m3 = mask[..., None]

    def normalized(sigma):
        num = blur(linear * m3, sigma)
        den = blur(mask, sigma)[..., None]
        return num, den

    num_b, den_b = normalized(broad_sigma)
    broad = num_b / np.maximum(den_b, 1e-4)
    num_f, den_f = normalized(fine_sigma)
    tau = 0.08  # how much paper coverage the fine scale needs before it's trusted
    return (num_f + tau * broad) / (den_f + tau)


def crease_steps(linear, light, mask, size, crease):
    """Sharp light steps along folds, which the smooth map can't follow.

    Takes what's left on the bare paper after the smooth correction and runs a
    median filter over it. A median keeps step edges (a fold's lit and shaded
    sides) but discards detail narrower than half its window (paper fibers,
    grain), so only the fold shading goes into the map. Under paint there is
    no paper to measure, so the map stays at the smooth estimate there.
    """
    lum_w = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    residual = (linear @ lum_w) / np.maximum(light @ lum_w, 1e-4)
    residual = np.where(mask > 0.5, residual, 1.0)

    # medianBlur needs 8-bit for large windows; ±40% around 1.0 in 255 levels.
    lo, span = 0.6, 0.8
    q = np.clip((residual - lo) / span * 255 + 0.5, 0, 255).astype(np.uint8)
    k = max(3, int(size * 0.008 * crease) | 1)
    med = cv2.medianBlur(q, k).astype(np.float32) / 255 * span + lo
    med = blur(med, 1.0)  # smooth out the 8-bit steps only

    # Fade the step map out near paint, where the window is mostly fill.
    coverage = blur(mask, k / 2)
    return 1.0 + (med - 1.0) * np.clip(coverage * 1.5, 0, 1)


def flatten(srgb, strength=1.0, detail=3.0, crease=1.0, paper_color=None, work_size=2400):
    h, w = srgb.shape[:2]
    scale = min(1.0, work_size / max(h, w))
    small = cv2.resize(srgb, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_AREA)
    size = max(small.shape[:2])

    mask = paper_mask(small, size)
    small_lin = srgb_to_linear(small)
    light_small = illumination(small_lin, mask, size, detail)
    if crease > 0:
        light_small = light_small * crease_steps(small_lin, light_small, mask, size, crease)[..., None]
    light = cv2.resize(light_small, (w, h), interpolation=cv2.INTER_CUBIC)

    # Target: the tone of the best-lit paper in this photo, so the paper keeps
    # its own color rather than being bleached to pure white.
    paper = srgb_to_linear(small)[mask > 0.5]
    measured = np.percentile(paper, 92, axis=0) if len(paper) > 500 else light_small.reshape(-1, 3).max(axis=0)
    target = measured
    if paper_color is not None:
        # White balance + exposure in one step: map the paper to a chosen tone.
        # A single color shift for the whole image, so paint keeps its relation to the paper.
        target = srgb_to_linear(np.asarray(paper_color, dtype=np.float32) / 255.0)

    # Local evening-out (scaled by strength; 0 = none) times the global tone shift.
    gain = (measured / np.maximum(light, 1e-4)) ** strength * (target / measured)
    out = srgb_to_linear(srgb) * gain
    return linear_to_srgb(out), mask, light_small, target


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--strength", type=float, default=1.0, help="0 = unchanged, 1 = fully even lighting")
    p.add_argument("--detail", type=float, default=3.0, help="higher follows smaller creases (0.5-4)")
    p.add_argument("--crease", type=float, default=1.0, help="fold-edge removal; 0 = off, 1 = default")
    p.add_argument("--paper", help="set the paper tone as hex, e.g. efebe2 (white balance + exposure)")
    p.add_argument("--rotate", type=int, default=0, choices=[0, 90, 180, 270], help="clockwise degrees")
    p.add_argument("--debug", help="also write the paper mask and lighting map with this path prefix")
    a = p.parse_args()

    bgr = cv2.imread(a.input, cv2.IMREAD_COLOR)
    if bgr is None:
        raise SystemExit(f"could not read {a.input}")
    rot = {90: cv2.ROTATE_90_CLOCKWISE, 180: cv2.ROTATE_180, 270: cv2.ROTATE_90_COUNTERCLOCKWISE}
    if a.rotate:
        bgr = cv2.rotate(bgr, rot[a.rotate])
    srgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0

    paper = tuple(int(a.paper[i:i + 2], 16) for i in (0, 2, 4)) if a.paper else None
    out, mask, light, target = flatten(srgb, a.strength, a.detail, a.crease, paper)
    cv2.imwrite(a.output, cv2.cvtColor((out * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR),
                [cv2.IMWRITE_JPEG_QUALITY, 95])
    if a.debug:
        cv2.imwrite(a.debug + "-mask.png", (mask * 255).astype(np.uint8))
        lum = light @ np.array([0.2126, 0.7152, 0.0722])
        cv2.imwrite(a.debug + "-light.png", (np.clip(lum / lum.max(), 0, 1) * 255).astype(np.uint8))


if __name__ == "__main__":
    main()
