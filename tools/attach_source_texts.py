"""Attach preserved journal source notes to their matching article payloads."""

from __future__ import annotations

import html
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "journals" / "data" / "source-texts"
JOURNAL_DIR = ROOT / "journals"
START = "<!-- journal-source-text:start -->"
END = "<!-- journal-source-text:end -->"


def attach(source_path: Path) -> None:
    date = source_path.stem
    journal_path = JOURNAL_DIR / f"{date}.html"
    if not journal_path.exists():
        raise FileNotFoundError(journal_path)
    source = journal_path.read_text(encoding="utf-8")
    if START in source and END in source:
        before, rest = source.split(START, 1)
        _, after = rest.split(END, 1)
        source = before.rstrip() + "\n" + after.lstrip()
    raw = source_path.read_text(encoding="utf-8").strip()
    paragraphs = "\n".join(
        f"          <p>{html.escape(block).replace(chr(10), '<br>')}</p>"
        for block in raw.split("\n\n") if block.strip()
    )
    block = f'''        {START}
        <section class="journal-source-text" lang="zh-CN" aria-labelledby="source-text-{date}">
          <h2 id="source-text-{date}">日记随笔源文本</h2>
{paragraphs}
        </section>
        {END}
'''
    marker = "</article>"
    if marker not in source:
        raise RuntimeError(f"No article closing tag in {journal_path.name}")
    source = source.replace(marker, block + "      " + marker, 1)
    journal_path.write_text(source, encoding="utf-8", newline="\n")


def main() -> None:
    files = sorted(SOURCE_DIR.glob("????-??-??.txt"))
    for path in files:
        attach(path)
    print(f"Attached {len(files)} preserved source texts.")


if __name__ == "__main__":
    main()
