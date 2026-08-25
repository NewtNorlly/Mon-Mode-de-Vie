from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


LOCALES = ("zh", "en", "fr", "de")
ARTICLE_PAYLOAD_RE = re.compile(
    r'<script id="journalI18n" type="application/json">(.*?)</script>',
    re.DOTALL,
)
BLOCK_INDEX_RE = re.compile(r'data-journal-block-index="(\d+)"')
CAPTION_INDEX_RE = re.compile(r'data-journal-image-caption="(\d+)"')
THEME_SOURCE_RE = re.compile(
    r"const THEME_KEYS = (?P<keys>\[[\s\S]*?\]);\s*"
    r"const THEME_ROWS = (?P<rows>\[[\s\S]*?\]);\s*"
    r"(?:const (?:THEMES|deepFreeze)|THEME_ROWS\.forEach)"
)
THEME_ID_RE = re.compile(r'^\s*\["([a-z0-9-]+)"', re.MULTILINE)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def verify(output_dir: Path, theme_source: Path | None = None) -> dict[str, int]:
    manifest_path = output_dir / "data" / "journals.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    require(isinstance(manifest, list), "Journal manifest must be an array")
    generated_theme_path = output_dir / "assets" / "journal-themes.js"
    require(generated_theme_path.is_file(), "Theme palette is missing")
    theme_count = 0
    if theme_source is not None:
        canonical_match = THEME_SOURCE_RE.search(theme_source.read_text(encoding="utf-8"))
        generated_match = THEME_SOURCE_RE.search(generated_theme_path.read_text(encoding="utf-8"))
        require(canonical_match is not None, "Canonical theme registry could not be parsed")
        require(generated_match is not None, "Generated theme registry could not be parsed")
        require(
            canonical_match.group("keys").strip() == generated_match.group("keys").strip(),
            "Generated theme keys differ from the root registry",
        )
        require(
            canonical_match.group("rows").strip() == generated_match.group("rows").strip(),
            "Generated theme palettes differ from the root registry",
        )
        theme_count = len(THEME_ID_RE.findall(canonical_match.group("rows")))

    total_blocks = 0
    total_images = 0
    seen_dates: set[str] = set()
    for entry in manifest:
        iso_date = str(entry.get("date", ""))
        require(iso_date not in seen_dates, f"Duplicate journal date: {iso_date}")
        seen_dates.add(iso_date)
        article_path = output_dir / str(entry.get("file", ""))
        require(article_path.is_file(), f"Missing article: {article_path}")
        source = article_path.read_text(encoding="utf-8")
        require("./assets/journal-themes.js" in source, f"Theme runtime missing: {iso_date}")
        require(source.count("data-language-choice=") == 4, f"Language controls missing: {iso_date}")

        payload_match = ARTICLE_PAYLOAD_RE.search(source)
        require(payload_match is not None, f"Inline i18n payload missing: {iso_date}")
        payload = json.loads(payload_match.group(1))
        require(payload.get("date") == iso_date, f"Payload date mismatch: {iso_date}")
        locales = payload.get("locales")
        require(isinstance(locales, dict), f"Locales missing: {iso_date}")

        block_indices = [int(value) for value in BLOCK_INDEX_RE.findall(source)]
        caption_indices = [int(value) for value in CAPTION_INDEX_RE.findall(source)]
        require(block_indices == list(range(len(block_indices))), f"Block indices are unstable: {iso_date}")
        require(caption_indices == list(range(len(caption_indices))), f"Caption indices are unstable: {iso_date}")
        for locale in LOCALES:
            localized = locales.get(locale)
            require(isinstance(localized, dict), f"{iso_date} is missing {locale}")
            blocks = localized.get("blocks")
            captions = localized.get("imageCaptions")
            sources = localized.get("imageSources")
            require(isinstance(blocks, list), f"{iso_date} {locale} blocks are invalid")
            require(len(blocks) == len(block_indices), f"{iso_date} {locale} block count mismatch")
            require(all(isinstance(text, str) and text for text in blocks), f"{iso_date} {locale} has an empty block")
            require(isinstance(captions, list), f"{iso_date} {locale} captions are invalid")
            require(len(captions) == len(caption_indices), f"{iso_date} {locale} caption count mismatch")
            require(isinstance(sources, list), f"{iso_date} {locale} image sources are invalid")
            require(len(sources) == len(caption_indices), f"{iso_date} {locale} image source count mismatch")

        manifest_locales = entry.get("locales")
        require(isinstance(manifest_locales, dict), f"Manifest locales missing: {iso_date}")
        for locale in LOCALES[1:]:
            localized = manifest_locales.get(locale)
            require(isinstance(localized, dict), f"Manifest {iso_date} is missing {locale}")
            require(bool(localized.get("location")), f"Manifest {iso_date} {locale} location is empty")
            require(bool(localized.get("excerpt")), f"Manifest {iso_date} {locale} excerpt is empty")

        total_blocks += len(block_indices)
        total_images += len(caption_indices)

    archive_source = (output_dir / "index.html").read_text(encoding="utf-8")
    require('id="journalArchiveI18n"' in archive_source, "Archive i18n payload is missing")
    require(archive_source.count("data-journal-entry-date=") == len(manifest), "Archive entry count mismatch")
    return {
        "journals": len(manifest),
        "locales": len(LOCALES),
        "blocks": total_blocks,
        "images": total_images,
        "themes": theme_count,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Verify generated Journal language/theme contracts.")
    parser.add_argument("output", type=Path, help="Generated journals directory")
    parser.add_argument("--theme-source", type=Path, help="Root script containing the canonical themes")
    args = parser.parse_args()
    theme_source = args.theme_source.resolve() if args.theme_source else None
    print(json.dumps(verify(args.output.resolve(), theme_source), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
