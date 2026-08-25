from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ALBUM_ROOT = PROJECT_ROOT / "assets" / "album"
EXPECTED_BOOKS = {
    "portraits",
    "life",
    "animals",
    "archives",
    "illustrations",
    "comics",
    "landscapes",
}


def main() -> int:
    errors: list[str] = []
    files = sorted(ALBUM_ROOT.glob("*/*.webp"))
    books = {path.parent.name for path in files}
    hashes: dict[str, str] = {}
    dimensions: dict[str, int] = {}

    if books != EXPECTED_BOOKS:
        errors.append(f"Unexpected album folders: expected {sorted(EXPECTED_BOOKS)}, received {sorted(books)}.")
    if len(files) < 42:
        errors.append(f"Expected at least 42 artworks, received {len(files)}.")

    for path in files:
        relative = path.relative_to(PROJECT_ROOT).as_posix()
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest in hashes:
            errors.append(f"Duplicate artwork bytes: {relative} and {hashes[digest]}.")
        hashes[digest] = relative

        try:
            with Image.open(path) as image:
                image.verify()
            with Image.open(path) as image:
                width, height = image.size
                dimensions[f"{width}x{height}"] = dimensions.get(f"{width}x{height}", 0) + 1
                if image.format != "WEBP":
                    errors.append(f"{relative}: expected WEBP, received {image.format}.")
                is_four_by_three = width * 3 == height * 4
                is_three_by_two = width * 2 == height * 3
                if not (is_four_by_three or is_three_by_two):
                    errors.append(f"{relative}: expected a 4:3 or 3:2 landscape ratio, received {width}x{height}.")
                if width < 1200 or height < 900:
                    errors.append(f"{relative}: image is smaller than 1200x900 ({width}x{height}).")
        except Exception as error:  # Pillow supplies the actionable decoder detail.
            errors.append(f"{relative}: {error}")

    report = {
        "books": len(books),
        "artworks": len(files),
        "dimensions": dimensions,
        "unique_sha256": len(hashes),
        "errors": errors,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
