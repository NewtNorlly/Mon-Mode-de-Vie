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


def normalized_schedule(calendar: dict[str, Any], event: dict[str, Any]) -> tuple[dict[str, Any], int]:
    calendar_id = str(calendar.get("id", ""))
    calendar_name = str(calendar.get("name", ""))
    title, title_changes = redact(event.get("subject"))
    location, location_changes = redact((event.get("location") or {}).get("displayName"))
    ui_calendar, source = calendar_kind(calendar_name)
    return {
        "id": opaque_id(calendar_id, str(event.get("id", ""))),
        "calendarId": ui_calendar,
        "source": source,
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
    audit = {
        "sourceEventEntities": expected,
        "publicSingleEvents": len(singles),
        "publicRecurrenceSeries": len(recurrences),
        "representedEventEntities": represented,
        "redactionsApplied": redactions,
        "sourceCalendarCounts": source_counts,
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
