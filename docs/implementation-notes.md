# Implementation notes

## 2026-06-18 — Analysis and chat integration

- The workspace uses three coordinated regions: file explorer, report, and Copilot.
- The full-screen chat reuses `ChatInterface`; it is not a second conversation implementation.
- Analysis remains useful without an LLM through deterministic scanning. Optional LLM synthesis is grounded in selected source snippets.
- Conversation tables persist thread continuity across the inline and full-screen surfaces.
- Cache bypass was renamed to “new snapshot” and moved under advanced settings because it deletes the prior clone before analysis.
