#!/usr/bin/env python3
"""Mon Mode de Vie — Outlook/Graph 同步客户端（经 Maton 网关）。

凭证只从进程环境变量读取：
  MATON_API_KEY            必填，Maton API Key（绝不写文件、绝不打印）
  OUTLOOK_CONNECTION_ID    可选，多连接时指定；单连接可留空

设计与 tools/export_outlook_calendar.py 保持一致：
- 网关基址 https://api.maton.ai/outlook/v1.0
- 内置 429/5xx 退避重试与限速（Maton 单账号 10 req/s，这里保守 ~7 req/s）
- 复用中文乱码修复（Maton 偶发把 UTF-8 字节按 latin-1 解码）
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from typing import Any

BASE_URL = "https://api.maton.ai/outlook/v1.0"
GRAPH_PREFIX = "https://graph.microsoft.com/v1.0"
MAX_RETRIES = 6
_PACE = 0.14  # 秒/请求，约 7 req/s，留安全余量


def to_gateway(path: str) -> str:
    """把相对路径 / graph 绝对地址 / Maton 绝对地址统一成 Maton 网关 URL。"""
    if path.startswith(BASE_URL):
        return path
    if path.startswith(GRAPH_PREFIX):
        return BASE_URL + path[len(GRAPH_PREFIX):]
    return BASE_URL + path


def _legacy_bytes(value: str) -> bytes | None:
    recovered = bytearray()
    for ch in value:
        cp = ord(ch)
        if cp <= 0xFF:
            recovered.append(cp)
            continue
        try:
            enc = ch.encode("cp1252")
        except UnicodeEncodeError:
            return None
        if len(enc) != 1:
            return None
        recovered.extend(enc)
    return bytes(recovered)


def repair_text(value: str) -> str:
    cur = value
    for _ in range(2):
        raw = _legacy_bytes(cur)
        if raw is None:
            break
        cjk_before = sum("㐀" <= c <= "鿿" for c in cur)
        best = None
        for enc in ("utf-8", "gb18030"):
            try:
                cand = raw.decode(enc)
            except UnicodeDecodeError:
                continue
            cjk_after = sum("㐀" <= c <= "鿿" for c in cand)
            if cjk_after > cjk_before and (best is None or cjk_after > best[0]):
                best = (cjk_after, cand)
        if not best:
            break
        cur = best[1]
    return cur


def _repair(obj: Any) -> Any:
    if isinstance(obj, str):
        return repair_text(obj)
    if isinstance(obj, list):
        return [_repair(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _repair(v) for k, v in obj.items()}
    return obj


class GraphError(RuntimeError):
    pass


class OutlookClient:
    def __init__(self) -> None:
        key = os.environ.get("MATON_API_KEY")
        if not key:
            raise GraphError("缺少环境变量 MATON_API_KEY")
        self.headers = {
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Prefer": 'outlook.body-content-type="html", outlook.timezone="China Standard Time"',
            "User-Agent": "Mon-Mode-de-Vie-Calendar-Sync/1.0",
        }
        conn = os.environ.get("OUTLOOK_CONNECTION_ID")
        if conn:
            self.headers["Maton-Connection"] = conn
        self.request_count = 0

    def _open(self, method: str, path: str, payload: Any = None) -> Any:
        url = to_gateway(path)
        data = None
        if payload is not None:
            data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        for attempt in range(MAX_RETRIES):
            req = urllib.request.Request(url, data=data, headers=self.headers, method=method)
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    self.request_count += 1
                    raw = resp.read()
                    time.sleep(_PACE)
                    if not raw:
                        return None
                    return _repair(json.loads(raw.decode("utf-8")))
            except urllib.error.HTTPError as exc:
                body = exc.read().decode("utf-8", errors="replace")
                if exc.code == 429 or 500 <= exc.code < 600:
                    wait = float(exc.headers.get("Retry-After", 2 ** attempt))
                    time.sleep(min(max(wait, 1), 30))
                    continue
                raise GraphError(f"{method} {path} -> {exc.code}: {body[:600]}") from exc
            except (TimeoutError, urllib.error.URLError) as exc:
                if attempt + 1 == MAX_RETRIES:
                    raise GraphError(f"{method} {path} 重试耗尽: {exc}") from exc
                time.sleep(min(2 ** attempt, 30))
        raise GraphError(f"{method} {path} 重试耗尽")

    def get(self, path: str) -> Any:
        return self._open("GET", path)

    def post(self, path: str, body: Any) -> Any:
        return self._open("POST", path, body)

    def patch(self, path: str, body: Any) -> Any:
        return self._open("PATCH", path, body)

    def delete(self, path: str) -> Any:
        return self._open("DELETE", path)

    def paged(self, path: str) -> list[dict]:
        """遍历 @odata.nextLink，返回全部 value。入参可为相对路径或绝对 nextLink。"""
        rows: list[dict] = []
        url: str | None = path
        seen: set[str] = set()
        while url:
            norm = to_gateway(url)
            if norm in seen:
                raise GraphError(f"分页循环: {norm}")
            seen.add(norm)
            payload = self.get(url)
            rows.extend(payload.get("value", []))
            url = payload.get("@odata.nextLink")
        return rows
