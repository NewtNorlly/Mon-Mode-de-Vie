# -*- coding: utf-8 -*-
"""Step2：给192个课程事件正文补“任课教师”。默认 dry-run，加 --apply 才真正 PATCH。

对齐键：(日期, 开始时分)。正文只在“课程：xxx<br>”后插入一行教师，其余原样保留；
若已存在教师行则先移除再插入，保证幂等可重复运行。
"""
import csv, re, sys, urllib.parse
from pathlib import Path
from outlook_client import OutlookClient

APPLY = "--apply" in sys.argv
DATA = Path(__file__).parent / "data" / "schedule_with_teacher.csv"

# 载入带教师课表，键 = (日期, 开始HH:MM)
table = {}
with DATA.open(encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        table[(r["日期"], r["开始"])] = r
print(f"课表记录: {len(table)}")

c = OutlookClient()
flt = "start/dateTime ge '2026-08-31T00:00:00' and categories/any(a:a eq '课程')"
q = urllib.parse.quote(flt, safe="'")
events = c.paged(f"/me/calendar/events?$filter={q}&$top=100&$orderby=start/dateTime")
print(f"Outlook 课程事件: {len(events)}")

TEACHER_LINE = re.compile(r"任课教师：[^<]*<br>\s*")
COURSE_LINE = re.compile(r"(课程：[^<\n]*?<br>\s*)")


def new_body(html: str, teacher: str) -> tuple[str, bool]:
    stripped = TEACHER_LINE.sub("", html)  # 先去旧教师行
    m = COURSE_LINE.search(stripped)
    if not m:
        return html, False
    insert = f"任课教师：{teacher}<br>\n"
    out = stripped[:m.end()] + insert + stripped[m.end():]
    return out, out != html


matched, changed, skipped, missing = 0, 0, 0, []
samples = []
for e in events:
    dt = (e.get("start") or {}).get("dateTime", "")
    key = (dt[:10], dt[11:16])
    row = table.get(key)
    if not row:
        missing.append((e.get("subject"), key))
        continue
    matched += 1
    if e.get("subject") != row["课程名称"]:
        print(f"  ! 课程名不一致 {key} 事件={e.get('subject')} 课表={row['课程名称']}")
    html = (e.get("body") or {}).get("content", "")
    out, did = new_body(html, row["任课教师"])
    if not did:
        skipped += 1
        continue
    changed += 1
    if len(samples) < 2:
        samples.append((e.get("subject"), key, row["任课教师"], out))
    if APPLY:
        c.patch(f"/me/events/{e['id']}", {"body": {"contentType": "html", "content": out}})

print(f"\n对齐成功: {matched}  需更新: {changed}  已含教师跳过: {skipped}  未对齐: {len(missing)}")
for x in missing[:20]:
    print("  未对齐:", x)
for subj, key, teacher, out in samples:
    print(f"\n--- 样例 {subj} {key} 教师={teacher} ---")
    print(out)
print("\n模式:", "APPLY 已写入" if APPLY else "DRY-RUN（加 --apply 执行）", "| 请求数:", c.request_count)
