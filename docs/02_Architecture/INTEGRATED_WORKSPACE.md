# Integrated Repository Workspace

## Product model

CodeMap treats analysis and chat as two views over one immutable repository snapshot.

```text
AnalysisJob (repo snapshot)
├── report_json (structure, metrics, risks, recommendations)
├── cloned source files
└── ChatConversation[]
    └── ChatMessage[] (mode, answer, file and line references)
```

The browser keeps `job` / `repo_id` / `thread` in the URL. The inline Copilot and
the full-screen chat use the same repository ID and conversation ID.

## User flow

1. `POST /api/repo/analysis` creates a job.
2. The backend performs a real shallow clone and deterministic source scan.
3. `GET /api/repo/analysis/{job_id}` returns progress and the completed report.
4. Report actions seed the repository-scoped Copilot with an optional file context.
5. `POST /api/chat/{repo_id}` searches the same clone and streams an answer plus references.
6. Clicking a reference selects that file in the workspace explorer.

## Trust boundary

- Structural metrics and references are derived from the cloned source tree.
- When `OPENAI_API_KEY` is configured, the model receives only the selected code evidence.
- Without a model key, chat returns the grounded file matches and states that synthesis is unavailable.
- Preview mode is explicitly labelled and is never used as a silent production fallback.

## Deployment notes

- Apply `database/init.sql` to add `report_json`, model policy, refresh state, and chat tables.
- The backend requires `git` on `PATH` and write access to `CLONE_BASE_DIR`.
- Set `BACKEND_URL` for the Next.js rewrite target.
- Set `OPENAI_API_KEY` and `OPENAI_MODEL` only in server environment state.
