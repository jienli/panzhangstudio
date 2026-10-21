"""Generate the material textures used for framing on the site.

Everything is procedural and seeded, so rerunning gives identical files.
Noise is shaped in the frequency domain, which makes every texture tile
seamlessly in both directions.

Usage:
  python tools/textures.py [SITE_DIR] [DESIGN_DIR]
  (defaults: site/textures for the frame, design/textures for the scroll silk)
"""

import os
import sys

import cv2
import numpy as np

RNG = np.random.default_rng(20261021)


def periodic_noise(h, w, sigma_y, sigma_x):
    """White noise blurred by an (anisotropic) Gaussian, wrapping at the edges."""
    n = RNG.standard_normal((h, w))
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    kernel = np.exp(-2 * (np.pi ** 2) * ((fy * sigma_y) ** 2 + (fx * sigma_x) ** 2))
    out = np.real(np.fft.ifft2(np.fft.fft2(n) * kernel))
    return (out - out.mean()) / (out.std() + 1e-9)


def hex_rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32) / 255


def save(path, rgb):
    bgr = cv2.cvtColor((np.clip(rgb, 0, 1) * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR)
    cv2.imwrite(path, bgr, [cv2.IMWRITE_JPEG_QUALITY, 90])


def walnut(h=256, w=2048):
    """Straight-grained walnut, grain running along x."""
    # Growth rings seen edge-on: bands across y, gently wandering along x.
    wander = periodic_noise(h, w, 60, 400) * 9 + periodic_noise(h, w, 20, 120) * 2.5
    y = np.arange(h, dtype=np.float64)[:, None]
    # Uneven ring spacing: a slowly varying growth rate across the board.
    rate = np.cumsum(1.0 + 0.55 * periodic_noise(h, 1, 14, 1)[:, 0])[:, None]
    phase = (rate + wander) / 11.0
    rings = 0.5 + 0.5 * np.sin(2 * np.pi * phase)
    strength = np.clip(0.55 + 0.45 * periodic_noise(h, w, 25, 260), 0, 1)
    rings = (rings ** 3.0) * strength         # late wood: narrow dark lines of varying weight
    # Long fibers and the occasional pore streak.
    fibers = periodic_noise(h, w, 0.7, 60)
    pores = np.clip(periodic_noise(h, w, 0.6, 9) - 2.2, 0, None)
    figure = periodic_noise(h, w, 40, 220)    # broad light/dark figure in the board

    light, mid, dark = hex_rgb("7b5136"), hex_rgb("553421"), hex_rgb("2e1a10")
    t = np.clip(0.47 + 0.16 * figure - 0.38 * rings + 0.07 * fibers - 0.25 * pores, 0, 1)[..., None]
    rgb = np.where(t > 0.5, mid + (light - mid) * (t - 0.5) * 2, dark + (mid - dark) * t * 2)
    return rgb


def mat_board(size=512):
    """Cotton mat board: cream, with very faint fibers."""
    base = hex_rgb("f6f1e6")
    fib = periodic_noise(size, size, 0.8, 6) * 0.35 + periodic_noise(size, size, 6, 0.8) * 0.35
    speck = periodic_noise(size, size, 0.6, 0.6)
    lum = 0.006 * fib + 0.004 * speck
    return base + lum[..., None]


def silk_damask(size=384, cell=96):
    """Mounting silk (绫): twill weave with a jacquard motif shown only as sheen.

    Inside the motif the twill runs the other diagonal, which is how real damask
    makes its pattern visible: same thread, same color, different reflection.
    """
    y, x = np.mgrid[0:size, 0:size].astype(np.float64)
    twill_a = 0.5 + 0.5 * np.sin(2 * np.pi * (x + y) / 3.0)
    twill_b = 0.5 + 0.5 * np.sin(2 * np.pi * (x - y) / 3.0)

    # Motif: a diamond lattice with a four-petal flower in each cell (菱花纹).
    u = (x % cell) - cell / 2
    v = (y % cell) - cell / 2
    diamond = np.abs(np.abs(u) + np.abs(v) - cell * 0.47) < cell * 0.035
    r = np.hypot(u, v)
    theta = np.arctan2(v, u)
    petals = r < cell * (0.16 + 0.09 * np.cos(4 * theta))
    centre = r < cell * 0.05
    # Offset flowers on the lattice corners too.
    u2 = ((x + cell / 2) % cell) - cell / 2
    v2 = ((y + cell / 2) % cell) - cell / 2
    r2 = np.hypot(u2, v2)
    dots = r2 < cell * 0.07
    motif = (diamond | (petals & ~centre) | dots).astype(np.float64)
    motif = cv2.GaussianBlur(motif, (0, 0), 0.8)

    weave = twill_a * (1 - motif) + twill_b * motif
    slub = periodic_noise(size, size, 0.6, 30) * 0.5 + periodic_noise(size, size, 30, 0.6) * 0.5
    sheen = 0.012 * motif + 0.022 * weave + 0.012 * slub
    base = hex_rgb("e4dbc6")
    return base * (0.975 + sheen)[..., None]


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "site/textures"
    design = sys.argv[2] if len(sys.argv) > 2 else "design/textures"
    os.makedirs(out, exist_ok=True)
    os.makedirs(design, exist_ok=True)
    wood = walnut()
    save(f"{out}/walnut-h.jpg", wood)
    save(f"{out}/walnut-v.jpg", np.ascontiguousarray(np.rot90(wood)))
    save(f"{out}/mat.jpg", mat_board())
    silk = silk_damask()
    save(f"{design}/silk.jpg", silk)
    # 隔水 bands: same weave, a slightly deeper tone of the same silk.
    save(f"{design}/silk-band.jpg", silk * hex_rgb("d9cdb2") / hex_rgb("e4dbc6"))
    print("wrote textures to", out, "and", design)


if __name__ == "__main__":
    main()
