#!/usr/bin/env python3
"""Export every accessible Outlook calendar event through the Maton gateway.

Credentials are read only from MATON_API_KEY and OUTLOOK_CONNECTION_ID. The
default output directory is gitignored because calendar bodies, attendees and
meeting links can contain private information.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable


BASE_URL = "https://api.maton.ai/outlook/v1.0"
GRAPH_PREFIX = "https://graph.microsoft.com/v1.0"
MAX_RETRIES = 6
CALENDAR_VIEW_WINDOW_YEARS = 4


class ExportError(RuntimeError):
    pass


def _legacy_bytes(value: str) -> bytes | None:
    """Undo the gateway's occasional Latin-1/CP1252 decoding of text bytes."""
    recovered = bytearray()
    for character in value:
        codepoint = ord(character)
        if codepoint <= 0xFF:
            recovered.append(codepoint)
            continue
        try:
            encoded = character.encode("cp1252")
        except UnicodeEncodeError:
            return None
        if len(encoded) != 1:
            return None
        recovered.extend(encoded)
    return bytes(recovered)


def repair_text_encoding(value: str) -> str:
    """Recover Chinese text that Maton returned as UTF-8/GBK mojibake."""
    current = value
    for _ in range(2):
        raw = _legacy_bytes(current)
        if raw is None:
            break
        cjk_before = sum("\u3400" <= char <= "\u9fff" for char in current)
        candidates = []
        for encoding in ("utf-8", "gb18030"):
            try:
                candidate = raw.decode(encoding)
            except UnicodeDecodeError:
                continue
            cjk_after = sum("\u3400" <= char <= "\u9fff" for char in candidate)
            if cjk_after > cjk_before:
                candidates.append((cjk_after, candidate))
        if not candidates:
            break
        current = max(candidates, key=lambda item: item[0])[1]
    return current


def repair_payload_encoding(value: Any) -> Any:
    if isinstance(value, str):
        return repair_text_encoding(value)
    if isinstance(value, list):
        return [repair_payload_encoding(item) for item in value]
    if isinstance(value, dict):
        return {key: repair_payload_encoding(item) for key, item in value.items()}
    return value


class GraphClient:
    def __init__(self, api_key: str, connection_id: str) -> None:
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Maton-Connection": connection_id,
            "Accept": "application/json",
            "Prefer": 'outlook.body-content-type="html", outlook.timezone="China Standard Time"',
            "User-Agent": "Mon-Mode-de-Vie-Outlook-Exporter/1.0",
        }
        self.request_count = 0

    @staticmethod
    def gateway_url(url: str) -> str:
        if url.startswith(GRAPH_PREFIX):
            return BASE_URL + url[len(GRAPH_PREFIX) :]
        return url

    def get(self, url: str) -> dict[str, Any]:
        url = self.gateway_url(url)
        for attempt in range(MAX_RETRIES):
            request = urllib.request.Request(url, headers=self.headers)
            try:
                with urllib.request.urlopen(request, timeout=60) as response:
                    self.request_count += 1
                    payload = repair_payload_encoding(json.load(response))
                    time.sleep(0.12)
                    return payload
            except urllib.error.HTTPError as exc:
                body = exc.read().decode("utf-8", errors="replace")
                if exc.code == 429 or 500 <= exc.code < 600:
                    wait = float(exc.headers.get("Retry-After", 2**attempt))
                    time.sleep(min(max(wait, 1), 30))
                    continue
                raise ExportError(f"Graph request failed ({exc.code}) for {url}: {body}") from exc
            except (TimeoutError, urllib.error.URLError) as exc:
                if attempt + 1 == MAX_RETRIES:
                    raise ExportError(f"Graph request failed after retries for {url}: {exc}") from exc
                time.sleep(min(2**attempt, 30))
        raise ExportError(f"Graph request exhausted retries for {url}")

    def paged(self, path_or_url: str) -> tuple[list[dict[str, Any]], int]:
        url = path_or_url if path_or_url.startswith("http") else BASE_URL + path_or_url
        rows: list[dict[str, Any]] = []
        pages = 0
        seen_links: set[str] = set()
        while url:
            normalized = self.gateway_url(url)
            if normalized in seen_links:
                raise ExportError(f"Pagination loop detected for {normalized}")
            seen_links.add(normalized)
            payload = self.get(normalized)
            pages += 1
            value = payload.get("value")
            if not isinstance(value, list):
                raise ExportError(f"Expected a paginated value array from {normalized}")
            rows.extend(value)
            url = payload.get("@odata.nextLink", "")
        return rows, pages


def encode_id(value: str) -> str:
    return urllib.parse.quote(value, safe="")


def event_start_date(event: dict[str, Any]) -> date | None:
    recurrence_start = (((event.get("recurrence") or {}).get("range") or {}).get("startDate"))
    candidate = recurrence_start or ((event.get("start") or {}).get("dateTime"))
    if not candidate:
        return None
    try:
        return date.fromisoformat(str(candidate)[:10])
    except ValueError:
        return None


def year_windows(start: date, end_exclusive: date) -> Iterable[tuple[datetime, datetime]]:
    cursor = datetime(start.year, 1, 1, tzinfo=timezone.utc)
    final = datetime.combine(end_exclusive, datetime.min.time(), tzinfo=timezone.utc)
    while cursor < final:
        following = datetime(
            cursor.year + CALENDAR_VIEW_WINDOW_YEARS, 1, 1, tzinfo=timezone.utc
        )
        yield cursor, min(following, final)
        cursor = following


def iso_z(value: datetime) -> str:
    return value.isoformat(timespec="seconds").replace("+00:00", "Z")


def deduplicate(events: Iterable[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    unique: dict[tuple[str, str, str], dict[str, Any]] = {}
    duplicates = 0
    for event in events:
        key = (
            str(event.get("id", "")),
            str((event.get("start") or {}).get("dateTime", "")),
            str((event.get("end") or {}).get("dateTime", "")),
        )
        if key in unique:
            duplicates += 1
        else:
            unique[key] = event
    ordered = sorted(
        unique.values(),
        key=lambda item: (
            str((item.get("start") or {}).get("dateTime", "")),
            str(item.get("subject", "")),
            str(item.get("id", "")),
        ),
    )
    return ordered, duplicates


def calendar_memberships(client: GraphClient) -> tuple[list[dict[str, Any]], dict[str, list[str]], int]:
    groups, pages = client.paged("/me/calendarGroups?$top=100")
    memberships: dict[str, list[str]] = {}
    for group in groups:
        group_id = str(group.get("id", ""))
        calendars, child_pages = client.paged(
            f"/me/calendarGroups/{encode_id(group_id)}/calendars?$top=100"
        )
        pages += child_pages
        for calendar in calendars:
            calendar_id = str(calendar.get("id", ""))
            memberships.setdefault(calendar_id, []).append(group_id)
    return groups, memberships, pages


def export(client: GraphClient) -> dict[str, Any]:
    calendars, calendar_pages = client.paged("/me/calendars?$top=100")
    groups, memberships, group_pages = calendar_memberships(client)
    exported_at = datetime.now(timezone.utc)
    history_end = exported_at.date() + timedelta(days=1)
    calendar_exports: list[dict[str, Any]] = []
    total_entities = 0
    total_history = 0
    total_entity_pages = 0
    total_view_pages = 0
    total_boundary_duplicates = 0

    for index, calendar in enumerate(calendars, start=1):
        calendar_id = str(calendar.get("id", ""))
        name = str(calendar.get("name", ""))
        print(f"[{index}/{len(calendars)}] Exporting {name!r}...", flush=True)

        events, entity_pages = client.paged(
            f"/me/calendars/{encode_id(calendar_id)}/events?$top=100"
        )
        total_entities += len(events)
        total_entity_pages += entity_pages

        dates = [candidate for event in events if (candidate := event_start_date(event))]
        history_start = min(dates) if dates else history_end
        history_start = max(history_start, date(1900, 1, 1))
        history_rows: list[dict[str, Any]] = []
        windows: list[dict[str, Any]] = []

        for start, end in year_windows(history_start, history_end):
            query = urllib.parse.urlencode(
                {
                    "startDateTime": iso_z(start),
                    "endDateTime": iso_z(end),
                    "$top": "100",
                }
            )
            rows, pages = client.paged(
                f"/me/calendars/{encode_id(calendar_id)}/calendarView?{query}"
            )
            history_rows.extend(rows)
            total_view_pages += pages
            windows.append(
                {
                    "start": iso_z(start),
                    "endExclusive": iso_z(end),
                    "pages": pages,
                    "rowsBeforeDeduplication": len(rows),
                }
            )

        history_events, boundary_duplicates = deduplicate(history_rows)
        total_history += len(history_events)
        total_boundary_duplicates += boundary_duplicates
        calendar_exports.append(
            {
                "calendar": calendar,
                "calendarGroupIds": memberships.get(calendar_id, []),
                "eventEntities": events,
                "historicalCalendarView": {
                    "start": history_start.isoformat(),
                    "endExclusive": history_end.isoformat(),
                    "windows": windows,
                    "boundaryDuplicatesRemoved": boundary_duplicates,
                    "events": history_events,
                },
                "counts": {
                    "eventEntities": len(events),
                    "historicalExpandedEvents": len(history_events),
                    "entityPages": entity_pages,
                    "calendarViewPages": sum(window["pages"] for window in windows),
                },
            }
        )

    return {
        "schemaVersion": 1,
        "exportedAt": exported_at.isoformat().replace("+00:00", "Z"),
        "source": {
            "provider": "Microsoft Outlook via Maton",
            "api": "Microsoft Graph v1.0",
            "connectionFingerprint": hashlib.sha256(
                os.environ["OUTLOOK_CONNECTION_ID"].encode("utf-8")
            ).hexdigest()[:16],
        },
        "scope": {
            "rawEventEntities": "All event entities returned by /me/calendars/{id}/events",
            "historicalOccurrences": (
                "All calendarView rows expanded from each calendar's earliest stored event "
                f"through {history_end.isoformat()} (exclusive)"
            ),
            "deletedItems": "Microsoft Graph does not expose permanently deleted calendar events here",
        },
        "calendarGroups": groups,
        "calendars": calendar_exports,
        "audit": {
            "complete": True,
            "calendarCount": len(calendars),
            "calendarGroupCount": len(groups),
            "calendarListPages": calendar_pages,
            "calendarGroupPages": group_pages,
            "eventEntityPages": total_entity_pages,
            "calendarViewPages": total_view_pages,
            "eventEntityCount": total_entities,
            "historicalExpandedEventCount": total_history,
            "boundaryDuplicatesRemoved": total_boundary_duplicates,
            "httpRequestCount": client.request_count,
        },
    }


ENTITY_COLUMNS = [
    "calendar_name",
    "calendar_id",
    "id",
    "type",
    "subject",
    "start",
    "start_timezone",
    "end",
    "end_timezone",
    "is_all_day",
    "is_cancelled",
    "show_as",
    "sensitivity",
    "location",
    "body_preview",
    "body_type",
    "body",
    "organizer_json",
    "attendees_json",
    "recurrence_json",
    "categories_json",
    "online_meeting_json",
    "web_link",
    "created_at",
    "modified_at",
]


def event_csv_row(calendar: dict[str, Any], event: dict[str, Any]) -> dict[str, Any]:
    start = event.get("start") or {}
    end = event.get("end") or {}
    location = event.get("location") or {}
    body = event.get("body") or {}
    return {
        "calendar_name": calendar.get("name", ""),
        "calendar_id": calendar.get("id", ""),
        "id": event.get("id", ""),
        "type": event.get("type", ""),
        "subject": event.get("subject", ""),
        "start": start.get("dateTime", ""),
        "start_timezone": start.get("timeZone", ""),
        "end": end.get("dateTime", ""),
        "end_timezone": end.get("timeZone", ""),
        "is_all_day": event.get("isAllDay", False),
        "is_cancelled": event.get("isCancelled", False),
        "show_as": event.get("showAs", ""),
        "sensitivity": event.get("sensitivity", ""),
        "location": location.get("displayName", ""),
        "body_preview": event.get("bodyPreview", ""),
        "body_type": body.get("contentType", ""),
        "body": body.get("content", ""),
        "organizer_json": json.dumps(event.get("organizer"), ensure_ascii=False),
        "attendees_json": json.dumps(event.get("attendees"), ensure_ascii=False),
        "recurrence_json": json.dumps(event.get("recurrence"), ensure_ascii=False),
        "categories_json": json.dumps(event.get("categories"), ensure_ascii=False),
        "online_meeting_json": json.dumps(event.get("onlineMeeting"), ensure_ascii=False),
        "web_link": event.get("webLink", ""),
        "created_at": event.get("createdDateTime", ""),
        "modified_at": event.get("lastModifiedDateTime", ""),
    }


def write_csv(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=ENTITY_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=Path("tmp/outlook-calendar-export"))
    args = parser.parse_args()
    api_key = os.environ.get("MATON_API_KEY")
    connection_id = os.environ.get("OUTLOOK_CONNECTION_ID")
    if not api_key or not connection_id:
        parser.error("MATON_API_KEY and OUTLOOK_CONNECTION_ID are required")

    client = GraphClient(api_key, connection_id)
    payload = export(client)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    json_path = args.output_dir / "outlook-calendar-full.json"
    entity_csv = args.output_dir / "outlook-event-entities.csv"
    history_csv = args.output_dir / "outlook-history-expanded.csv"
    json_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    entity_rows = (
        event_csv_row(item["calendar"], event)
        for item in payload["calendars"]
        for event in item["eventEntities"]
    )
    history_rows = (
        event_csv_row(item["calendar"], event)
        for item in payload["calendars"]
        for event in item["historicalCalendarView"]["events"]
    )
    write_csv(entity_csv, entity_rows)
    write_csv(history_csv, history_rows)

    print(json.dumps(payload["audit"], ensure_ascii=False, indent=2))
    print(f"JSON: {json_path.resolve()}")
    print(f"Entities CSV: {entity_csv.resolve()}")
    print(f"History CSV: {history_csv.resolve()}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ExportError as exc:
        print(f"Export failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
