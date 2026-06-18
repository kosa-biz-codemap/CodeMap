#!/usr/bin/env python3
"""Check that Markdown API/error rules are reflected in executable HTTP specs."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
HTTP_ROOT = DOCS / "http"
SOURCE_ROOT = HTTP_ROOT / "_source-spec"
SHARED_ROOT = HTTP_ROOT / "_shared"
API_DOCS = [
    DOCS / "03_API" / "AGENT_API_SPEC.md",
    DOCS / "03_API" / "DOCS_API_SPEC.md",
    DOCS / "03_API" / "PHASE2_API_SPEC.md",
    DOCS / "03_API" / "RAG_API_SPEC.md",
]
API_ID_RE = re.compile(r"((?:[A-Z]+-)+API-[0-9]{3})")
ENDPOINT_RE = re.compile(r"\| Endpoint \| `((?:GET|POST|PUT|PATCH|DELETE|WS)\s+)?([^`]+)` \|")
ERROR_ROW_RE = re.compile(r"^\|\s*(\d{3})\s*\|\s*`([A-Z][A-Z0-9_]+)`\s*\|", re.MULTILINE)
REQUEST_RE = re.compile(r"^(GET|POST|PUT|PATCH|DELETE|WEBSOCKET)\s+(\S+)", re.MULTILINE)


def api_sections(markdown: str) -> list[tuple[str, str]]:
    headings = list(re.finditer(r"^###\s+(.+)$", markdown, re.MULTILINE))
    sections: list[tuple[str, str]] = []
    for index, heading in enumerate(headings):
        match = API_ID_RE.search(heading.group(1))
        if not match:
            continue
        end = headings[index + 1].start() if index + 1 < len(headings) else len(markdown)
        sections.append((match.group(1), markdown[heading.start():end]))
    return sections


def normalize_path(value: str) -> str:
    value = re.sub(r"\{\{[^}]+\}\}|\{[^}]+\}", "{}", value)
    return value.rstrip("/")


def main() -> int:
    errors: list[str] = []
    executable = [
        path
        for path in HTTP_ROOT.rglob("*.http")
        if SOURCE_ROOT not in path.parents and SHARED_ROOT not in path.parents
    ]
    contents = {path: path.read_text(encoding="utf-8") for path in executable}
    checked_apis = 0
    checked_error_codes = 0

    for path, content in contents.items():
        if "공통 오류 계약: ../_shared/ERROR-CONTRACT.http" not in content:
            errors.append(f"공통 오류 계약 참조 누락: {path.relative_to(ROOT)}")

    for doc in API_DOCS:
        markdown = doc.read_text(encoding="utf-8")
        for api_id, section in api_sections(markdown):
            checked_apis += 1
            targets = [path for path, content in contents.items() if api_id in content]
            if len(targets) != 1:
                errors.append(
                    f"{doc.relative_to(ROOT)} {api_id}: 실행 명세 {len(targets)}개 (정확히 1개 필요)"
                )
                continue
            target = targets[0]
            content = contents[target]
            endpoint_match = ENDPOINT_RE.search(section)
            if endpoint_match:
                method_from_cell, endpoint = endpoint_match.groups()
                expected_path = normalize_path(endpoint)
                requests = REQUEST_RE.findall(content)
                if not any(expected_path in normalize_path(request_path) for _, request_path in requests):
                    errors.append(
                        f"{api_id}: Markdown endpoint {endpoint}가 {target.relative_to(ROOT)} 요청에 없음"
                    )
            for status, error_code in ERROR_ROW_RE.findall(section):
                checked_error_codes += 1
                if error_code not in content:
                    errors.append(
                        f"{api_id}: {status} {error_code}가 {target.relative_to(ROOT)}에 없음"
                    )

    error_catalog = (DOCS / "03_API" / "ERROR_CODES.md").read_text(encoding="utf-8")
    shared_contract = (SHARED_ROOT / "ERROR-CONTRACT.http").read_text(encoding="utf-8")
    all_http = "\n".join(contents.values()) + "\n" + shared_contract
    catalog_codes = sorted(set(code for _, code in ERROR_ROW_RE.findall(error_catalog)))
    missing_catalog_codes = [code for code in catalog_codes if code not in all_http]
    if missing_catalog_codes:
        errors.append("통합 에러 카탈로그 미반영: " + ", ".join(missing_catalog_codes))

    summary = {
        "markdown_api_files": len(API_DOCS),
        "checked_apis": checked_apis,
        "checked_api_error_rows": checked_error_codes,
        "catalog_error_codes": len(catalog_codes),
        "executable_http_files": len(executable),
        "errors": errors,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
