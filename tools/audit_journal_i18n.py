# -*- coding: utf-8 -*-
"""Audit journal payloads for language-switch completeness.

Checks every journals/YYYY-MM-DD.html:
  1. every prose group (contiguous run of <section class="prose">) carries zh + en + fr + de;
  2. no en/fr/de section contains a Chinese *sentence* (person nicknames, quoted
     foreign-language examples and vocabulary-card glosses are allowed);
  3. PDF-source payloads keep locale block counts aligned and their en/fr/de blocks
     free of Chinese sentences.

Exit code 1 when a problem is found. Read-only; no files are modified.

Usage:  py -X utf8 tools/audit_journal_i18n.py
"""
import glob
import json
import os
import re
import sys

CJK = re.compile(r"[\u4e00-\u9fff]+")
BRACKET = re.compile(r"\[[^\]]{1,10}\]")
TS = re.compile(r"\d{4}年\d{1,2}月\d{1,2}日(?:\s*\d{1,2}:\d{2})?")
NICK = re.compile(r"^\s*([^\n:：]{1,24}?)\s*[:：]")

# Nicknames, product names, vocabulary glosses and quoted examples that legitimately
# stay in the original language inside translated sections.
ALLOW = set()
ALLOW_CARD = {"vocab-card"}

def sections(html):
    out = []
    for m in re.finditer(r"<section\b[^>]*class=\"[^\"]*\bprose\b[^\"]*\"[^>]*>(.*?)</section>", html, re.S):
        tag = m.group(0)[:m.group(0).find(">") + 1]
        lang = re.search(r'lang="([^"]*)"', tag)
        out.append(((lang.group(1) if lang else "").lower().split("-")[0], m.group(1), m.start(), m.end()))
    return out

def groups(secs):
    gs, cur = [], []
    for s in secs:
        if cur and s[0] in {x[0] for x in cur}:
            gs.append(cur)
            cur = []
        cur.append(s)
    if cur:
        gs.append(cur)
    return gs

def nicknames_of(text):
    """Collect nicknames from 'name :' and 'name 回复other :' lines."""
    names = set()
    for line in text.splitlines():
        m = NICK.match(line)
        if m:
            names.add(m.group(1).strip())
        for m2 in re.finditer(r"([\u4e00-\u9fff\w（）()·]{1,20})\s*回复\s*([\u4e00-\u9fff\w（）()·]{1,20})", line):
            names.add(m2.group(1).strip())
            names.add(m2.group(2).strip())
    for m3 in re.finditer(r"回复\s*([\u4e00-\u9fff\w（）()·]{1,20})", text):
        names.add(m3.group(1).strip())
    return {n for n in names if n}

def residual(text, names):
    t = BRACKET.sub(" ", text)
    t = TS.sub(" ", t)
    for n in sorted(names, key=len, reverse=True):
        if n:
            t = t.replace(n, " ")
    return [r for r in CJK.findall(t) if len(r) >= 8]

def check_payload(path):
    problems = []
    html = open(path, encoding="utf-8").read()
    date = os.path.basename(path)[:10]
    if 'id="journalI18n"' in html:
        m = re.search(r'<script id="journalI18n"[^>]*>(.*?)</script>', html, re.S)
        if not m:
            return [(date, "journalI18n script is empty")]
        data = json.loads(m.group(1))
        loc = data.get("locales", {})
        counts = {k: len(v.get("blocks") or []) for k, v in loc.items()}
        if len(set(counts.values())) > 1:
            problems.append((date, "locale block counts differ: %s" % counts))
        for lg, v in loc.items():
            if lg == "zh":
                continue
            for i, block in enumerate(v.get("blocks") or []):
                if residual(block, set()):
                    problems.append((date, "%s block %d still has Chinese text" % (lg, i)))
        return problems
    secs = sections(html)
    if not secs:
        return problems
    text_by_group = {}
    for gi, g in enumerate(groups(secs)):
        langs = [s[0] for s in g]
        if set(langs) != {"zh", "en", "fr", "de"}:
            problems.append((date, "group %d languages = %s" % (gi, langs)))
            continue
        zh_text = "\n".join(re.sub(r"<[^>]+>", " ", s[1]) for s in g if s[0] == "zh")
        names = nicknames_of(zh_text)
        for lg, inner, _, _ in g:
            if lg == "zh":
                continue
            if 'class="vocab-card"' in inner:
                continue
            text = re.sub(r"<[^>]+>", " ", inner)
            left = residual(text, names)
            if left:
                problems.append((date, "group %d %s keeps Chinese: %s" % (gi, lg, "、".join(left[:6]))))
    return problems

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    files = [p for p in sorted(glob.glob(os.path.join(root, "journals", "data", "payloads", "*.html")))
             if os.path.basename(p) != "index.html"]
    problems = []
    for p in files:
        problems.extend(check_payload(p))
    print("checked payloads: %d" % len(files))
    if problems:
        for date, msg in problems:
            print("  [%s] %s" % (date, msg))
        print("PROBLEMS: %d" % len(problems))
        return 1
    print("OK: every payload has zh/en/fr/de and no untranslated sentence.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
