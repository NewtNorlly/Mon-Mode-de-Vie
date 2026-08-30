# -*- coding: utf-8 -*-
"""Step4：全量回读 Outlook（8/31~次年1/2），校验课程教师、作息分类、跨天睡眠、重复。只读。"""
import urllib.parse
from collections import Counter
from outlook_client import OutlookClient

c = OutlookClient()
flt = "start/dateTime ge '2026-08-31T00:00:00' and start/dateTime lt '2027-01-02T00:00:00'"
q = urllib.parse.quote(flt, safe="'")
evs = c.paged(f"/me/calendar/events?$filter={q}&$top=100")
print("区间事件总数:", len(evs))

cat = Counter()
for e in evs:
    cs = e.get("categories") or ["(无类别)"]
    for x in cs:
        cat[x] += 1
print("分类分布:", dict(cat))

# 课程：正文含教师
courses = [e for e in evs if "课程" in (e.get("categories") or [])]
with_teacher = [e for e in courses if "任课教师" in ((e.get("body") or {}).get("content", ""))]
print(f"\n课程事件: {len(courses)}，正文含教师: {len(with_teacher)}，缺教师: {len(courses)-len(with_teacher)}")
for e in courses:
    if "任课教师" not in ((e.get("body") or {}).get("content", "")):
        print("  缺教师:", e.get("subject"), (e.get("start") or {}).get("dateTime"))

# 作息分类计数与跨天睡眠
def in_cat(name):
    return [e for e in evs if name in (e.get("categories") or [])]
for name in ["睡眠", "三餐", "午睡", "放风"]:
    xs = in_cat(name)
    cross = [e for e in xs if (e.get("start") or {}).get("dateTime", "")[:10] != (e.get("end") or {}).get("dateTime", "")[:10]]
    print(f"{name}: {len(xs)}，跨天 {len(cross)}")

sleeps = sorted(in_cat("睡眠"), key=lambda e: (e.get("start") or {}).get("dateTime", ""))
if sleeps:
    print("首睡眠:", sleeps[0]["start"]["dateTime"], "->", sleeps[0]["end"]["dateTime"])
    print("末睡眠:", sleeps[-1]["start"]["dateTime"], "->", sleeps[-1]["end"]["dateTime"])

# 三餐子类
meal = Counter(e.get("subject") for e in in_cat("三餐"))
print("三餐子类:", dict(meal))

# 重复检测 (subject+start)
key = Counter(((e.get("subject"), (e.get("start") or {}).get("dateTime", "")[:16])) for e in evs)
dups = {k: v for k, v in key.items() if v > 1}
print("重复(subject+start)组数:", len(dups))
for k, v in list(dups.items())[:10]:
    print("  重复:", k, v)

# 提醒设置抽查
print("\n样例:")
for e in [courses[0] if courses else None, sleeps[0] if sleeps else None, in_cat("三餐")[0] if in_cat("三餐") else None]:
    if e:
        print(f"  {e.get('subject')} cat={e.get('categories')} remind={e.get('isReminderOn')} showAs={e.get('showAs')} tz={(e.get('start') or {}).get('timeZone')}")
print("\n总请求数:", c.request_count)
