"""Build the website's painting images from the source photos.

For every painting in tools/images.json: rotate, even out the lighting and
fold shading (tools/flatten.py), set the paper to warm white, trim to the
sheet, and write a large and a small JPEG into site/images.

Usage:
  python tools/prepare.py            # all paintings
  python tools/prepare.py red-plum   # just these ids
"""

import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from flatten import flatten  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROT = {90: cv2.ROTATE_90_CLOCKWISE, 180: cv2.ROTATE_180, 270: cv2.ROTATE_90_COUNTERCLOCKWISE}


def resized(rgb, long_side):
    h, w = rgb.shape[:2]
    s = min(1.0, long_side / max(h, w))
    if s == 1.0:
        return rgb
    return cv2.resize(rgb, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA)


def write(path, rgb, quality):
    bgr = cv2.cvtColor((np.clip(rgb, 0, 1) * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR)
    cv2.imwrite(path, bgr, [cv2.IMWRITE_JPEG_QUALITY, quality, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])


def main():
    cfg = json.load(open(os.path.join(ROOT, "tools/images.json")))
    paper = tuple(int(cfg["paper"][i:i + 2], 16) for i in (0, 2, 4))
    only = set(sys.argv[1:])
    out_dir = os.path.join(ROOT, "site/images")
    os.makedirs(out_dir, exist_ok=True)

    for work in cfg["works"]:
        if only and work["id"] not in only:
            continue
        bgr = cv2.imread(os.path.join(ROOT, work["src"]), cv2.IMREAD_COLOR)
        if bgr is None:
            raise SystemExit(f"could not read {work['src']}")
        if "box" in work:  # pixel crop on the original, e.g. a painting inside a framed photo
            x0, y0, x1, y1 = work["box"]
            bgr = bgr[y0:y1, x0:x1]
        if work.get("rotate"):
            bgr = cv2.rotate(bgr, ROT[work["rotate"]])
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255

        # Per-painting overrides for photos where full correction would touch the painting
        # itself (e.g. pale washes behind glare): see "strength"/"detail"/"crease" in images.json.
        rgb = flatten(rgb, work.get("strength", 1.0), work.get("detail", 3.0), work.get("crease", 1.0), paper)[0]

        if "box" not in work:
            t = cfg["default_trim"]
            left, top, right, bottom = work.get("trim", [t, t, t, t])
            h, w = rgb.shape[:2]
            rgb = rgb[round(h * top):round(h * (1 - bottom)), round(w * left):round(w * (1 - right))]

        large = resized(rgb, 2000)
        write(os.path.join(out_dir, f"{work['id']}.jpg"), large, 86)
        write(os.path.join(out_dir, f"{work['id']}-sm.jpg"), resized(rgb, 900), 82)
        print(f"{work['id']:22s} {large.shape[1]}x{large.shape[0]}")


if __name__ == "__main__":
    main()
