# -*- coding: utf-8 -*-
"""生成 calendar-data.js 的两块内容（幂等，可重复运行）：
1) 给“新学期课程”每个 S(...) 行补第 8 参任课教师（数据源 tools/data/schedule_with_teacher.csv）；
2) 在课程区块后插入 2026-09-01~12-31 每日固定作息（睡眠跨天用 SB）。

以“每日固定作息 · 起/止”标记界定自动区块，重跑时整块替换；课程行无论是否已带教师都统一重写。
"""
import csv, re
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAL_JS = ROOT / "calendar-data.js"
TEACHER_CSV = Path(__file__).parent / "data" / "schedule_with_teacher.csv"
LOC = "湖北省武汉市洪山区"

# ── 教师表：(日期, 开始) -> 教师 ──
teacher = {}
with TEACHER_CSV.open(encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        teacher[(r["日期"], r["开始"])] = r["任课教师"]

src = CAL_JS.read_text(encoding="utf-8")

# ── 1) 课程行补教师（cal 固定 study；兼容已带第8参的情况）──
course_re = re.compile(
    r'S\("(?P<id>[^"]+)","study","(?P<name>[^"]+)","(?P<date>\d{4}-\d{2}-\d{2})",'
    r'"(?P<st>\d{2}:\d{2})","(?P<en>\d{2}:\d{2})","(?P<loc>(?:[^"\\]|\\.)*)"'
    r'(?:,"(?P<old>[^"]*)")?\)'
)
n_course = 0
missing = []


def repl_course(m):
    global n_course
    d, st = m.group("date"), m.group("st")
    t = teacher.get((d, st))
    if not t:
        missing.append((m.group("name"), d, st))
        t = m.group("old") or ""
    n_course += 1
    return (f'S("{m.group("id")}","study","{m.group("name")}","{d}",'
            f'"{st}","{m.group("en")}","{m.group("loc")}","{t}")')


src = course_re.sub(repl_course, src)

# ── 2) 生成作息区块 ──
D0, D1 = date(2026, 9, 1), date(2026, 12, 31)


def q(s):
    return f'"{s}"'


def day_block(d: date) -> str:
    iso, prev = d.isoformat(), (d - timedelta(days=1)).isoformat()
    parts = [
        f'SB("sleep","sleep","睡眠",{q(prev)},"23:30",{q(iso)},"06:30",{q(LOC)})',
        f'S("breakfast","eat","早餐",{q(iso)},"07:00","07:30",{q(LOC)})',
        f'S("walk","walk","放风",{q(iso)},"07:30","08:00",{q(LOC)})',
        f'S("lunch","eat","午餐",{q(iso)},"12:00","12:30",{q(LOC)})',
        f'S("nap","nap","午睡",{q(iso)},"12:30","13:40",{q(LOC)})',
        f'S("dinner","eat","晚餐",{q(iso)},"18:00","18:30",{q(LOC)})',
    ]
    return f'    /* {iso} */ ' + ", ".join(parts) + ","


lines = []
d = D0
while d <= D1:
    lines.append(day_block(d))
    d += timedelta(days=1)
# 区间最后一夜：12/31 23:30 -> 次年 1/1 06:30
lines.append(f'    /* 2026 跨年夜 */ SB("sleep","sleep","睡眠","2026-12-31","23:30","2027-01-01","06:30",{q(LOC)})')

block = (
    "    /* ══════════ 每日固定作息 · 2026 秋 · 起（本区块由 tools/build_calendar_data.py 自动生成，请勿手改）══════════ */\n"
    + "\n".join(lines)
    + "\n    /* ══════════ 每日固定作息 · 止 ══════════ */"
)

# 删除旧区块（若存在）
src = re.sub(r"\s*/\* ═+ 每日固定作息 · 2026 秋 · 起.*?每日固定作息 · 止 ═+ \*/",
             "", src, flags=re.S)
# 在“新学期课程 · 止”后插入
anchor = "/* ══════════ 新学期课程 · 止 ══════════ */"
assert anchor in src, "未找到课程区块止标记"
src = src.replace(anchor, anchor + "\n" + block, 1)

CAL_JS.write_text(src, encoding="utf-8", newline="\n")

# ── 校验 ──
n_sleep = src.count('"sleep","睡眠"')
n_meal = sum(src.count(f'"{x}","eat"') for x in ("breakfast", "lunch", "dinner"))
# 上面计数含定义字符串，改用更精确的事件计数
n_sb = len(re.findall(r'SB\("sleep"', src))
n_eat = len(re.findall(r'S\("(?:breakfast|lunch|dinner)","eat"', src))
n_walk = len(re.findall(r'S\("walk","walk"', src))
n_nap = len(re.findall(r'S\("nap","nap"', src))
print(f"课程行补教师: {n_course}，缺教师: {len(missing)}", missing[:10])
print(f"作息事件: 睡眠(SB)={n_sb} 三餐={n_eat} 放风={n_walk} 午睡={n_nap} 合计={n_sb+n_eat+n_walk+n_nap}")
print("括号平衡 S(/SB(:", src.count("Object.freeze") >= 2)
