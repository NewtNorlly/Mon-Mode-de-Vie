#!/usr/bin/env python3
"""Build privacy-filtered website calendar data from the private Outlook export."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any


EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
URL = re.compile(r"\b(?:https?://|www\.)\S+", re.IGNORECASE)
PHONE = re.compile(r"(?<!\d)(1\d{2})\d{4}(\d{4})(?!\d)")
UUID = re.compile(r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b", re.IGNORECASE)


def redact(value: Any) -> tuple[str, int]:
    text = str(value or "")
    changes = 0
    for pattern, replacement in (
        (EMAIL, "***@***"),
        (URL, "[链接已隐藏]"),
        (PHONE, r"\1****\2"),
        (UUID, "[标识已隐藏]"),
    ):
        text, count = pattern.subn(replacement, text)
        changes += count
    return text.strip(), changes


def opaque_id(calendar_id: str, event_id: str) -> str:
    digest = hashlib.sha256(f"{calendar_id}\0{event_id}".encode("utf-8")).hexdigest()
    return "outlook-" + digest[:20]


def normalized_datetime(value: str) -> str:
    # Every exported event uses China Standard Time. Microsoft returns seven
    # fractional digits, which browsers do not consistently parse.
    match = re.match(r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})", value or "")
    if not match:
        raise ValueError(f"Unsupported Outlook datetime: {value!r}")
    return match.group(1) + "+08:00"


def calendar_kind(name: str) -> tuple[str, str]:
    if "节假日" in name:
        return "mmv-holiday", "holiday"
    if "生日" in name:
        return "mmv-birthday", "birthday"
    return "mmv-outlook", "outlook"


# Outlook 主分类（masterCategories）显示名 → 网站日历 calendarId。
# 让网站配色忠实复刻 Outlook 里的“配色/花纹标记”：睡=紫、三餐=橙、课程=靛、
# 午睡=粉、放风=绿；其余提醒/杂项归到做/玩/Outlook 中性色。色相由 calendar.css
# 的 [data-calendar-id] --ch/--cs 变量统一柔和化，明暗双模式在那里收口。
CATEGORY_TO_UI: dict[str, str] = {
    "睡眠": "mmv-sleep",
    "三餐": "mmv-eat",
    "课程": "mmv-study",
    "午睡": "mmv-nap",
    "放风": "mmv-walk",
    "出门踏青": "mmv-walk",
    "灵感畅想": "mmv-make",
    "特别安排": "mmv-make",
    "黄色类别": "mmv-make",
    "不容忽视": "mmv-play",
    "红色类别": "mmv-play",
    "Red Category": "mmv-play",
    "橙色类别": "mmv-eat",
    "绿色类别": "mmv-walk",
    "蓝色类别": "mmv-outlook",
    "紫色类别": "mmv-sleep",
}

# 早期学期课程没有打 Outlook 分类，按课程名子串兜底为“学”，避免旧课表全部落入
# 同一个蓝色。仅匹配明确的课程/学习关键词，生活事项不命中即保持中性色。
COURSE_KEYWORDS: tuple[str, ...] = (
    "宏观经济", "管理信息系统", "公共政策", "管理定量", "人工智能导论",
    "毛泽东思想", "政府绩效", "刑法", "智能医学", "乒乓球", "民法", "行政法",
    "组织行为", "法理", "质性研究", "房地产管理", "计算社会科学", "公共事业",
    "侃哥读外刊",
)


def clean_categories(event: dict[str, Any]) -> list[str]:
    """保留事件自带的 Outlook 分类名（去空、去重、保序），供前端图例与审计追溯。"""
    seen: set[str] = set()
    kept: list[str] = []
    for raw in event.get("categories") or []:
        name = str(raw or "").strip()
        if name and name not in seen:
            seen.add(name)
            kept.append(name)
    return kept


def ui_calendar_for_event(
    calendar_name: str, categories: list[str], title: str
) -> tuple[str, str]:
    """决定一个事件在网站使用的 calendarId（配色）与来源口径。"""
    ui_calendar, source = calendar_kind(calendar_name)
    if source in ("holiday", "birthday"):
        return ui_calendar, source
    for name in categories:
        if name in CATEGORY_TO_UI:
            return CATEGORY_TO_UI[name], "category"
    for keyword in COURSE_KEYWORDS:
        if keyword in (title or ""):
            return "mmv-study", "course-fallback"
    return "mmv-outlook", "outlook"


def normalized_schedule(calendar: dict[str, Any], event: dict[str, Any]) -> tuple[dict[str, Any], int]:
    calendar_id = str(calendar.get("id", ""))
    calendar_name = str(calendar.get("name", ""))
    title, title_changes = redact(event.get("subject"))
    location, location_changes = redact((event.get("location") or {}).get("displayName"))
    outlook_categories = clean_categories(event)
    ui_calendar, source = ui_calendar_for_event(calendar_name, outlook_categories, title)
    return {
        "id": opaque_id(calendar_id, str(event.get("id", ""))),
        "calendarId": ui_calendar,
        "source": source,
        "outlookCategories": outlook_categories,
        "title": title or "（无标题日程）",
        "start": normalized_datetime((event.get("start") or {}).get("dateTime", "")),
        "end": normalized_datetime((event.get("end") or {}).get("dateTime", "")),
        "category": "allday" if event.get("isAllDay") else "time",
        "location": location,
    }, title_changes + location_changes


def recurrence_definition(calendar: dict[str, Any], event: dict[str, Any]) -> tuple[dict[str, Any], int]:
    schedule, changes = normalized_schedule(calendar, event)
    recurrence = event.get("recurrence") or {}
    pattern = recurrence.get("pattern") or {}
    recurrence_range = recurrence.get("range") or {}
    if pattern.get("type") != "absoluteYearly" or int(pattern.get("interval", 0)) != 1:
        raise ValueError(f"Unsupported public recurrence pattern: {pattern!r}")
    start = datetime.fromisoformat(schedule["start"])
    end = datetime.fromisoformat(schedule["end"])
    duration_seconds = int((end - start).total_seconds())
    return {
        "id": schedule["id"],
        "calendarId": schedule["calendarId"],
        "source": schedule["source"],
        "outlookCategories": schedule["outlookCategories"],
        "title": schedule["title"],
        "location": schedule["location"],
        "category": schedule["category"],
        "startYear": int(str(recurrence_range.get("startDate"))[:4]),
        "month": int(pattern["month"]),
        "day": int(pattern["dayOfMonth"]),
        "startTime": start.strftime("%H:%M:%S"),
        "durationSeconds": duration_seconds,
    }, changes


def build(private_export: Path) -> tuple[dict[str, Any], list[dict[str, Any]], list[dict[str, Any]]]:
    payload = json.loads(private_export.read_text(encoding="utf-8"))
    singles: list[dict[str, Any]] = []
    recurrences: list[dict[str, Any]] = []
    redactions = 0
    source_counts: dict[str, int] = {}

    for calendar_export in payload["calendars"]:
        calendar = calendar_export["calendar"]
        source_counts[str(calendar.get("name", ""))] = len(calendar_export["eventEntities"])
        for event in calendar_export["eventEntities"]:
            if event.get("isCancelled"):
                continue
            if event.get("type") == "seriesMaster":
                definition, changes = recurrence_definition(calendar, event)
                recurrences.append(definition)
            else:
                schedule, changes = normalized_schedule(calendar, event)
                singles.append(schedule)
            redactions += changes

    singles.sort(key=lambda row: (row["start"], row["title"], row["id"]))
    recurrences.sort(key=lambda row: (row["month"], row["day"], row["title"], row["id"]))
    represented = len(singles) + len(recurrences)
    expected = int(payload["audit"]["eventEntityCount"])
    if represented != expected:
        raise ValueError(f"Public representation mismatch: {represented} != {expected}")
    ui_calendar_counts: dict[str, int] = {}
    source_kind_counts: dict[str, int] = {}
    for row in singles + recurrences:
        ui_calendar_counts[row["calendarId"]] = ui_calendar_counts.get(row["calendarId"], 0) + 1
        source_kind_counts[row["source"]] = source_kind_counts.get(row["source"], 0) + 1
    audit = {
        "sourceEventEntities": expected,
        "publicSingleEvents": len(singles),
        "publicRecurrenceSeries": len(recurrences),
        "representedEventEntities": represented,
        "redactionsApplied": redactions,
        "sourceCalendarCounts": source_counts,
        "uiCalendarCounts": dict(sorted(ui_calendar_counts.items())),
        "sourceKindCounts": dict(sorted(source_kind_counts.items())),
        "omittedFields": [
            "Graph event and calendar IDs",
            "body and bodyPreview",
            "organizer and attendees",
            "webLink and onlineMeeting",
            "connection and account metadata",
        ],
    }
    return audit, singles, recurrences


def javascript(audit: dict[str, Any], singles: list[dict[str, Any]], recurrences: list[dict[str, Any]]) -> str:
    packed_audit = json.dumps(audit, ensure_ascii=False, separators=(",", ":"))
    packed_singles = json.dumps(singles, ensure_ascii=False, separators=(",", ":"))
    packed_recurrences = json.dumps(recurrences, ensure_ascii=False, separators=(",", ":"))
    return f"""(() => {{
  const audit = Object.freeze({packed_audit});
  const singles = Object.freeze({packed_singles}.map(Object.freeze));
  const recurrences = Object.freeze({packed_recurrences}.map(Object.freeze));
  const pad = value => String(value).padStart(2, "0");
  const iso = (year, month, day, time) => `${{year}}-${{pad(month)}}-${{pad(day)}}T${{time}}+08:00`;

  window.MMV_OUTLOOK_CALENDAR_AUDIT = audit;
  window.MMV_OUTLOOK_CALENDAR_SCHEDULES = singles;
  window.MMV_OUTLOOK_RECURRENCES_FOR_YEAR = year => Object.freeze(recurrences
    .filter(item => year >= item.startYear)
    .map(item => {{
      const start = new Date(iso(year, item.month, item.day, item.startTime));
      const end = new Date(start.getTime() + item.durationSeconds * 1000);
      const endIso = `${{end.getFullYear()}}-${{pad(end.getMonth() + 1)}}-${{pad(end.getDate())}}T${{pad(end.getHours())}}:${{pad(end.getMinutes())}}:${{pad(end.getSeconds())}}+08:00`;
      return Object.freeze({{
        id: `${{item.id}}-${{year}}`,
        calendarId: item.calendarId,
        source: item.source,
        outlookCategories: item.outlookCategories || [],
        title: item.title,
        location: item.location,
        category: item.category,
        start: iso(year, item.month, item.day, item.startTime),
        end: endIso,
      }});
    }}));
}})();
"""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("tmp/outlook-calendar-export/outlook-calendar-full.json"),
    )
    parser.add_argument("--output", type=Path, default=Path("outlook-calendar-data.js"))
    args = parser.parse_args()
    audit, singles, recurrences = build(args.input)
    args.output.write_text(javascript(audit, singles, recurrences), encoding="utf-8", newline="\n")
    print(json.dumps(audit, ensure_ascii=False, indent=2))
    print(f"Public calendar data: {args.output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
