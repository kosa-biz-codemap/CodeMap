#!/usr/bin/env python3
"""Validate executable HTTP specification structure."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTTP_ROOT = ROOT / "docs" / "http"
SHARED_ROOT = HTTP_ROOT / "_shared"
REQUEST_RE = re.compile(r"^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD|WEBSOCKET)\s+\S+", re.MULTILINE)
ID_RE = re.compile(
    r"\b(?:PROJECT|RAG|AGENT|DOCS)-(?:LIST|REPO|PIPELINE|PARSE|EMBED|GRAPH|CHAT|CORE|SEARCH|GEN|GUARD|UTIL)-(?:API-)?[BF]?[-]?[0-9]{3}\b"
)
TOKEN_ASSIGN_RE = re.compile(
    r"^@(?:accessToken|serviceToken)\s*=\s*(?P<value>\S.*)$",
    re.IGNORECASE | re.MULTILINE,
)


def fail(message: str, errors: list[str]) -> None:
    errors.append(message)


def main() -> int:
    errors: list[str] = []
    executable_files = sorted(
        path
        for path in HTTP_ROOT.rglob("*.http")
        if SHARED_ROOT not in path.parents
    )
    request_count = 0
    api_ids: Counter[str] = Counter()
    feature_ids: set[str] = set()

    for path in executable_files:
        content = path.read_text(encoding="utf-8")
        matches = REQUEST_RE.findall(content)
        request_count += len(matches)
        if not matches:
            fail(f"실행 요청 블록 없음: {path.relative_to(ROOT)}", errors)
        token_values = [match.group("value").strip() for match in TOKEN_ASSIGN_RE.finditer(content)]
        if any(not value.startswith("replace-me") for value in token_values):
            fail(f"토큰 변수는 replace-me placeholder여야 함: {path.relative_to(ROOT)}", errors)
        ids = ID_RE.findall(content)
        feature_ids.update(ids)
        for value in ids:
            if "-API-" in value:
                api_ids[value] += 1

    summary = {
        "executable_http_files": len(executable_files),
        "request_blocks": request_count,
        "referenced_feature_and_api_ids": len(feature_ids),
        "errors": errors,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
