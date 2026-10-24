# -*- coding: utf-8 -*-
"""Step5：把 8/31–9/30 仍按夏季作息的 38 节课程改回 Hub 官网冬季作息。

默认 dry-run（只打印将做什么），加 --apply 才真正 PATCH。
- 目标时间来自网站 calendar-data.js（已与 Hub 总课表逐条核对，权威）。
- 仅当 Outlook 事件当前时间 = 该节次对应的旧夏季时间时才改，避免误伤；
  已是冬季时间的跳过；时间对不上的列入异常，绝不擅改。
- 凭证从环境变量 MATON_API_KEY 读取，绝不写文件。
"""
import re, sys, urllib.parse
from pathlib import Path
from outlook_client import OutlookClient

APPLY = "--apply" in sys.argv
ROOT = Path(__file__).resolve().parent.parent
DATA_JS = ROOT / "calendar-data.js"

# 目标（冬季）→ 该节次旧夏季时间；仅当 Outlook 命中旧值时才改
WINTER_TO_SUMMER = {
    ("14:00", "15:35"): ("14:30", "16:05"),  # 5-6
    ("15:55", "17:30"): ("16:25", "18:00"),  # 7-8
    ("14:00", "17:30"): ("14:30", "18:00"),  # 5-8
    ("18:30", "20:05"): ("19:00", "20:35"),  # 9-10
    ("18:30", "21:00"): ("19:00", "21:30"),  # 9-11
}
D0, D1 = "2026-08-31", "2026-09-30"


def split_args(inside):
    args, i, n = [], 0, len(inside)
    while i < n:
        c = inside[i]
        if c in " \t\r\n,":
            i += 1; continue
        if c == '"':
            j = i + 1; buf = []
            while j < n and inside[j] != '"':
                buf.append(inside[j]); j += 1
            args.append("".join(buf)); i = j + 1
        else:
            j = i
            while j < n and inside[j] != ',':
                j += 1
            args.append(inside[i:j].strip()); i = j
    return args


def load_targets():
    """从 calendar-data.js 提取 (date,title) -> (start,end)，仅窗口内下午/晚间 study。"""
    txt = DATA_JS.read_text(encoding="utf-8")
    targets = {}
    for m in re.finditer(r"\bS\((.*?)\)\s*,?\s*(?:\n|$)", txt, re.S):
        a = split_args(m.group(1))
        if len(a) < 7 or a[1] != "study":
            continue
        _, cal, title, date, st, et, loc = a[:7]
        if D0 <= date <= D1 and st >= "14:00" and (st, et) in WINTER_TO_SUMMER:
            targets[(date, title)] = (st, et)
    return targets


def hm(dt):
    return (dt or "")[11:16]


def main():
    targets = load_targets()
    print(f"目标（窗口内下午/晚间课程）: {len(targets)} 节")

    c = OutlookClient()
    flt = (f"start/dateTime ge '{D0}T00:00:00' and "
           f"start/dateTime lt '2026-10-01T00:00:00' and "
           f"categories/any(a:a eq '课程')")
    q = urllib.parse.quote(flt, safe="'")
    events = c.paged(f"/me/calendar/events?$filter={q}&$top=100&$orderby=start/dateTime")
    print(f"Outlook 窗口内课程事件: {len(events)}")

    to_patch, already_ok, weird, matched = [], [], [], 0
    for e in events:
        sd = (e.get("start") or {}).get("dateTime", "")
        date, cur_s, cur_e = sd[:10], hm(sd), hm((e.get("end") or {}).get("dateTime", ""))
        title = e.get("subject", "")
        tgt = targets.get((date, title))
        if not tgt:
            continue
        matched += 1
        new_s, new_e = tgt
        old_s, old_e = WINTER_TO_SUMMER[(new_s, new_e)]
        if (cur_s, cur_e) == (new_s, new_e):
            already_ok.append((date, title, cur_s, cur_e))
        elif (cur_s, cur_e) == (old_s, old_e):
            to_patch.append((e, date, title, cur_s, cur_e, new_s, new_e))
        else:
            weird.append((date, title, cur_s, cur_e, "应为", new_s, new_e))

    # 目标里没在 Outlook 找到的
    seen = {(e["start"]["dateTime"][:10], e.get("subject", "")) for e in events}
    missing = [k for k in targets if k not in seen]

    print(f"\n命中目标: {matched}  已是冬季(跳过): {len(already_ok)}  "
          f"待改(夏季→冬季): {len(to_patch)}  时间异常: {len(weird)}  目标缺失: {len(missing)}")

    for _, date, title, cs, ce, ns, ne in sorted(to_patch, key=lambda x: (x[1], x[3])):
        print(f"  PATCH {date} {title}  {cs}-{ce} -> {ns}-{ne}")
    for w in weird:
        print("  !! 异常", w)
    for k in sorted(missing):
        print("  !! Outlook 缺失", k)

    if APPLY:
        ok = 0
        for e, date, title, cs, ce, ns, ne in to_patch:
            body = {
                "start": {"dateTime": f"{date}T{ns}:00", "timeZone": "China Standard Time"},
                "end":   {"dateTime": f"{date}T{ne}:00", "timeZone": "China Standard Time"},
            }
            c.patch(f"/me/events/{e['id']}", body)
            ok += 1
        print(f"\n已 PATCH {ok} 个事件 | 总请求数: {c.request_count}")
    else:
        print(f"\nDRY-RUN：未写入。确认无误后加 --apply 执行 | 预计请求数: {len(to_patch)}")


if __name__ == "__main__":
    main()
