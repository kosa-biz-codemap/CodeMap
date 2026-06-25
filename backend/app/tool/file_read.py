"""Repository-bounded file read tool used by workers and future MCP jobs."""

from __future__ import annotations

from pathlib import Path

_MAX_FILE_SIZE = 50_000


def read_repository_file(clone_path: str, rel_path: str | None) -> str:
    """Read a bounded repository-relative file as UTF-8 text."""
    target = (Path(clone_path) / (rel_path or "")).resolve()
    root = Path(clone_path).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        return ""

    try:
        text = target.read_text(encoding="utf-8", errors="ignore")
        if len(text) > _MAX_FILE_SIZE:
            text = text[:_MAX_FILE_SIZE] + f"\n... (파일 크기 초과, {_MAX_FILE_SIZE}자까지만 표시)"
        return text
    except Exception as exc:
        return f"파일 읽기 실패: {exc}"
