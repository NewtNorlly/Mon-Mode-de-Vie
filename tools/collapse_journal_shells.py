"""Collapse legacy journal documents into non-visual article payloads.

The only journal UI lives in /index.html#journal. Date documents remain solely so
old URLs and the canonical reader can resolve an article without duplicating UI.
"""

from __future__ import annotations

import html
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
JOURNALS = ROOT / "journals"
ARTICLE_RE = re.compile(r"<article\b[^>]*class=[\"'][^\"']*journal-article[^\"']*[\"'][^>]*>.*?</article>", re.I | re.S)
I18N_RE = re.compile(r"<script\b[^>]*id=[\"']journalI18n[\"'][^>]*>.*?</script>", re.I | re.S)
ENTRY_NAV_RE = re.compile(r"\s*<nav\b[^>]*class=[\"'][^\"']*entry-nav[^\"']*[\"'][^>]*>.*?</nav>", re.I | re.S)
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.I | re.S)
DESCRIPTION_RE = re.compile(r"<meta\s+name=[\"']description[\"']\s+content=[\"'](.*?)[\"']\s*/?>", re.I | re.S)


def collapse(path: Path) -> None:
    source = path.read_text(encoding="utf-8")
    article_match = ARTICLE_RE.search(source)
    if not article_match:
        raise RuntimeError(f"No journal article found in {path.name}")

    article = ENTRY_NAV_RE.sub("", article_match.group(0))
    i18n_match = I18N_RE.search(source)
    i18n = i18n_match.group(0) if i18n_match else ""
    title_match = TITLE_RE.search(source)
    title = title_match.group(1).strip() if title_match else f"{path.stem} · Journal · Mon Mode de Vie"
    description_match = DESCRIPTION_RE.search(source)
    description = description_match.group(1).strip() if description_match else "Mon Mode de Vie 日记"
    date = path.stem

    payload = f'''<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <meta name="description" content="{html.escape(html.unescape(description), quote=True)}">
  <link rel="canonical" href="../index.html#journal/{date}">
  <title>{title}</title>
  <style>html{{background:#ece9e1}}body{{margin:0;visibility:hidden}}</style>
  <script>location.replace("../index.html#journal/{date}")</script>
</head>
<body>
{article}
{i18n}
<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{{"token": "81b2a38d3fcc41db9b366d13662c628f"}}'></script><!-- End Cloudflare Web Analytics -->
</body>
</html>
'''
    path.write_text(payload, encoding="utf-8", newline="\n")


def main() -> None:
    files = sorted(path for path in JOURNALS.glob("????-??-??.html"))
    for path in files:
        collapse(path)
    print(f"Collapsed {len(files)} legacy shells into article payloads.")


if __name__ == "__main__":
    main()
