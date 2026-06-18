# Current Work

## 2026-06-18 — Notion HTML to HTTP API specification migration

- Branch: `docs/http-api-specs`
- Goal: strengthen executable `.http` API contracts while keeping generated Notion audit exports local.
- Status: conversion and first API-contract reinforcement complete.

### Files and areas

- `docs/http/`: executable API specification files across 12 domains.
- `scripts/convert_notion_html_to_http.py`: standard-library-only converter.
- `scripts/validate_http_specs.py`: request-block, API-ID and placeholder validator.
- `docs/http/_source-spec/`: optional local audit output; excluded from Git.

### Validation

```bash
python3 scripts/validate_http_specs.py
python3 -m py_compile scripts/convert_notion_html_to_http.py scripts/validate_http_specs.py
git diff --check
```

Latest repository validation: 45 executable specs, 105 request blocks, 31 Markdown API contracts and 97 API-specific error rows. The local converter also confirmed 113/113 source files and 100% source-token coverage. Generated audit copies are no longer shared through Git.

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
