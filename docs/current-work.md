# Current Work

## 2026-06-18 — Notion HTML to HTTP API specification migration

- Branch: `feat/integrated-workspace`
- Goal: preserve every Notion HTML specification locally and strengthen executable `.http` API contracts.
- Status: conversion and first API-contract reinforcement complete.

### Files and areas

- `docs/http/`: 49 executable API specification files across 12 domains.
- `docs/http/_source-spec/`: comment-only conversions of all 113 source HTML files.
- `docs/http/_source-spec/manifest.json`: source path, SHA-256 and token coverage evidence.
- `scripts/convert_notion_html_to_http.py`: standard-library-only converter.
- `scripts/validate_http_specs.py`: preservation, traceability, request-block and placeholder validator.

### Validation

```bash
python3 scripts/validate_http_specs.py
python3 -m py_compile scripts/convert_notion_html_to_http.py scripts/validate_http_specs.py
git diff --check
```

Latest result: 113/113 source files, 100% source-token coverage, 49 executable specs, 107 request blocks, and zero unmapped source feature/API IDs.

### Contract decisions still required

- `PROJECT-LIST-API-005`: choose one policy for limit overflow (200 warning vs 413/422 rejection).
- `PROJECT-PIPELINE-API-004`: define allowed `target` values before implementation.
- Phase 2 stack scoring, long-term memory, PDF/share and graph contracts are design drafts, not implemented endpoints.
- Reconcile legacy flat error responses with the common nested error envelope before backend implementation.

### Prior commit boundary

The first HTTP migration commit intentionally left local `docs/03_API/` drafts untouched.
The follow-up below incorporates them after the user explicitly requested Markdown-rule synchronization.

## 2026-06-18 — Markdown error rules synchronized into HTTP specs

- Promoted `docs/03_API/*_API_SPEC.md`, `docs/03_API/ERROR_CODES.md`, and
  `docs/04_Decisions/ERROR_HANDLING.md` into the contract validation inputs.
- Added `docs/http/_shared/ERROR-CONTRACT.http` for the canonical REST/SSE/WS
  error envelope, status selection, and retry rules.
- Reconciled AGENT and Phase 2 PIPELINE API IDs/endpoints with the newer Markdown
  specifications while retaining the superseded Notion IDs in change-history comments.
- Added `scripts/validate_http_error_contracts.py` to compare 31 Markdown APIs,
  their endpoint paths, and API-specific error rows with executable HTTP files.

### Validation

```bash
python3 scripts/validate_http_specs.py
python3 scripts/validate_http_error_contracts.py
python3 -m py_compile scripts/convert_notion_html_to_http.py \
  scripts/validate_http_specs.py scripts/validate_http_error_contracts.py
git diff --check
```
