"""Convert a generated album image to a web-ready WebP without resizing it."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("target", type=Path)
    parser.add_argument("--quality", type=int, default=90)
    args = parser.parse_args()

    args.target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(args.source) as opened:
        image = ImageOps.exif_transpose(opened)
        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGB")
        image.save(args.target, "WEBP", quality=args.quality, method=6)
        print(f"{args.target}\t{image.width}x{image.height}\t{args.target.stat().st_size} bytes")


if __name__ == "__main__":
    main()
