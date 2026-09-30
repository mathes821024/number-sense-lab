#!/usr/bin/env python3
"""Prepare generated white-background mascot art for the math-lab theme.

The source images remain untouched. This removes only the near-white region
connected to the canvas edge, so white eyes and highlights inside the mascot
survive. Outputs are cropped, padded and fitted to a consistent web canvas.
"""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "h5" / "themes" / "math-lab" / "assets"
SOURCES = (
    "mascot-default.png",
    "mascot-correct.png",
    "mascot-thinking.png",
)
CANVAS = 640
BACKGROUND_DISTANCE_LIMIT = 62.0
OPAQUE_DISTANCE = 48.0
TRANSPARENT_DISTANCE = 8.0


def edge_connected(candidate: np.ndarray) -> np.ndarray:
    """Return the candidate pixels connected to any canvas edge."""
    height, width = candidate.shape
    connected = np.zeros_like(candidate, dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        if candidate[0, x]:
            queue.append((0, x))
        if candidate[height - 1, x]:
            queue.append((height - 1, x))
    for y in range(height):
        if candidate[y, 0]:
            queue.append((y, 0))
        if candidate[y, width - 1]:
            queue.append((y, width - 1))

    while queue:
        y, x = queue.popleft()
        if connected[y, x] or not candidate[y, x]:
            continue
        connected[y, x] = True
        if y:
            queue.append((y - 1, x))
        if y + 1 < height:
            queue.append((y + 1, x))
        if x:
            queue.append((y, x - 1))
        if x + 1 < width:
            queue.append((y, x + 1))

    return connected


def remove_edge_background(image: Image.Image) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32)
    distance = np.linalg.norm(255.0 - rgb, axis=2)
    connected = edge_connected(distance <= BACKGROUND_DISTANCE_LIMIT)

    alpha = np.full(distance.shape, 255.0, dtype=np.float32)
    transition = np.clip(
        (distance - TRANSPARENT_DISTANCE)
        / (OPAQUE_DISTANCE - TRANSPARENT_DISTANCE),
        0.0,
        1.0,
    )
    transition = transition * transition * (3.0 - 2.0 * transition)
    alpha[connected] = transition[connected] * 255.0

    rgba = np.dstack((rgb.astype(np.uint8), alpha.astype(np.uint8)))
    return Image.fromarray(rgba, "RGBA")


def fit_web_canvas(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if bbox is None:
        raise ValueError("background removal produced an empty image")

    left, top, right, bottom = bbox
    pad = max(20, round(max(right - left, bottom - top) * 0.045))
    crop = image.crop(
        (
            max(0, left - pad),
            max(0, top - pad),
            min(image.width, right + pad),
            min(image.height, bottom + pad),
        )
    )
    scale = min((CANVAS - 32) / crop.width, (CANVAS - 32) / crop.height)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    crop = crop.resize(size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (255, 255, 255, 0))
    offset = ((CANVAS - size[0]) // 2, (CANVAS - size[1]) // 2)
    canvas.alpha_composite(crop, offset)
    return canvas


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for name in SOURCES:
        source = ROOT / name
        if not source.is_file():
            raise FileNotFoundError(source)
        output = OUTPUT_DIR / name
        prepared = fit_web_canvas(remove_edge_background(Image.open(source)))
        prepared.save(output, optimize=True, compress_level=9)
        print(f"{source.name} -> {output.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
