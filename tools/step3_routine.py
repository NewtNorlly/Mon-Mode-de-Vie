# -*- coding: utf-8 -*-
"""Step3：批量创建 2026-09-01 ~ 12-31 每日作息事件到 Outlook。

固定作息（用户指定）：
  睡眠  当天23:30 → 次日06:30（跨天；首个 8/31 23:30→9/1 06:30，末个 12/31 23:30→1/1 06:30）
  早餐  07:00–07:30（三餐）  放风 07:30–08:00（放风）
  午餐  12:00–12:30（三餐）  午睡 12:30–13:40（午睡）
  晚餐  18:00–18:30（三餐）

幂等：先拉取区间内既有作息事件，按 (标题, 起始时刻) 去重，已存在则跳过，可断点续跑。
默认 dry-run，加 --apply 才创建。
"""
import sys, urllib.parse
from datetime import date, timedelta
from outlook_client import OutlookClient

APPLY = "--apply" in sys.argv
TZ = "China Standard Time"
D0, D1 = date(2026, 9, 1), date(2026, 12, 31)

# (标题, 类别, 起始, 结束(相对当天; 睡眠特殊处理), showAs, 备注)
def build_events():
    ev = []
    d = D0
    while d <= D1:
        iso = d.isoformat()
        # 睡眠：前一天23:30 → 当天06:30（跨天）
        prev = (d - timedelta(days=1)).isoformat()
        ev.append(dict(subject="睡眠", cats=["睡眠"], start=f"{prev}T23:30:00", end=f"{iso}T06:30:00",
                       showAs="oof", note="婴儿般的睡眠", item="睡眠",
                       tdesc="23:30–次日06:30"))
        # 白天五项
        ev.append(dict(subject="早餐", cats=["三餐"], start=f"{iso}T07:00:00", end=f"{iso}T07:30:00", showAs="free", note="", item="早餐", tdesc="07:00–07:30"))
        ev.append(dict(subject="放风", cats=["放风"], start=f"{iso}T07:30:00", end=f"{iso}T08:00:00", showAs="free", note="晨间放风", item="放风", tdesc="07:30–08:00"))
        ev.append(dict(subject="午餐", cats=["三餐"], start=f"{iso}T12:00:00", end=f"{iso}T12:30:00", showAs="free", note="", item="午餐", tdesc="12:00–12:30"))
        ev.append(dict(subject="午睡", cats=["午睡"], start=f"{iso}T12:30:00", end=f"{iso}T13:40:00", showAs="tentative", note="", item="午睡", tdesc="12:30–13:40"))
        ev.append(dict(subject="晚餐", cats=["三餐"], start=f"{iso}T18:00:00", end=f"{iso}T18:30:00", showAs="free", note="", item="晚餐", tdesc="18:00–18:30"))
        d += timedelta(days=1)
    # 12/31 当晚 → 次年 1/1 凌晨的睡眠（覆盖区间最后一夜）
    ev.append(dict(subject="睡眠", cats=["睡眠"], start=f"{D1.isoformat()}T23:30:00", end="2027-01-01T06:30:00",
                   showAs="oof", note="婴儿般的睡眠", item="睡眠", tdesc="23:30–次日06:30"))
    return ev


def html_body(e):
    lines = ["【每日作息】", f"项目：{e['item']}", f"时间：{e['tdesc']}（北京时间 UTC+8）"]
    if e["note"]:
        lines.append(f"备注：{e['note']}")
    return "<br>".join(lines)


events = build_events()
print(f"计划作息事件: {len(events)}（天数 {(D1-D0).days+1}，睡眠含首尾跨天）")

c = OutlookClient()
# 拉取区间内既有作息事件用于去重
flt = ("start/dateTime ge '2026-08-31T00:00:00' and "
       "(categories/any(a:a eq '睡眠') or categories/any(a:a eq '三餐') or "
       "categories/any(a:a eq '午睡') or categories/any(a:a eq '放风'))")
q = urllib.parse.quote(flt, safe="'()")
existing = c.paged(f"/me/calendar/events?$filter={q}&$top=100")
have = {(e.get("subject", ""), (e.get("start") or {}).get("dateTime", "")[:16]) for e in existing}
print(f"区间内既有作息事件: {len(existing)}")

def key(e):
    return (e["subject"], e["start"][:16])

todo = [e for e in events if key(e) not in have]
print(f"已存在跳过: {len(events)-len(todo)}  待创建: {len(todo)}")

created = failed = 0
for i, e in enumerate(todo, 1):
    payload = {
        "subject": e["subject"],
        "categories": e["cats"],
        "start": {"dateTime": e["start"], "timeZone": TZ},
        "end": {"dateTime": e["end"], "timeZone": TZ},
        "isAllDay": False,
        "isReminderOn": False,
        "showAs": e["showAs"],
        "sensitivity": "normal",
        "body": {"contentType": "html", "content": html_body(e)},
    }
    if APPLY:
        try:
            c.post("/me/calendar/events", payload)
            created += 1
        except Exception as ex:
            failed += 1
            print("  失败:", e["subject"], e["start"], str(ex)[:200])
        if i % 100 == 0:
            print(f"  ...已处理 {i}/{len(todo)}")
    else:
        created += 1

print(f"\n模式:", "APPLY 已创建" if APPLY else "DRY-RUN（加 --apply 执行）")
print(f"新建: {created}  失败: {failed}  请求数: {c.request_count}")
# 分类计数
from collections import Counter
cc = Counter(tuple(e["cats"]) for e in events)
print("计划分类分布:", dict(cc))
