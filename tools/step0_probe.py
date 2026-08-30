# -*- coding: utf-8 -*-
"""探测：账号、现有主类别、课程事件数量与正文样例。只读。"""
import sys, urllib.parse
from outlook_client import OutlookClient

c = OutlookClient()
me = c.get("/me")
print("账号:", me.get("userPrincipalName"), "| 显示名:", me.get("displayName"))

cats = c.get("/me/outlook/masterCategories").get("value", [])
print(f"\n现有主类别 {len(cats)} 个:")
for x in cats:
    print("  -", x.get("displayName"), "|", x.get("color"))

# 课程事件：8/31 起，按类别“课程”筛
flt = "start/dateTime ge '2026-08-31T00:00:00' and categories/any(a:a eq '课程')"
q = urllib.parse.quote(flt, safe="'")
evs = c.paged(f"/me/calendar/events?$filter={q}&$top=100&$orderby=start/dateTime")
print(f"\n课程事件数: {len(evs)}")
if evs:
    e = evs[0]
    print("样例 subject:", e.get("subject"))
    print("样例 start:", e.get("start"), "end:", e.get("end"))
    print("样例 location:", (e.get("location") or {}).get("displayName"))
    print("样例 categories:", e.get("categories"))
    print("样例 isReminderOn:", e.get("isReminderOn"), e.get("reminderMinutesBeforeStart"))
    print("样例 body.contentType:", (e.get("body") or {}).get("contentType"))
    print("样例 body.content:")
    print((e.get("body") or {}).get("content"))
    # 日期范围
    ds = sorted((e.get("start") or {}).get("dateTime", "")[:10] for e in evs)
    print("最早:", ds[0], "最晚:", ds[-1])
print("\n总请求数:", c.request_count)
