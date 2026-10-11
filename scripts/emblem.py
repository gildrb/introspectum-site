# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow==12.0.0", "numpy==2.3.4", "scipy==1.16.3", "svg.path==7.0"]
# ///
"""Builds public/images/logo-outline.webp, the footer's emblem, from src/logo.svg.

    uv run scripts/emblem.py

The mark's outline, drawn as if in chalk on rough paper: the chevron, and the eye down to its
middle. Each stroke is broken by the paper's tooth, its edges are ragged, and from the eye's top
down it crumbles into grain until nothing is left. The file is a mask, fully opaque or fully clear
at every pixel: the page gives it one solid color (`colors.chalk`), with no opacity and no
gradient. The same seed gives the same file.
"""

import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from svg.path import Move, parse_path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "src/logo.svg"
OUTPUT = ROOT / "public/images/logo-outline.webp"
# Twice the emblem's widest showing (about 750px, the footer's height across the mark), so a
# pixel of the mask is a device pixel on a sharp screen: the browser never averages the grain
# into a paler, see-through line.
WIDTH = 1500
# Drawn at twice that size, then reduced to fully opaque or fully clear pixels.
SCALE = 2
STROKE = 4.5  # Half the chalk line's width, in output pixels.
SEED = 1609


def subpaths(d: str) -> list[list[complex]]:
    """Every closed subpath of the mark as a polygon, its curves sampled finely."""
    polygons: list[list[complex]] = []
    for segment in parse_path(d):
        if isinstance(segment, Move):
            polygons.append([])
            continue
        steps = max(2, int(segment.length() / 8))
        polygons[-1].extend(segment.point(i / steps) for i in range(steps))
    return [polygon for polygon in polygons if len(polygon) > 2]


def main() -> None:
    svg = SOURCE.read_text()
    box = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
    path = re.search(r'<path d="([^"]+)"', svg)
    if box is None or path is None:
        raise SystemExit("src/logo.svg must hold one <path> in a viewBox from 0 0.")
    mark_width = float(box[1])
    polygons = subpaths(path[1])
    # The eye is the largest subpath that is not a chevron: its middle ends the emblem.
    eye = max(polygons[2:], key=lambda p: max(q.imag for q in p) - min(q.imag for q in p))
    eye_top = min(q.imag for q in eye)
    eye_middle = (eye_top + max(q.imag for q in eye)) / 2

    pad = 3 * STROKE
    scale = (WIDTH - 2 * pad) / mark_width
    height = round(eye_middle * scale + 2 * pad)
    big = SCALE
    canvas = Image.new("L", (WIDTH * big, height * big), 0)
    draw = ImageDraw.Draw(canvas)
    for polygon in polygons:
        points = [((q.real * scale + pad) * big, (q.imag * scale + pad) * big) for q in polygon]
        draw.polygon(points, outline=255, width=1)
    lines = np.asarray(canvas) > 0

    rng = np.random.default_rng(SEED)
    # Distance to the nearest outline, wobbled by slow noise, so the stroke swells and thins.
    distance = ndimage.distance_transform_edt(~lines) / big
    wobble = ndimage.gaussian_filter(rng.standard_normal(lines.shape), 18 * big)
    wobble /= np.abs(wobble).max()
    reach = STROKE * (1 + 0.35 * wobble)
    # The paper's tooth: fine noise, clumped a little. Chalk catches on its peaks.
    tooth = ndimage.gaussian_filter(rng.standard_normal(lines.shape), 1.6 * big)
    tooth /= tooth.std()
    # Dense in the stroke's middle, thinning to stray grains at its ragged edge.
    density = np.clip(1 - distance / reach, 0, 1) ** 0.6
    # From the eye's top down, the chalk crumbles: less and less of it holds, to none at the end.
    rows = (np.arange(lines.shape[0]) / big - pad) / scale
    crumble = np.clip((rows - eye_top) / (eye_middle - eye_top), 0, 1)[:, None]
    hold = density * (1 - crumble**0.8)
    # Solid in the stroke's core, where chalk fills the paper's tooth; grain only at the edges.
    chalk = (tooth > 3.0 * (1 - hold) - 1.9) & (hold > 0)

    small = Image.fromarray((chalk * 255).astype(np.uint8)).resize(
        (WIDTH, height), Image.Resampling.BOX
    )
    # Back to fully opaque or fully clear: a pixel is chalk if most of it was.
    alpha = (np.asarray(small) >= 128).astype(np.uint8) * 255
    image = Image.new("RGBA", (WIDTH, height), (0, 0, 0, 0))
    image.putalpha(Image.fromarray(alpha))
    image.save(OUTPUT, lossless=True, method=6)
    print(f"{OUTPUT.relative_to(ROOT)}: {WIDTH}x{height}, {OUTPUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
