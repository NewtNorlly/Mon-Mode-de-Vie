from __future__ import annotations

import html
import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"
JOURNALS = ROOT / "journals"
SOURCE_TEXTS = JOURNALS / "data" / "source-texts"

# The historical `images` manifest field contains both images and videos.
# Keep that schema for compatibility; the UI distinguishes them by extension.
ENTRIES = {
    "2024-07-22": ("江西省九江市", ["2024-07-22.webp", "2024-07-22-video.mp4"]),
    "2024-07-27": ("湖北省黄冈市黄梅县小池镇", ["2024-07-27-2-video.mp4", "2024-07-27-3-video.mp4", "2024-07-27-1-video.mp4"]),
    "2024-08-08": ("湖北省黄冈市", ["2024-08-08-1.webp", "2024-08-08-2.webp", "2024-08-08-3.webp", "2024-08-08-4.webp"]),
    "2024-08-20": ("江西省九江市柴桑区庐山机场，陕西省西安市新城区，晟洛栖酒店", [
        *[f"2024-08-20-{i}.webp" for i in range(1, 5)],
        "2024-08-20-6.webp",
        "2024-08-20-5.webp",
        *[f"2024-08-20-{i}.webp" for i in range(7, 10)],
    ]),
    "2024-08-23": ("陕西省西安市", ["2024-08-23-video.mp4"]),
    "2024-08-31": ("湖北省武汉市", ["2024-08-31-1.jpg", "2024-08-31-2.jpg"]),
    "2024-09-02": ("湖北省武汉市", ["2024-09-02.jpg"]),
    "2024-09-06": ("湖北省武汉市", ["2024-09-06.jpg"]),
    "2024-09-08": ("华中科技大学紫菘学生公寓", [
        *[f"2024-09-08-{i}.jpg" for i in range(1, 9)],
        "2024-09-08-9.gif",
        "2024-09-08-10.jpg",
        "2024-09-08-11.jpg",
    ]),
    "2024-09-11": ("湖北省武汉市洪山区光谷体育馆", [
        "2024-09-11-video.mp4",
        "2024-09-11-1.jpg",
        "2024-09-11-1-video.mp4",
        "2024-09-11-2-video.mp4",
        "2024-09-11-3-video.mp4",
        "2024-09-11-2.jpg",
    ]),
    "2024-09-12": ("", [
        *[f"2024-09-12-{i}.{'jpg' if i in {1, 2, 14, 15} else 'webp'}" for i in range(1, 16)],
    ]),
    # The downloaded files were named 2024-09-31, an impossible date. Their
    # wild-boar content matches the two explicit image anchors in 2024-09-13.
    "2024-09-13": ("武汉市喻家山", ["2024-09-13-1.jpg", "2024-09-13-2.jpg"]),
    "2024-09-15": ("", ["2024-09-15-1.jpg", "2024-09-15-2.png", "2024-09-15-3.jpg"]),
    "2024-09-16": ("武汉市华科紫菘5栋", ["2024-09-16-1.png", "2024-09-16-2.png", "2024-09-16-3.jpg"]),
    "2024-09-18": ("", [f"2024-09-18-{i}.jpg" for i in range(1, 11)]),
    "2024-09-19": ("", [f"2024-09-19-{i}.jpg" for i in range(1, 4)]),
    "2024-09-20": ("武汉市洪山区华中科技大学主校区中操场", [
        "2024-09-20-1.jpg",
        "2024-09-20-2.webp",
        "2024-09-20-3.webp",
        *[f"2024-09-20-{i}-video.mp4" for i in range(4, 14)],
    ]),
    "2024-12-20": ("湖北省武汉市", ["2024-12-20-video.mp4"]),
    "2025-04-30": ("湖北省武汉市洪山区", ["2025-04-30-video.mp4"]),
    "2025-07-10": ("湖北省黄冈市黄梅县", [
        *[f"2025-07-10-{i}.{'png' if i == 5 else 'jpg'}" for i in range(1, 28)],
    ]),
}


@dataclass(frozen=True)
class MediaPlacement:
    anchor: str
    take: int
    mode: Literal["after", "replace"] = "after"
    trim_following_newlines: bool = False
    trim_preceding_newlines: bool = False


def placeholder(anchor: str, take: int) -> MediaPlacement:
    """Replace a standalone media hint and its adjacent display-only spacing."""
    return MediaPlacement(
        anchor,
        take,
        "replace",
        trim_following_newlines=True,
        trim_preceding_newlines=True,
    )


# ENTRIES stores media in narrative order. Each placement consumes the next
# `take` files. Exact anchors make incorrect or stale layouts fail loudly.
MEDIA_PLACEMENTS = {
    "2024-07-27": [
        MediaPlacement("小池镇•升学宴\n2024.7.27 12：07 柴桑", 2),
        MediaPlacement("清江本色KTV", 1),
    ],
    "2024-08-08": [
        MediaPlacement("（前面是前2个插图）", 2),
        MediaPlacement("（后面是后2个插图）", 2),
    ],
    "2024-08-23": [MediaPlacement("（这里是插图）", 1, "replace")],
    "2024-08-31": [
        MediaPlacement("他乡遇老乡，濯港与小池", 1),
        MediaPlacement("（这里是插图视频）", 0, "replace"),
        MediaPlacement("柴江赣北  :", 1, trim_following_newlines=True),
    ],
    "2024-09-08": [
        MediaPlacement("（这里是照片1到4）", 4, "replace"),
        MediaPlacement("（这里是照片5到8）", 4, "replace"),
        MediaPlacement("（这里是照片9）", 1, "replace"),
        MediaPlacement("（这里是照片10和11）", 2, "replace"),
    ],
    "2024-09-11": [
        MediaPlacement("光谷体育馆", 1),
        MediaPlacement("光谷体育馆内", 4),
        MediaPlacement("好雨知时节，今夕乃发生。\n整个军训师，都被淋湿了！", 1),
    ],
    "2024-09-12": [
        placeholder("（这里放插图（1））", 1),
        placeholder("（这里放插图（2）到（13））", 12),
        placeholder("（这里放插图（14）到（15））", 2),
    ],
    "2024-09-13": [
        placeholder("（这里放插图1）", 1),
        placeholder("（这里放插图2）", 1),
    ],
    "2024-09-15": [placeholder("（这里放插图1到3）", 3)],
    "2024-09-16": [placeholder("（这里放插图1到3）", 3)],
    "2024-09-19": [
        placeholder("（这里放插图1到2）", 2),
        placeholder("（这里放插图3）", 1),
    ],
    "2024-09-20": [placeholder("（这里放插图或视频1到13）", 13)],
    "2025-07-10": [placeholder("（这里放插图1到27）", 27)],
}

TEXT_OVERRIDES = {
    "2024-09-11": (
        "光谷体育馆\n\n"
        "光谷体育馆内\n\n"
        "好雨知时节，今夕乃发生。\n"
        "整个军训师，都被淋湿了！"
    ),
}

# These pages were normalized with a final newline in the latest August media
# revision. Preserve that byte-level shape when the importer regenerates them.
FINAL_NEWLINE_DATES = {"2024-08-08", "2024-08-20", "2024-08-31"}

VIDEO_DIMENSIONS = {
    "2024-07-22-video.mp4": (960, 544),
    "2024-07-27-1-video.mp4": (1280, 720),
    # These two files are stored as 960x544 with non-square pixels (DAR 9:16).
    # Declare the displayed ratio so the browser reserves a portrait player.
    "2024-07-27-2-video.mp4": (544, 960),
    "2024-07-27-3-video.mp4": (544, 960),
    "2024-08-23-video.mp4": (720, 1280),
    "2024-09-11-video.mp4": (960, 544),
    "2024-09-11-1-video.mp4": (544, 960),
    "2024-09-11-2-video.mp4": (960, 544),
    "2024-09-11-3-video.mp4": (1280, 720),
    **{f"2024-09-20-{i}-video.mp4": (960, 544) for i in range(4, 14)},
    "2024-12-20-video.mp4": (1280, 720),
    "2025-04-30-video.mp4": (720, 1280),
}


def natural_paragraphs(raw: str) -> list[str]:
    """Find prose paragraphs without turning poems or comment threads into loose lists."""
    paragraphs: list[str] = []
    for block in re.split(r"(?:\r?\n){2,}", raw.strip("\r\n")):
        lines = [line for line in block.splitlines() if line.strip()]
        long_lines = sum(len(line.strip()) >= 36 for line in lines)
        looks_like_thread = any(
            re.match(r"^\d{4}年\d{1,2}月\d{1,2}日", line.strip())
            or re.match(r"^[^，。！？\n]{1,30}(?:\s+回复[^:：\n]{1,30})?\s+[:：]", line.strip())
            for line in lines
        )
        if len(lines) > 1 and long_lines >= 2 and not looks_like_thread:
            paragraphs.extend(lines)
        else:
            paragraphs.append(block)
    return paragraphs


def original_body(raw: str) -> str:
    """Render the TXT as readable natural paragraphs while preserving its exact text archive."""
    if not raw.strip():
        return ""
    rendered_paragraphs = []
    for paragraph in natural_paragraphs(raw):
        escaped = html.escape(paragraph)
        escaped = re.sub(r" +(?=\n|$)", lambda match: "&#32;" * len(match.group()), escaped)
        rendered_paragraphs.append("<p>" + escaped + "</p>")
    return (
        '<section class="prose journal-original-text" lang="zh-CN" data-journal-original>'
        + "".join(rendered_paragraphs)
        + '</section>'
    )


def clean_duplicate_speaker_lines(raw: str) -> str:
    """Drop a standalone nickname when the next line repeats it before a comment."""
    lines = raw.splitlines(keepends=True)
    cleaned = []
    for index, line in enumerate(lines):
        nickname = line.rstrip("\r\n").strip()
        next_line = lines[index + 1].strip() if index + 1 < len(lines) else ""
        repeated = bool(
            nickname
            and re.match(
                rf"^{re.escape(nickname)}(?:\s+回复[^:：]*)?\s*[:：]",
                next_line,
            )
        )
        if not repeated:
            cleaned.append(line)
    return "".join(cleaned)


def media_html(files: list[str]) -> str:
    figures = []
    for filename in files:
        if filename.endswith(".mp4"):
            poster = filename.replace("-video.mp4", "-poster.webp")
            width, height = VIDEO_DIMENSIONS[filename]
            figures.append(
                '<figure class="journal-video-figure">'
                f'<video src="./assets/images/{filename}" poster="./assets/images/{poster}" '
                f'width="{width}" height="{height}" controls preload="metadata" playsinline disablepictureinpicture '
                'aria-label="日记视频"></video></figure>'
            )
        else:
            figures.append(
                f'<figure><img src="./assets/images/{filename}" alt="" loading="lazy" decoding="async"></figure>'
            )
    return "\n".join(figures)


def media_block(files: list[str]) -> str:
    media = media_html(files)
    return f'<div class="journal-media-prose">{media}</div>' if media else ""


def render_body_with_media(date: str, raw: str, files: list[str]) -> str:
    placements = MEDIA_PLACEMENTS.get(date)
    if not placements:
        return original_body(raw) + media_block(files)

    chunks: list[str] = []
    text_cursor = 0
    file_cursor = 0
    for placement in placements:
        anchor_start = raw.find(placement.anchor, text_cursor)
        if anchor_start < 0:
            raise ValueError(f"{date}: media anchor not found: {placement.anchor!r}")
        anchor_end = anchor_start + len(placement.anchor)
        content_end = anchor_start if placement.mode == "replace" else anchor_end
        if placement.trim_preceding_newlines:
            while content_end > text_cursor and raw[content_end - 1] in "\r\n":
                content_end -= 1
        if placement.mode == "after":
            chunks.append(original_body(raw[text_cursor:content_end]))
        elif placement.mode == "replace":
            chunks.append(original_body(raw[text_cursor:content_end]))
        else:
            raise ValueError(f"{date}: unsupported media placement mode: {placement.mode}")

        batch = files[file_cursor:file_cursor + placement.take]
        if len(batch) != placement.take:
            raise ValueError(f"{date}: media placement needs {placement.take} files, got {len(batch)}")
        chunks.append(media_block(batch))
        file_cursor += placement.take
        text_cursor = anchor_end
        if placement.trim_following_newlines:
            while text_cursor < len(raw) and raw[text_cursor] in "\r\n":
                text_cursor += 1

    if file_cursor != len(files):
        raise ValueError(f"{date}: {len(files) - file_cursor} media files were not placed")
    chunks.append(original_body(raw[text_cursor:]))
    return "".join(chunks)


def display_excerpt_text(date: str, raw: str) -> str:
    for placement in MEDIA_PLACEMENTS.get(date, []):
        if placement.mode == "replace":
            raw = raw.replace(placement.anchor, "", 1)
    return raw


def page(date: str, location: str, raw: str, files: list[str]) -> str:
    body = render_body_with_media(date, raw, files)
    return (
        '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="robots" content="noindex,nofollow,noarchive">'
        f'<link rel="canonical" href="../index.html#journal/{date}">'
        f'<title>{date} · Journal · Mon Mode de Vie</title>'
        f'<style>body{{visibility:hidden}}</style><script>location.replace("../index.html#journal/{date}")</script>'
        '</head><body><article class="journal-article">'
        f'<header class="journal-header"><p class="kicker">Journal · {date}</p>'
        f'<h1><time datetime="{date}">{date}</time></h1><p class="subtitle">{html.escape(location)}</p></header>'
        f'{body}</article><!-- Cloudflare Web Analytics --><script type=\'module\' src=\'https://static.cloudflareinsights.com/beacon.min.js\' data-cf-beacon=\'{{"token": "81b2a38d3fcc41db9b366d13662c628f"}}\'></script><!-- End Cloudflare Web Analytics --></body></html>'
    )


def excerpt_from(raw: str, limit: int = 96) -> str:
    text = re.sub(r"\s+", " ", raw).strip() or "今天的日记没有正文文本啦"
    return text if len(text) <= limit else text[:limit].rstrip() + "……"


def manifest_media(files: list[str]) -> list[dict[str, str]]:
    result = []
    for filename in files:
        item = {"file": "assets/images/" + filename}
        if filename.endswith(".mp4"):
            item["poster"] = "assets/images/" + filename.replace("-video.mp4", "-poster.webp")
        result.append(item)
    return result


def main() -> None:
    SOURCE_TEXTS.mkdir(parents=True, exist_ok=True)
    raw_by_date: dict[str, str] = {}
    for date, (location, files) in ENTRIES.items():
        saved_source = SOURCE_TEXTS / f"{date}.txt"
        downloaded_source = DOWNLOADS / f"{date}.txt"
        source = downloaded_source if downloaded_source.exists() else saved_source
        raw = TEXT_OVERRIDES.get(date)
        if raw is None:
            raw = source.read_text(encoding="utf-8") if source.exists() else ""
        raw_by_date[date] = clean_duplicate_speaker_lines(raw)
        if date in TEXT_OVERRIDES:
            saved_source.write_text(raw, encoding="utf-8", newline="\n")
        elif source.exists() and source.resolve() != saved_source.resolve():
            shutil.copy2(source, saved_source)
        rendered_page = page(date, location, raw_by_date[date], files)
        if date in FINAL_NEWLINE_DATES:
            rendered_page += "\n"
        (JOURNALS / f"{date}.html").write_text(rendered_page, encoding="utf-8", newline="\n")

    js_path = JOURNALS / "data" / "journals.js"
    prefix = "window.MMV_JOURNALS = "
    entries = json.loads(js_path.read_text(encoding="utf-8")[len(prefix):].rstrip(" ;\n"))
    entries = [entry for entry in entries if entry["date"] not in ENTRIES]
    for date, (location, files) in ENTRIES.items():
        entries.append({
            "date": date,
            "file": date + ".html",
            "location": location,
            "excerpt": excerpt_from(display_excerpt_text(date, raw_by_date[date])),
            "images": manifest_media(files),
        })
    entries.sort(key=lambda entry: entry["date"], reverse=True)
    payload = json.dumps(entries, ensure_ascii=False, indent=2)
    js_path.write_text(prefix + payload + ";\n", encoding="utf-8", newline="\n")
    (JOURNALS / "data" / "journals.json").write_text(payload + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
