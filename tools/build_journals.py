from __future__ import annotations

import argparse
import html
import json
import re
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Literal

import pdfplumber
from PIL import Image
from pypdf import PdfReader


DATE_LINE_RE = re.compile(
    r"^(?P<year>20\d{2})/(?P<month>\d{2})/(?P<day>\d{2})\s+定位：(?P<location>.*)$"
)
PAGE_NUMBER_RE = re.compile(r"^\d{1,2}$")
FIGURE_CAPTION_RE = re.compile(r"^图\s*3\.\d+\s*:")
FIGURE_LABEL_RE = re.compile(r"^\([ab]\)\s*")
THEME_SOURCE_RE = re.compile(
    r"const THEME_KEYS = (?P<keys>\[[\s\S]*?\]);\s*"
    r"const THEME_ROWS = (?P<rows>\[[\s\S]*?\]);\s*"
    r"const THEMES"
)

EXPECTED_DATES = [
    "2024-08-20",
    "2024-08-21",
    "2025-01-19",
    "2025-03-28",
    "2025-04-01",
    "2025-04-26",
    "2025-05-01",
    "2025-05-09",
    "2025-05-12",
    "2025-05-16",
    "2025-05-27",
    "2025-06-15",
    "2025-06-16",
    "2025-06-20",
    "2025-06-28",
    "2025-06-29",
    "2025-06-30",
    "2025-07-01",
    "2025-07-02",
    "2025-07-03",
    "2025-07-04",
    "2025-07-08",
    "2025-07-19",
]

SOURCE_TITLE = "朝花夕拾小故事（乙巳年第壹册）"
SUPPORTED_LOCALES = ("en", "fr", "de")
JOURNAL_ASSET_VERSION = "20260720-i18n-v1"


@dataclass
class Block:
    kind: Literal["paragraph", "note", "source-note", "code"]
    text: str


@dataclass
class ImageSpec:
    page: int | None
    index: int | None
    caption: str
    position: Literal["before-body", "after-body", "before-prefix"] = "before-body"
    before_prefix: str | None = None
    filename: str | None = None
    source_label: str | None = None
    asset_path: str | None = None


@dataclass
class Journal:
    iso_date: str
    location: str
    source_pages: set[int] = field(default_factory=set)
    blocks: list[Block] = field(default_factory=list)
    images: list[ImageSpec] = field(default_factory=list)
    source_kind: Literal["pdf", "site-session"] = "pdf"
    source_label: str = SOURCE_TITLE
    translations: dict[str, dict[str, object]] = field(default_factory=dict)


IMAGE_ASSIGNMENTS: dict[str, list[ImageSpec]] = {
    "2025-01-19": [
        ImageSpec(16, 1, "西报告厅招生宣讲", "after-body"),
        ImageSpec(16, 2, "柴小桑学长", "after-body"),
    ],
    "2025-06-15": [
        ImageSpec(20, 1, "韵苑天光夜色 1", "before-prefix", "rmdir /S /Q"),
        ImageSpec(20, 2, "韵苑天光夜色 2", "before-prefix", "rmdir /S /Q"),
    ],
    "2025-06-20": [
        ImageSpec(21, 1, "2025/06/20 方部长请客", "before-body"),
    ],
    "2025-07-01": [
        ImageSpec(23, 1, "百惠园三楼存行李", "before-body"),
    ],
}


JOURNAL_CSS = r"""@charset "UTF-8";

:root {
  color-scheme: light;
  --page: #ece9e1;
  --paper: #fbfaf6;
  --ink: #25272d;
  --muted: #666970;
  --faint: #8d8e90;
  --line: #d5d0c4;
  --accent: #315f73;
  --accent-soft: #dce8ed;
  --note: #f1ece1;
  --media-matte: #ece9e1;
  --shadow: 0 20px 60px rgba(48, 43, 33, 0.09);
  --serif: "Times New Roman", "Songti SC", SimSun, STSong, serif;
  --sans: "Times New Roman", "Songti SC", SimSun, STSong, serif;
}

:root[data-mode="dark"] {
  color-scheme: dark;
  --page: #171a1d;
  --paper: #202428;
  --ink: #e8e5dc;
  --muted: #b3b3ae;
  --faint: #8d918f;
  --line: #3b4144;
  --accent: #93c0d2;
  --accent-soft: #253b45;
  --note: #2a2a27;
  --media-matte: #171a1d;
  --shadow: 0 24px 72px rgba(0, 0, 0, 0.25);
}

* { box-sizing: border-box; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

html { scroll-behavior: smooth; }

body {
  margin: 0;
  min-height: 100vh;
  background: var(--page);
  color: var(--ink);
  font-family: var(--serif);
  font-size: 15px;
  line-height: 1.8;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; }

button, a { -webkit-tap-highlight-color: transparent; }

.site-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 10px clamp(18px, 4vw, 44px);
  border-bottom: 1px solid color-mix(in srgb, var(--line) 72%, transparent);
  background: color-mix(in srgb, var(--paper) 88%, transparent);
  backdrop-filter: blur(14px);
  font-family: var(--sans);
}

.site-bar a {
  color: var(--muted);
  text-decoration: none;
}

.site-bar a:hover, .site-bar a:focus-visible { color: var(--accent); }

.journal-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.language-switcher {
  display: inline-flex;
  align-items: center;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--paper) 84%, var(--page));
}

.language-switcher button {
  min-width: 44px;
  min-height: 44px;
  padding: 6px 9px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font: 700 11px/1 var(--sans);
  letter-spacing: 0.04em;
  cursor: pointer;
}

.language-switcher button:hover,
.language-switcher button:focus-visible {
  color: var(--accent);
  outline: none;
}

.language-switcher button:focus-visible {
  box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--accent);
}

.language-switcher button.is-selected {
  background: var(--accent-soft);
  color: var(--accent);
}

.theme-toggle {
  min-width: 52px;
  min-height: 44px;
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper);
  color: var(--muted);
  font: 600 12px/1 var(--sans);
  letter-spacing: 0.08em;
  cursor: pointer;
}

.theme-toggle:hover, .theme-toggle:focus-visible {
  border-color: var(--accent);
  color: var(--accent);
  outline: none;
}

.theme-toggle:focus-visible {
  box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--accent);
}

.reading-shell, .archive-shell {
  width: min(calc(100% - 28px), 920px);
  margin: clamp(22px, 5vw, 64px) auto;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: var(--shadow);
}

.journal-article { padding: clamp(28px, 7vw, 76px); }

.journal-header {
  padding-bottom: clamp(28px, 5vw, 48px);
  border-bottom: 1px solid var(--line);
}

.kicker {
  margin: 0 0 14px;
  color: var(--accent);
  font: 700 12px/1.4 var(--sans);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1, h2, h3, p { text-wrap: pretty; }

h1 {
  margin: 0;
  font-size: clamp(34px, 7vw, 64px);
  font-weight: 500;
  line-height: 1.08;
  letter-spacing: -0.035em;
}

.location {
  margin: 22px 0 0;
  color: var(--muted);
  font: 500 clamp(15px, 2.4vw, 18px)/1.7 var(--sans);
}

.location-label {
  display: inline-block;
  margin-right: 0.55em;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.source-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 18px;
  color: var(--faint);
  font: 12px/1.5 var(--sans);
}

.source-pill {
  padding: 5px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
}

.journal-body {
  max-width: 720px;
  margin: clamp(32px, 6vw, 58px) auto 0;
  font-size: 15px;
  line-height: 1.8;
  letter-spacing: 0.018em;
}

.journal-body > p {
  margin: 0 0 1.1em;
  text-indent: 2em;
}

.journal-note {
  margin: 26px 0;
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--note);
  font-size: 14px;
  line-height: 1.75;
}

.journal-note-label {
  display: block;
  margin-bottom: 6px;
  color: var(--accent);
  font: 700 12px/1.3 var(--sans);
  letter-spacing: 0.14em;
}

.journal-note p { margin: 0; }

.journal-command {
  margin: 28px 0;
  padding: 15px 18px;
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: color-mix(in srgb, var(--page) 70%, var(--paper));
  color: var(--ink);
  font: 14px/1.6 Consolas, "Cascadia Mono", monospace;
  white-space: pre-wrap;
}

.figure-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 18px;
  margin: clamp(30px, 6vw, 52px) 0;
}

.journal-figure {
  margin: 0;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: color-mix(in srgb, var(--paper) 82%, var(--page));
}

.journal-figure a { display: block; }

.journal-figure img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 680px;
  object-fit: contain;
  border-radius: 5px;
  background: var(--media-matte);
}

.journal-figure figcaption {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 4px 2px;
  color: var(--muted);
  font: 12px/1.5 var(--sans);
}

.journal-figure figcaption span:last-child {
  color: var(--faint);
  white-space: nowrap;
}

.entry-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: clamp(42px, 8vw, 80px);
  padding-top: 26px;
  border-top: 1px solid var(--line);
  font-family: var(--sans);
}

.entry-nav a {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 82px;
  padding: 15px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  text-decoration: none;
}

.entry-nav a:last-child { text-align: right; }
.entry-nav a:hover, .entry-nav a:focus-visible { border-color: var(--accent); outline: none; }
.entry-nav small { color: var(--faint); font-size: 12px; letter-spacing: 0.08em; }
.entry-nav strong { color: var(--accent); font-size: 14px; }

.archive-shell { padding: clamp(28px, 6vw, 68px); }

.archive-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 30px;
  align-items: end;
  padding-bottom: 36px;
  border-bottom: 1px solid var(--line);
}

.archive-header h1 { max-width: 680px; }

.archive-count {
  color: var(--accent);
  font: 500 clamp(48px, 9vw, 82px)/0.85 var(--serif);
  text-align: right;
}

.archive-count span {
  display: block;
  margin-top: 10px;
  color: var(--muted);
  font: 600 12px/1.3 var(--sans);
  letter-spacing: 0.14em;
}

.archive-intro {
  max-width: 680px;
  margin: 24px 0 0;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.8;
}

.privacy-note {
  margin: 24px 0 0;
  padding: 13px 15px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
  background: var(--note);
  font: 13px/1.65 var(--sans);
}

.year-group { margin-top: 48px; }
.archive-shell > .year-group:first-of-type { margin-top: 0; }

.year-heading {
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 0 0 18px;
  color: var(--accent);
  font-size: 24px;
  font-weight: 500;
}

.year-heading::after { content: ""; flex: 1; height: 1px; background: var(--line); }

.archive-list { display: grid; gap: 10px; }

.archive-card {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
  min-height: 112px;
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 10px;
  text-decoration: none;
  transition: transform 160ms cubic-bezier(0.2, 0, 0.38, 0.9), border-color 160ms ease;
}

.archive-card:hover, .archive-card:focus-visible {
  transform: translateY(-2px);
  border-color: var(--accent);
  outline: none;
}

.card-date { color: var(--accent); font-size: 18px; }
.card-copy { min-width: 0; }
.card-location { margin: 0; font: 600 14px/1.5 var(--sans); }
.card-excerpt { margin: 7px 0 0; color: var(--muted); font-size: 14px; line-height: 1.55; }
.card-meta { color: var(--faint); font: 12px/1.5 var(--sans); text-align: right; white-space: nowrap; }

@media (max-width: 680px) {
  .site-bar { flex-wrap: wrap; gap: 8px 12px; padding-inline: 14px; }
  .journal-controls { margin-left: auto; }
  .language-switcher button { min-width: 44px; padding-inline: 7px; }
  .reading-shell, .archive-shell { width: min(calc(100% - 16px), 920px); border-radius: 12px; }
  .journal-article, .archive-shell { padding: 24px 20px 32px; }
  .journal-body { font-size: 15px; line-height: 1.8; }
  .archive-header { grid-template-columns: 1fr; }
  .archive-count { text-align: left; }
  .archive-card { grid-template-columns: 1fr auto; gap: 10px 14px; }
  .card-copy { grid-column: 1 / -1; grid-row: 2; }
  .entry-nav { grid-template-columns: 1fr; }
  .entry-nav a:last-child { text-align: left; }
}

@media print {
  .site-bar, .entry-nav { display: none; }
  body { background: #fff; color: #111; }
  .reading-shell { width: auto; margin: 0; border: 0; box-shadow: none; }
  .journal-article { padding: 0; }
  .journal-figure { break-inside: avoid; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition-duration: 0.01ms !important; }
}
"""


LEGACY_JOURNAL_JS = r"""(() => {
  const root = document.documentElement;
  const button = document.querySelector("[data-theme-toggle]");
  const modeKey = "mmv-mode";
  const languageKey = "mmv-language";
  const copies = {
    zh: {
      archive: "返回 Journal",
      backHome: "返回 Mon Mode de Vie",
      location: "定位",
      previousEntry: "上一篇",
      nextEntry: "下一篇",
      light: "浅色",
      dark: "深色",
      toLight: "切换为浅色模式",
      toDark: "切换为深色模式",
    },
    en: {
      archive: "Back to the Journal",
      backHome: "Back to Mon Mode de Vie",
      location: "Place",
      previousEntry: "Previous entry",
      nextEntry: "Next entry",
      light: "Light",
      dark: "Dark",
      toLight: "Switch to light mode",
      toDark: "Switch to dark mode",
    },
    fr: {
      archive: "Retour au journal",
      backHome: "Retour à Mon Mode de Vie",
      location: "Lieu",
      previousEntry: "Entrée précédente",
      nextEntry: "Entrée suivante",
      light: "Clair",
      dark: "Sombre",
      toLight: "Passer au mode clair",
      toDark: "Passer au mode sombre",
    },
    de: {
      archive: "Zurück zum Tagebuch",
      backHome: "Zurück zu Mon Mode de Vie",
      location: "Ort",
      previousEntry: "Vorheriger Eintrag",
      nextEntry: "Nächster Eintrag",
      light: "Hell",
      dark: "Dunkel",
      toLight: "Zum hellen Modus wechseln",
      toDark: "Zum dunklen Modus wechseln",
    },
  };

  const language = (() => {
    try {
      const stored = localStorage.getItem(languageKey);
      if (stored && copies[stored]) return stored;
    } catch (_) {}
    return "zh";
  })();
  const copy = copies[language];
  root.lang = language === "zh" ? "zh-CN" : language;

  document.querySelectorAll("[data-journal-copy]").forEach((node) => {
    const translated = copy[node.dataset.journalCopy];
    if (translated) node.textContent = translated;
  });

  const preferredMode = () => {
    try {
      const stored = localStorage.getItem(modeKey);
      if (stored === "light" || stored === "dark") return stored;
    } catch (_) {}
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const applyMode = (mode) => {
    root.dataset.mode = mode;
    if (button) {
      const isDark = mode === "dark";
      button.textContent = isDark ? copy.light : copy.dark;
      button.setAttribute("aria-pressed", String(isDark));
      button.setAttribute("aria-label", isDark ? copy.toLight : copy.toDark);
    }
  };

  applyMode(preferredMode());

  if (button) {
    button.addEventListener("click", () => {
      const next = root.dataset.mode === "dark" ? "light" : "dark";
      try { localStorage.setItem(modeKey, next); } catch (_) {}
      applyMode(next);
    });
  }
})();
"""


JOURNAL_JS = r"""(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector("[data-theme-toggle]");
  const storageKeys = {
    mode: "mmv-mode",
    theme: "mmv-theme",
    language: "mmv-language",
  };
  const localeNames = {
    zh: "中文",
    en: "English",
    fr: "Français",
    de: "Deutsch",
  };
  const dateLocales = {
    zh: "zh-CN",
    en: "en-GB",
    fr: "fr-FR",
    de: "de-DE",
  };
  const copies = {
    zh: {
      archive: "返回 Journal",
      backHome: "返回 Mon Mode de Vie",
      location: "定位",
      previousEntry: "上一篇",
      nextEntry: "下一篇",
      light: "浅色",
      dark: "深色",
      toLight: "切换为浅色模式",
      toDark: "切换为深色模式",
      language: "正文语言",
      journalNavigation: "日记导航",
      siteNavigation: "站点导航",
      adjacentEntries: "相邻日志",
      note: "笔记",
      sourceNote: "原书注",
      sourceBook: "《朝花夕拾小故事（乙巳年第壹册）》",
      sourceChapter: "第 3 章 · 永生难忘的日记",
      textOnly: "纯文字",
      images: (count) => `${count} 幅图片`,
    },
    en: {
      archive: "Back to Journal",
      backHome: "Back to Mon Mode de Vie",
      location: "Place",
      previousEntry: "Previous entry",
      nextEntry: "Next entry",
      light: "Light",
      dark: "Dark",
      toLight: "Switch to light mode",
      toDark: "Switch to dark mode",
      language: "Entry language",
      journalNavigation: "Journal navigation",
      siteNavigation: "Site navigation",
      adjacentEntries: "Adjacent journal entries",
      note: "Note",
      sourceNote: "Original note",
      sourceBook: "Morning Blossoms Gathered at Dusk: Little Stories (Yisi Year, Book I)",
      sourceChapter: "Chapter 3 · Unforgettable Journals",
      textOnly: "Text only",
      images: (count) => `${count} image${count === 1 ? "" : "s"}`,
    },
    fr: {
      archive: "Retour au journal",
      backHome: "Retour à Mon Mode de Vie",
      location: "Lieu",
      previousEntry: "Entrée précédente",
      nextEntry: "Entrée suivante",
      light: "Clair",
      dark: "Sombre",
      toLight: "Passer au mode clair",
      toDark: "Passer au mode sombre",
      language: "Langue du journal",
      journalNavigation: "Navigation du journal",
      siteNavigation: "Navigation du site",
      adjacentEntries: "Entrées voisines",
      note: "Note",
      sourceNote: "Note du texte original",
      sourceBook: "Petites histoires de Fleurs du matin cueillies au soir (année Yisi, livre I)",
      sourceChapter: "Chapitre 3 · Journaux inoubliables",
      textOnly: "Texte seul",
      images: (count) => `${count} image${count === 1 ? "" : "s"}`,
    },
    de: {
      archive: "Zurück zum Journal",
      backHome: "Zurück zu Mon Mode de Vie",
      location: "Ort",
      previousEntry: "Vorheriger Eintrag",
      nextEntry: "Nächster Eintrag",
      light: "Hell",
      dark: "Dunkel",
      toLight: "Zum hellen Modus wechseln",
      toDark: "Zum dunklen Modus wechseln",
      language: "Tagebuchsprache",
      journalNavigation: "Tagebuchnavigation",
      siteNavigation: "Seitennavigation",
      adjacentEntries: "Benachbarte Einträge",
      note: "Notiz",
      sourceNote: "Anmerkung im Original",
      sourceBook: "Kleine Geschichten aus Am Abend gesammelte Morgenblüten (Yisi-Jahr, Band I)",
      sourceChapter: "Kapitel 3 · Unvergessliche Tagebücher",
      textOnly: "Nur Text",
      images: (count) => `${count} Bild${count === 1 ? "" : "er"}`,
    },
  };

  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_) {}
  }

  function readJsonScript(id) {
    const node = document.getElementById(id);
    if (!node) return null;
    try {
      return JSON.parse(node.textContent || "null");
    } catch (_) {
      return null;
    }
  }

  const themeData = window.MMV_JOURNAL_THEME_DATA;
  const themes = (() => {
    if (!themeData || !Array.isArray(themeData.keys) || !Array.isArray(themeData.rows)) return {};
    return Object.fromEntries(
      themeData.rows.map(([id, preview, light, dark]) => [
        id,
        {
          id,
          preview,
          light: Object.fromEntries(themeData.keys.map((key, index) => [key, light[index]])),
          dark: Object.fromEntries(themeData.keys.map((key, index) => [key, dark[index]])),
        },
      ]),
    );
  })();

  const storedLanguage = readStorage(storageKeys.language);
  const storedMode = readStorage(storageKeys.mode);
  const storedTheme = readStorage(storageKeys.theme);
  const state = {
    language: copies[storedLanguage] ? storedLanguage : "zh",
    mode: storedMode === "light" || storedMode === "dark"
      ? storedMode
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    theme: themes[storedTheme] ? storedTheme : "neko",
  };
  const articleI18n = readJsonScript("journalI18n");
  const archiveI18n = readJsonScript("journalArchiveI18n");

  function hsl(value) {
    return `hsl(${value})`;
  }

  function updateThemeButton() {
    if (!themeButton) return;
    const copy = copies[state.language];
    const isDark = state.mode === "dark";
    themeButton.textContent = isDark ? copy.light : copy.dark;
    themeButton.setAttribute("aria-pressed", String(isDark));
    themeButton.setAttribute("aria-label", isDark ? copy.toLight : copy.toDark);
  }

  function applyTheme() {
    const theme = themes[state.theme] || themes.neko;
    if (theme) {
      state.theme = theme.id;
      const variant = theme[state.mode];
      const journalTokens = {
        page: variant.background,
        paper: variant.card,
        ink: variant["card-foreground"],
        muted: variant["muted-foreground"],
        faint: variant["muted-foreground"],
        line: variant.border,
        accent: variant["accent-foreground"],
        "accent-soft": variant.accent,
        note: variant.secondary,
        "media-matte": variant.background,
      };
      Object.entries(journalTokens).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, hsl(value));
      });
      root.style.setProperty(
        "--shadow",
        state.mode === "dark"
          ? `0 24px 72px hsl(${variant.background} / 0.42)`
          : `0 20px 60px hsl(${variant.foreground} / 0.10)`,
      );
    }
    root.dataset.theme = state.theme;
    root.dataset.mode = state.mode;
    root.style.colorScheme = state.mode;
    updateThemeButton();
  }

  function parseDate(isoDate) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || "");
    if (!match) return null;
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  }

  function formatDate(isoDate) {
    const parsed = parseDate(isoDate);
    if (!parsed) return isoDate;
    return new Intl.DateTimeFormat(dateLocales[state.language], {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(parsed);
  }

  function localizedValue(primary, fallback) {
    if (typeof primary === "string" && primary.length) return { value: primary, fallback: false };
    return { value: typeof fallback === "string" ? fallback : "", fallback: true };
  }

  function setLocalizedText(node, primary, fallback) {
    if (!node) return;
    const selected = localizedValue(primary, fallback);
    node.textContent = selected.value;
    if (state.language !== "zh" && selected.fallback) node.lang = "zh-CN";
    else node.removeAttribute("lang");
  }

  function applyStaticCopy() {
    const copy = copies[state.language];
    document.querySelectorAll("[data-journal-copy]").forEach((node) => {
      const translated = copy[node.dataset.journalCopy];
      if (typeof translated === "string") node.textContent = translated;
    });
    document.querySelectorAll("[data-journal-copy-aria-label]").forEach((node) => {
      const translated = copy[node.dataset.journalCopyAriaLabel];
      if (typeof translated === "string") node.setAttribute("aria-label", translated);
    });
  }

  function applyDates() {
    document.querySelectorAll("[data-journal-date]").forEach((node) => {
      const isoDate = node.getAttribute("datetime");
      if (isoDate) node.textContent = formatDate(isoDate);
    });
  }

  function applyArticleLanguage() {
    if (!articleI18n || !articleI18n.locales) return;
    const original = articleI18n.locales.zh || {};
    const selected = articleI18n.locales[state.language] || original;

    setLocalizedText(
      document.querySelector("[data-journal-location]"),
      selected.location,
      original.location,
    );
    setLocalizedText(
      document.querySelector("[data-journal-source-label]"),
      selected.sourceLabel,
      original.sourceLabel,
    );

    document.querySelectorAll("[data-journal-block-index]").forEach((container) => {
      const index = Number(container.dataset.journalBlockIndex);
      const target = container.matches("p")
        ? container
        : container.querySelector(container.matches("pre") ? "code" : "p");
      setLocalizedText(target, selected.blocks?.[index], original.blocks?.[index]);
    });

    document.querySelectorAll("[data-journal-image-caption]").forEach((node) => {
      const index = Number(node.dataset.journalImageCaption);
      setLocalizedText(node, selected.imageCaptions?.[index], original.imageCaptions?.[index]);
    });
    document.querySelectorAll("[data-journal-image-alt]").forEach((image) => {
      const index = Number(image.dataset.journalImageAlt);
      const caption = localizedValue(selected.imageCaptions?.[index], original.imageCaptions?.[index]);
      image.alt = caption.value;
    });
    document.querySelectorAll("[data-journal-image-source]").forEach((node) => {
      const index = Number(node.dataset.journalImageSource);
      setLocalizedText(node, selected.imageSources?.[index], original.imageSources?.[index]);
    });

    const firstParagraphIndex = Array.from(document.querySelectorAll("[data-journal-block-index]"))
      .findIndex((node) => node.matches("p"));
    const description = localizedValue(
      selected.blocks?.[firstParagraphIndex],
      original.blocks?.[firstParagraphIndex],
    ).value;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) metaDescription.content = description.slice(0, 160);
    document.title = `${formatDate(articleI18n.date)} · Journal · Mon Mode de Vie`;
  }

  function applyArchiveLanguage() {
    if (!archiveI18n || !Array.isArray(archiveI18n.entries)) return;
    const byDate = new Map(archiveI18n.entries.map((entry) => [entry.date, entry]));
    const copy = copies[state.language];
    document.querySelectorAll("[data-journal-entry-date]").forEach((card) => {
      const entry = byDate.get(card.dataset.journalEntryDate);
      if (!entry?.locales) return;
      const original = entry.locales.zh || {};
      const selected = entry.locales[state.language] || original;
      setLocalizedText(card.querySelector("[data-entry-location]"), selected.location, original.location);
      setLocalizedText(card.querySelector("[data-entry-excerpt]"), selected.excerpt, original.excerpt);
      setLocalizedText(
        card.querySelector("[data-entry-source-label]"),
        selected.sourceLabel,
        original.sourceLabel,
      );
      const countNode = card.querySelector("[data-entry-image-count]");
      const count = Number(countNode?.dataset.entryImageCount || 0);
      if (countNode) countNode.textContent = count ? copy.images(count) : copy.textOnly;
    });
  }

  function updateLanguageControls() {
    document.querySelectorAll("[data-language-choice]").forEach((button) => {
      const isSelected = button.dataset.languageChoice === state.language;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
      button.setAttribute("aria-label", localeNames[button.dataset.languageChoice] || button.textContent);
      button.title = localeNames[button.dataset.languageChoice] || "";
    });
  }

  function applyLanguage() {
    root.lang = dateLocales[state.language];
    applyStaticCopy();
    applyDates();
    applyArticleLanguage();
    applyArchiveLanguage();
    updateLanguageControls();
    updateThemeButton();
  }

  document.querySelectorAll("[data-language-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const language = button.dataset.languageChoice;
      if (!copies[language] || language === state.language) return;
      state.language = language;
      writeStorage(storageKeys.language, language);
      applyLanguage();
    });
  });

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      state.mode = state.mode === "dark" ? "light" : "dark";
      writeStorage(storageKeys.mode, state.mode);
      applyTheme();
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === storageKeys.language && copies[event.newValue]) {
      state.language = event.newValue;
      applyLanguage();
    }
    if (event.key === storageKeys.mode && (event.newValue === "light" || event.newValue === "dark")) {
      state.mode = event.newValue;
      applyTheme();
    }
    if (event.key === storageKeys.theme && themes[event.newValue]) {
      state.theme = event.newValue;
      applyTheme();
    }
  });

  window.addEventListener("pageshow", () => {
    const language = readStorage(storageKeys.language);
    const mode = readStorage(storageKeys.mode);
    const theme = readStorage(storageKeys.theme);
    if (copies[language]) state.language = language;
    if (mode === "light" || mode === "dark") state.mode = mode;
    if (themes[theme]) state.theme = theme;
    applyTheme();
    applyLanguage();
  });

  applyTheme();
  applyLanguage();
})();
"""


def normalize_line(text: str) -> str:
    text = re.sub(r"\s+", " ", text.strip())
    return text


def should_skip_line(text: str) -> bool:
    return (
        not text
        or text == "永生难忘的日志"
        or text.startswith("第 3 章 永生难忘的日志")
        or text.startswith("截至2025-08-31零点")
        or text.startswith("截至 2025-08-31 零点")
        or bool(PAGE_NUMBER_RE.fullmatch(text))
        or bool(FIGURE_CAPTION_RE.match(text))
        or bool(FIGURE_LABEL_RE.match(text))
    )


def append_wrapped_text(existing: str, continuation: str) -> str:
    if not existing:
        return continuation
    separator = " " if existing[-1:].isascii() and existing[-1:].isalnum() and continuation[:1].isascii() and continuation[:1].isalnum() else ""
    return existing + separator + continuation


def clean_note_text(text: str) -> str:
    if text.startswith("笔记"):
        body = text[len("笔记") :].lstrip("：: ")
        body = body.replace("说明你很棒啊1！", "说明你很棒啊！")
        return body
    if text.startswith("1正文内容"):
        return text[1:]
    return text


def parse_journals(pdf_path: Path) -> list[Journal]:
    journals: list[Journal] = []
    current: Journal | None = None
    current_block: Block | None = None
    pending_location_continuation = False
    next_line_is_note = False

    def flush_block() -> None:
        nonlocal current_block
        if current and current_block and current_block.text.strip():
            current.blocks.append(current_block)
        current_block = None

    with pdfplumber.open(pdf_path) as pdf:
        for page_number in range(14, 27):
            page = pdf.pages[page_number - 1]
            lines = page.extract_text_lines(layout=False, strip=True, return_chars=False)

            for item in lines:
                text = normalize_line(item["text"])
                x0 = float(item["x0"])

                if should_skip_line(text):
                    continue

                date_match = DATE_LINE_RE.match(text)
                if date_match:
                    flush_block()
                    iso_date = f"{date_match.group('year')}-{date_match.group('month')}-{date_match.group('day')}"
                    current = Journal(
                        iso_date=iso_date,
                        location=date_match.group("location").strip(),
                        source_pages={page_number},
                    )
                    journals.append(current)
                    pending_location_continuation = iso_date == "2025-03-28"
                    next_line_is_note = False
                    continue

                if current is None:
                    continue

                if pending_location_continuation:
                    current.location = f"{current.location} {text}".strip()
                    current.source_pages.add(page_number)
                    pending_location_continuation = False
                    continue

                current.source_pages.add(page_number)

                if text == "(cid:127)":
                    flush_block()
                    next_line_is_note = True
                    continue

                if text.startswith("rmdir /S /Q"):
                    flush_block()
                    current.blocks.append(Block("code", text))
                    next_line_is_note = False
                    continue

                if next_line_is_note or text.startswith("笔记"):
                    flush_block()
                    current_block = Block("note", clean_note_text(text))
                    next_line_is_note = False
                    continue

                if text.startswith("1正文内容"):
                    flush_block()
                    current_block = Block("source-note", clean_note_text(text))
                    continue

                starts_new_paragraph = x0 >= 69.0
                if starts_new_paragraph:
                    flush_block()
                    current_block = Block("paragraph", text)
                elif current_block is None:
                    current_block = Block("paragraph", text)
                else:
                    current_block.text = append_wrapped_text(current_block.text, text)

    flush_block()

    found_dates = [entry.iso_date for entry in journals]
    if found_dates != EXPECTED_DATES:
        raise RuntimeError(
            "Journal date audit failed.\n"
            f"Expected: {EXPECTED_DATES}\n"
            f"Found:    {found_dates}"
        )

    for entry in journals:
        entry.images = [
            ImageSpec(
                spec.page,
                spec.index,
                spec.caption,
                spec.position,
                spec.before_prefix,
            )
            for spec in IMAGE_ASSIGNMENTS.get(entry.iso_date, [])
        ]

    return journals


def load_authored_journals(data_dir: Path) -> list[Journal]:
    """Load hand-authored site journals that must survive future PDF rebuilds."""
    if not data_dir.is_dir():
        return []

    journals: list[Journal] = []
    for source_path in sorted(data_dir.glob("authored-*.json")):
        payload = json.loads(source_path.read_text(encoding="utf-8"))
        iso_date = str(payload["date"])
        date.fromisoformat(iso_date)

        blocks = [
            Block(kind=block["kind"], text=str(block["text"]))
            for block in payload.get("blocks", [])
        ]
        images = [
            ImageSpec(
                page=None,
                index=None,
                caption=str(image["caption"]),
                position=image.get("position", "after-body"),
                before_prefix=image.get("beforePrefix"),
                filename=str(image["file"]),
                source_label=image.get("sourceLabel"),
                asset_path=image.get("path"),
            )
            for image in payload.get("images", [])
        ]
        journals.append(
            Journal(
                iso_date=iso_date,
                location=str(payload.get("location", "Mon Mode de Vie")),
                blocks=blocks,
                images=images,
                source_kind="site-session",
                source_label=str(payload.get("sourceLabel", "站点会话整理")),
            )
        )
    return journals


def load_journal_translations(data_dir: Path, journals: list[Journal]) -> None:
    """Attach and validate the hand-reviewed English, French, and German sidecars."""
    i18n_dir = data_dir / "i18n"
    if not i18n_dir.is_dir():
        raise RuntimeError(f"Journal translation directory is missing: {i18n_dir}")

    by_date = {entry.iso_date: entry for entry in journals}
    seen_dates: set[str] = set()
    for source_path in sorted(i18n_dir.glob("*.json")):
        payload = json.loads(source_path.read_text(encoding="utf-8"))
        iso_date = str(payload.get("date", ""))
        if source_path.stem != iso_date:
            raise RuntimeError(f"Translation filename/date mismatch: {source_path.name}")
        entry = by_date.get(iso_date)
        if entry is None:
            raise RuntimeError(f"Translation has no matching journal: {source_path.name}")

        locales = payload.get("locales")
        if not isinstance(locales, dict):
            raise RuntimeError(f"Translation locales must be an object: {source_path.name}")
        missing_locales = [locale for locale in SUPPORTED_LOCALES if locale not in locales]
        if missing_locales:
            raise RuntimeError(
                f"Translation is missing {', '.join(missing_locales)}: {source_path.name}"
            )

        normalized: dict[str, dict[str, object]] = {}
        for locale in SUPPORTED_LOCALES:
            raw_locale = locales[locale]
            if not isinstance(raw_locale, dict):
                raise RuntimeError(f"{source_path.name} {locale} must be an object")
            location = str(raw_locale.get("location", "")).strip()
            blocks = raw_locale.get("blocks")
            image_captions = raw_locale.get("imageCaptions")
            if not location:
                raise RuntimeError(f"{source_path.name} {locale} location is empty")
            if not isinstance(blocks, list) or len(blocks) != len(entry.blocks):
                raise RuntimeError(
                    f"{source_path.name} {locale} has {len(blocks) if isinstance(blocks, list) else 'invalid'} "
                    f"blocks; expected {len(entry.blocks)}"
                )
            if not isinstance(image_captions, list) or len(image_captions) != len(entry.images):
                raise RuntimeError(
                    f"{source_path.name} {locale} has "
                    f"{len(image_captions) if isinstance(image_captions, list) else 'invalid'} captions; "
                    f"expected {len(entry.images)}"
                )
            if any(not isinstance(text, str) or not text.strip() for text in blocks):
                raise RuntimeError(f"{source_path.name} {locale} contains an empty body block")
            if any(not isinstance(text, str) or not text.strip() for text in image_captions):
                raise RuntimeError(f"{source_path.name} {locale} contains an empty image caption")
            for index, block in enumerate(entry.blocks):
                if block.kind == "code" and blocks[index] != block.text:
                    raise RuntimeError(
                        f"{source_path.name} {locale} changed code block {index + 1}"
                    )

            translated: dict[str, object] = {
                "location": location,
                "blocks": [str(text) for text in blocks],
                "imageCaptions": [str(text) for text in image_captions],
            }
            source_label = raw_locale.get("sourceLabel")
            if source_label is not None:
                translated["sourceLabel"] = str(source_label).strip()
            normalized[locale] = translated

        entry.translations = normalized
        seen_dates.add(iso_date)

    missing_dates = sorted(set(by_date) - seen_dates)
    if missing_dates:
        raise RuntimeError(
            "Journal translations are missing for: " + ", ".join(missing_dates)
        )


def extract_images(pdf_path: Path, output_dir: Path, journals: list[Journal]) -> None:
    reader = PdfReader(str(pdf_path))
    for entry in journals:
        if entry.source_kind != "pdf" or not entry.images:
            continue
        entry_image_dir = output_dir / "assets" / "images" / entry.iso_date
        entry_image_dir.mkdir(parents=True, exist_ok=True)
        for spec in entry.images:
            if spec.page is None or spec.index is None:
                raise RuntimeError(f"PDF image coordinates missing for {entry.iso_date}")
            page_images = list(reader.pages[spec.page - 1].images)
            if spec.index < 1 or spec.index > len(page_images):
                raise RuntimeError(
                    f"Image {spec.index} not found on PDF page {spec.page}; "
                    f"page has {len(page_images)} images"
                )
            source_image = page_images[spec.index - 1]
            suffix = Path(source_image.name).suffix.lower() or ".bin"
            filename = f"p{spec.page:02d}-image-{spec.index:02d}{suffix}"
            destination = entry_image_dir / filename
            destination.write_bytes(source_image.data)
            spec.filename = filename

            with Image.open(destination) as image:
                image.verify()


def display_date(iso_date: str) -> str:
    parsed = date.fromisoformat(iso_date)
    return f"{parsed.year} 年 {parsed.month} 月 {parsed.day} 日"


def compact_date(iso_date: str) -> str:
    parsed = date.fromisoformat(iso_date)
    return f"{parsed.month:02d} / {parsed.day:02d}"


def page_label(pages: set[int]) -> str:
    numbers = "、".join(str(number) for number in sorted(pages))
    return f"PDF 第 {numbers} 页"


def localized_page_label(pages: set[int], locale: str) -> str:
    numbers = " / ".join(str(number) for number in sorted(pages))
    singular = len(pages) == 1
    labels = {
        "en": f"PDF {'page' if singular else 'pages'} {numbers}",
        "fr": f"PDF · {'page' if singular else 'pages'} {numbers}",
        "de": f"PDF-{'Seite' if singular else 'Seiten'} {numbers}",
    }
    return labels.get(locale, page_label(pages))


def entry_source_label(entry: Journal) -> str:
    if entry.source_kind == "pdf":
        return page_label(entry.source_pages)
    return entry.source_label


def translated_source_label(entry: Journal, locale: str) -> str:
    if entry.source_kind == "pdf":
        return localized_page_label(entry.source_pages, locale)
    translated = entry.translations.get(locale, {}).get("sourceLabel")
    return str(translated or entry.source_label)


def translated_image_source(entry: Journal, spec: ImageSpec, locale: str) -> str:
    if spec.page is not None:
        labels = {
            "zh": f"PDF 第 {spec.page} 页",
            "en": f"PDF page {spec.page}",
            "fr": f"PDF · page {spec.page}",
            "de": f"PDF-Seite {spec.page}",
        }
        return labels.get(locale, labels["zh"])
    if locale == "zh":
        return spec.source_label or entry.source_label
    translated = entry.translations.get(locale, {}).get("sourceLabel")
    return str(translated or spec.source_label or entry.source_label)


def image_asset_path(entry: Journal, spec: ImageSpec) -> str:
    if spec.asset_path:
        return spec.asset_path
    if not spec.filename:
        raise RuntimeError(f"Image filename missing for {entry.iso_date}")
    return f"assets/images/{entry.iso_date}/{spec.filename}"


def first_excerpt(entry: Journal, limit: int = 94) -> str:
    first = next((block.text for block in entry.blocks if block.kind == "paragraph"), "")
    return first if len(first) <= limit else first[:limit].rstrip("，。；：、 ") + "……"


def excerpt_from_text(text: str, limit: int = 94) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    shortened = text[:limit].rstrip(" ,.;:!?—–-，。；：、 ")
    last_space = shortened.rfind(" ")
    if last_space >= int(limit * 0.65):
        shortened = shortened[:last_space].rstrip(" ,.;:!?—–-")
    return shortened + "…"


def translated_excerpt(entry: Journal, locale: str, limit: int = 94) -> str:
    translated_blocks = entry.translations.get(locale, {}).get("blocks", [])
    if not isinstance(translated_blocks, list):
        return first_excerpt(entry, limit)
    first_index = next(
        (index for index, block in enumerate(entry.blocks) if block.kind == "paragraph"),
        None,
    )
    if first_index is None or first_index >= len(translated_blocks):
        return first_excerpt(entry, limit)
    return excerpt_from_text(str(translated_blocks[first_index]), limit)


def journal_locale_payload(entry: Journal, locale: str) -> dict[str, object]:
    if locale == "zh":
        return {
            "location": entry.location,
            "blocks": [block.text for block in entry.blocks],
            "imageCaptions": [spec.caption for spec in entry.images],
            "imageSources": [translated_image_source(entry, spec, locale) for spec in entry.images],
            "sourceLabel": entry_source_label(entry),
        }
    translated = entry.translations[locale]
    return {
        "location": str(translated["location"]),
        "blocks": [str(text) for text in translated["blocks"]],
        "imageCaptions": [str(text) for text in translated["imageCaptions"]],
        "imageSources": [translated_image_source(entry, spec, locale) for spec in entry.images],
        "sourceLabel": translated_source_label(entry, locale),
    }


def journal_i18n_payload(entry: Journal) -> dict[str, object]:
    return {
        "date": entry.iso_date,
        "sourceKind": entry.source_kind,
        "sourcePages": sorted(entry.source_pages),
        "locales": {
            locale: journal_locale_payload(entry, locale)
            for locale in ("zh", *SUPPORTED_LOCALES)
        },
    }


def archive_i18n_payload(entry: Journal) -> dict[str, object]:
    locales: dict[str, dict[str, str]] = {
        "zh": {
            "location": entry.location,
            "excerpt": first_excerpt(entry),
            "sourceLabel": entry_source_label(entry),
        }
    }
    for locale in SUPPORTED_LOCALES:
        locales[locale] = {
            "location": str(entry.translations[locale]["location"]),
            "excerpt": translated_excerpt(entry, locale),
            "sourceLabel": translated_source_label(entry, locale),
        }
    return {"date": entry.iso_date, "locales": locales}


def safe_inline_json(payload: object) -> str:
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")


def render_figure_grid(entry: Journal, specs: list[ImageSpec]) -> str:
    if not specs:
        return ""
    figures: list[str] = []
    for spec in specs:
        if not spec.filename:
            raise RuntimeError(f"Image filename missing for {entry.iso_date}")
        rel_path = f"./{image_asset_path(entry, spec)}"
        image_source = (
            f"PDF 第 {spec.page} 页"
            if spec.page is not None
            else (spec.source_label or entry.source_label)
        )
        image_index = entry.images.index(spec)
        figures.append(
            "\n".join(
                [
                    '          <figure class="journal-figure">',
                    f'            <a href="{html.escape(rel_path)}" target="_blank" rel="noopener">',
                    f'              <img src="{html.escape(rel_path)}" alt="{html.escape(spec.caption)}" data-journal-image-alt="{image_index}" loading="lazy" decoding="async">',
                    "            </a>",
                    f'            <figcaption><span data-journal-image-caption="{image_index}">{html.escape(spec.caption)}</span><span data-journal-image-source="{image_index}">{html.escape(image_source)}</span></figcaption>',
                    "          </figure>",
                ]
            )
        )
    return '        <div class="figure-grid">\n' + "\n".join(figures) + "\n        </div>"


def render_block(block: Block, index: int) -> str:
    escaped = html.escape(block.text)
    block_id = f"b{index + 1:02d}"
    if block.kind == "paragraph":
        return (
            f'        <p data-journal-block-id="{block_id}" '
            f'data-journal-block-index="{index}">{escaped}</p>'
        )
    if block.kind == "code":
        return (
            f'        <pre class="journal-command" data-journal-block-id="{block_id}" '
            f'data-journal-block-index="{index}"><code>{escaped}</code></pre>'
        )
    label = "原书注" if block.kind == "source-note" else "笔记"
    label_key = "sourceNote" if block.kind == "source-note" else "note"
    return (
        f'        <aside class="journal-note" data-journal-block-id="{block_id}" data-journal-block-index="{index}">\n'
        f'          <span class="journal-note-label" data-journal-copy="{label_key}">{label}</span>\n'
        f"          <p>{escaped}</p>\n"
        "        </aside>"
    )


def render_body(entry: Journal) -> str:
    before_body = [spec for spec in entry.images if spec.position == "before-body"]
    after_body = [spec for spec in entry.images if spec.position == "after-body"]
    prefix_images = [spec for spec in entry.images if spec.position == "before-prefix"]
    output: list[str] = []

    if before_body:
        output.append(render_figure_grid(entry, before_body))

    inserted_prefix_images = False
    for block_index, block in enumerate(entry.blocks):
        if (
            prefix_images
            and not inserted_prefix_images
            and any(
                spec.before_prefix and block.text.startswith(spec.before_prefix)
                for spec in prefix_images
            )
        ):
            output.append(render_figure_grid(entry, prefix_images))
            inserted_prefix_images = True
        output.append(render_block(block, block_index))

    if prefix_images and not inserted_prefix_images:
        output.append(render_figure_grid(entry, prefix_images))
    if after_body:
        output.append(render_figure_grid(entry, after_body))
    return "\n".join(output)


def nav_link(entry: Journal, direction: str) -> str:
    label = "上一篇" if direction == "previous" else "下一篇"
    copy_key = "previousEntry" if direction == "previous" else "nextEntry"
    return (
        f'        <a href="./{entry.iso_date}.html">\n'
        f'          <small data-journal-copy="{copy_key}">{label}</small>\n'
        f'          <strong><time datetime="{entry.iso_date}" data-journal-date>{html.escape(display_date(entry.iso_date))}</time></strong>\n'
        "        </a>"
    )


def render_article(entry: Journal, previous: Journal | None, following: Journal | None) -> str:
    previous_html = nav_link(previous, "previous") if previous else "        <span aria-hidden=\"true\"></span>"
    following_html = nav_link(following, "next") if following else "        <span aria-hidden=\"true\"></span>"
    if entry.source_kind == "pdf":
        source_meta = "\n".join(
            [
                f'          <span class="source-pill" data-journal-copy="sourceBook">《{html.escape(SOURCE_TITLE)}》</span>',
                '          <span class="source-pill" data-journal-copy="sourceChapter">第 3 章 永生难忘的日志</span>',
                f'          <span class="source-pill" data-journal-source-label>{html.escape(entry_source_label(entry))}</span>',
            ]
        )
    else:
        source_meta = "\n".join(
            [
                '          <span class="source-pill">Mon Mode de Vie</span>',
                f'          <span class="source-pill" data-journal-source-label>{html.escape(entry.source_label)}</span>',
            ]
        )
    i18n_json = safe_inline_json(journal_i18n_payload(entry))
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <style>html{{background:#ece9e1}}body{{margin:0;visibility:hidden}}</style>
  <script>location.replace("../index.html#journal/{entry.iso_date}")</script>
  <meta name="description" content="{html.escape(first_excerpt(entry, 130))}">
  <title>{html.escape(display_date(entry.iso_date))} · Journal · Mon Mode de Vie</title>
  <link rel="stylesheet" href="./assets/journal.css?v={JOURNAL_ASSET_VERSION}">
  <script src="./assets/journal-themes.js?v={JOURNAL_ASSET_VERSION}"></script>
  <script src="./assets/journal.js?v={JOURNAL_ASSET_VERSION}" defer></script>
</head>
<body>
  <nav class="site-bar" aria-label="日志导航" data-journal-copy-aria-label="journalNavigation">
    <a href="../index.html#journal" data-journal-copy="archive">返回 Journal</a>
    <div class="journal-controls">
      <div class="language-switcher" role="group" aria-label="正文语言" data-journal-copy-aria-label="language">
        <button type="button" data-language-choice="zh" lang="zh-CN" aria-pressed="true">中</button>
        <button type="button" data-language-choice="en" lang="en" aria-pressed="false">EN</button>
        <button type="button" data-language-choice="fr" lang="fr" aria-pressed="false">FR</button>
        <button type="button" data-language-choice="de" lang="de" aria-pressed="false">DE</button>
      </div>
      <button class="theme-toggle" type="button" data-theme-toggle aria-pressed="false">深色</button>
    </div>
  </nav>
  <main class="reading-shell">
    <article class="journal-article">
      <header class="journal-header">
        <p class="kicker">Journal · {entry.iso_date}</p>
        <h1><time datetime="{entry.iso_date}" data-journal-date>{html.escape(display_date(entry.iso_date))}</time></h1>
        <p class="location"><span class="location-label" data-journal-copy="location">定位</span><span data-journal-location>{html.escape(entry.location)}</span></p>
        <div class="source-meta">
{source_meta}
        </div>
      </header>
      <div class="journal-body">
{render_body(entry)}
      </div>
      <nav class="entry-nav" aria-label="相邻日志" data-journal-copy-aria-label="adjacentEntries">
{previous_html}
{following_html}
      </nav>
    </article>
  </main>
  <script id="journalI18n" type="application/json">{i18n_json}</script>
  <!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{{"token": "81b2a38d3fcc41db9b366d13662c628f"}}'></script><!-- End Cloudflare Web Analytics -->
</body>
</html>
"""


def render_archive(journals: list[Journal]) -> str:
    groups: dict[str, list[Journal]] = {}
    for entry in journals:
        groups.setdefault(entry.iso_date[:4], []).append(entry)

    group_html: list[str] = []
    for year in sorted(groups, reverse=True):
        entries = sorted(groups[year], key=lambda item: item.iso_date, reverse=True)
        cards: list[str] = []
        for entry in entries:
            image_meta = f"{len(entry.images)} 幅图片" if entry.images else "纯文字"
            cards.append(
                f"""        <a class="archive-card" href="./{entry.iso_date}.html" data-journal-entry-date="{entry.iso_date}">
          <time class="card-date" datetime="{entry.iso_date}">{compact_date(entry.iso_date)}</time>
          <div class="card-copy">
            <p class="card-location" data-entry-location>{html.escape(entry.location)}</p>
            <p class="card-excerpt" data-entry-excerpt>{html.escape(first_excerpt(entry))}</p>
          </div>
          <span class="card-meta"><span data-entry-image-count="{len(entry.images)}">{image_meta}</span><br><span data-entry-source-label>{html.escape(entry_source_label(entry))}</span></span>
        </a>"""
            )
        group_html.append(
            f"""    <section class="year-group" aria-labelledby="year-{year}">
      <h2 class="year-heading" id="year-{year}">{year}</h2>
      <div class="archive-list">
{chr(10).join(cards)}
      </div>
    </section>"""
        )

    archive_i18n_json = safe_inline_json(
        {"entries": [archive_i18n_payload(entry) for entry in journals]}
    )
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <style>body{{visibility:hidden}}</style><script>location.replace("../index.html#journal")</script>
  <meta name="description" content="Mon Mode de Vie 的 {len(journals)} 条日期日志。">
  <title>Journal Archive · Mon Mode de Vie</title>
  <link rel="stylesheet" href="./assets/journal.css?v={JOURNAL_ASSET_VERSION}">
  <script src="./assets/journal-themes.js?v={JOURNAL_ASSET_VERSION}"></script>
  <script src="./assets/journal.js?v={JOURNAL_ASSET_VERSION}" defer></script>
</head>
<body>
  <nav class="site-bar" aria-label="站点导航" data-journal-copy-aria-label="siteNavigation">
    <a href="../index.html#journal" data-journal-copy="backHome">返回 Mon Mode de Vie</a>
    <div class="journal-controls">
      <div class="language-switcher" role="group" aria-label="正文语言" data-journal-copy-aria-label="language">
        <button type="button" data-language-choice="zh" lang="zh-CN" aria-pressed="true">中</button>
        <button type="button" data-language-choice="en" lang="en" aria-pressed="false">EN</button>
        <button type="button" data-language-choice="fr" lang="fr" aria-pressed="false">FR</button>
        <button type="button" data-language-choice="de" lang="de" aria-pressed="false">DE</button>
      </div>
      <button class="theme-toggle" type="button" data-theme-toggle aria-pressed="false">深色</button>
    </div>
  </nav>
  <main class="archive-shell">
    <h1 class="sr-only">Journal</h1>
{chr(10).join(group_html)}
  </main>
  <script id="journalArchiveI18n" type="application/json">{archive_i18n_json}</script>
  <!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{{"token": "81b2a38d3fcc41db9b366d13662c628f"}}'></script><!-- End Cloudflare Web Analytics -->
</body>
</html>
"""


def manifest_image(entry: Journal, spec: ImageSpec) -> dict[str, object]:
    image: dict[str, object] = {
        "file": image_asset_path(entry, spec),
        "caption": spec.caption,
    }
    if spec.page is not None:
        image["sourcePage"] = spec.page
    else:
        image["sourceLabel"] = spec.source_label or entry.source_label
    return image


def manifest_locales(entry: Journal) -> dict[str, dict[str, object]]:
    return {
        locale: {
            "location": str(entry.translations[locale]["location"]),
            "excerpt": translated_excerpt(entry, locale),
            "sourceLabel": translated_source_label(entry, locale),
            "imageCaptions": [
                str(caption) for caption in entry.translations[locale]["imageCaptions"]
            ],
        }
        for locale in SUPPORTED_LOCALES
    }


def render_journal_theme_runtime(theme_source: Path) -> str:
    """Generate the Journal palette from the root theme registry without duplicating values."""
    source = theme_source.read_text(encoding="utf-8")
    match = THEME_SOURCE_RE.search(source)
    if not match:
        raise RuntimeError(f"Theme registry not found in {theme_source}")
    keys = match.group("keys").strip()
    rows = match.group("rows").strip()
    return f'''(() => {{
  "use strict";

  const THEME_KEYS = {keys};
  const THEME_ROWS = {rows};

  THEME_ROWS.forEach((row) => {{
    if (Array.isArray(row[1].ambient)) Object.freeze(row[1].ambient);
    Object.freeze(row[1]);
    Object.freeze(row[2]);
    Object.freeze(row[3]);
    Object.freeze(row);
  }});

  Object.freeze(THEME_KEYS);
  Object.freeze(THEME_ROWS);

  window.MMV_JOURNAL_THEME_DATA = Object.freeze({{
    keys: THEME_KEYS,
    rows: THEME_ROWS,
  }});
}})();
'''


def write_output(output_dir: Path, journals: list[Journal], theme_source: Path) -> None:
    from collapse_journal_shells import collapse
    assets_dir = output_dir / "assets"
    data_dir = output_dir / "data"
    assets_dir.mkdir(parents=True, exist_ok=True)
    data_dir.mkdir(parents=True, exist_ok=True)

    (assets_dir / "journal.css").write_text(JOURNAL_CSS, encoding="utf-8", newline="\n")
    (assets_dir / "journal.js").write_text(JOURNAL_JS, encoding="utf-8", newline="\n")
    (assets_dir / "journal-themes.js").write_text(
        render_journal_theme_runtime(theme_source),
        encoding="utf-8",
        newline="\n",
    )

    for index, entry in enumerate(journals):
        previous = journals[index - 1] if index > 0 else None
        following = journals[index + 1] if index + 1 < len(journals) else None
        article_html = render_article(entry, previous, following)
        (output_dir / f"{entry.iso_date}.html").write_text(
            article_html,
            encoding="utf-8",
            newline="\n",
        )
        collapse(output_dir / f"{entry.iso_date}.html")

    (output_dir / "index.html").write_text(
        '''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="robots" content="noindex,nofollow,noarchive">
<link rel="canonical" href="../index.html#journal">
<title>Journal · Mon Mode de Vie</title>
<style>body{visibility:hidden}</style><script>location.replace("../index.html#journal")</script>
</head><body><!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "81b2a38d3fcc41db9b366d13662c628f"}'></script><!-- End Cloudflare Web Analytics --></body></html>
''',
        encoding="utf-8",
        newline="\n",
    )

    manifest = [
        {
            "date": entry.iso_date,
            "file": f"{entry.iso_date}.html",
            "location": entry.location,
            "sourcePages": sorted(entry.source_pages),
            "source": {
                "kind": entry.source_kind,
                "label": entry_source_label(entry),
            },
            "images": [manifest_image(entry, spec) for spec in entry.images],
            "excerpt": first_excerpt(entry),
            "locales": manifest_locales(entry),
            "privacyReview": "pending",
        }
        for entry in journals
    ]
    manifest_json = json.dumps(manifest, ensure_ascii=False, indent=2)
    (data_dir / "journals.json").write_text(
        manifest_json + "\n",
        encoding="utf-8",
        newline="\n",
    )
    (data_dir / "journals.js").write_text(
        "window.MMV_JOURNALS = " + manifest_json + ";\n",
        encoding="utf-8",
        newline="\n",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Build date-named Journal HTML files from chapter 3 of the PDF.")
    parser.add_argument("pdf", type=Path, help="Path to the source PDF")
    parser.add_argument("output", type=Path, help="Output directory for generated journals")
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "journals" / "data",
        help="Directory containing authored journals and i18n sidecars",
    )
    parser.add_argument(
        "--theme-source",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "script.js",
        help="Root script containing THEME_KEYS and THEME_ROWS",
    )
    args = parser.parse_args()

    pdf_path = args.pdf.resolve()
    output_dir = args.output.resolve()
    source_data_dir = args.data_dir.resolve()
    theme_source = args.theme_source.resolve()
    if not pdf_path.is_file():
        raise FileNotFoundError(pdf_path)
    if not source_data_dir.is_dir():
        raise FileNotFoundError(source_data_dir)
    if not theme_source.is_file():
        raise FileNotFoundError(theme_source)

    pdf_journals = parse_journals(pdf_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    extract_images(pdf_path, output_dir, pdf_journals)
    authored_journals = load_authored_journals(source_data_dir)
    journals = sorted(
        [*pdf_journals, *authored_journals],
        key=lambda entry: entry.iso_date,
    )
    if len({entry.iso_date for entry in journals}) != len(journals):
        raise RuntimeError("Duplicate journal dates found after merging authored entries")
    load_journal_translations(source_data_dir, journals)
    write_output(output_dir, journals, theme_source)

    image_count = sum(len(entry.images) for entry in journals)
    print(
        json.dumps(
            {
                "journals": len(journals),
                "images": image_count,
                "firstDate": journals[0].iso_date,
                "lastDate": journals[-1].iso_date,
                "output": str(output_dir),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
