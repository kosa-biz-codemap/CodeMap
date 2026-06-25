"""Directory scanning tool used by LangGraph workers and future MCP jobs."""

from __future__ import annotations

import os
from pathlib import Path

_MAX_TREE_LINES = 200


def scan_directory_tree(clone_path: str, rel_path: str | None) -> str:
    """Return a bounded text tree for a repository-relative directory."""
    target = (Path(clone_path) / (rel_path or "")).resolve()
    root = Path(clone_path).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        return ""

    lines: list[str] = []
    try:
        for current_root, dirs, files in os.walk(target):
            dirs[:] = [d for d in dirs if not d.startswith(".") and d != "__pycache__"]
            depth = len(Path(current_root).relative_to(target).parts)
            indent = "  " * depth
            lines.append(f"{indent}{Path(current_root).name}/")
            for file_name in sorted(files):
                lines.append(f"{indent}  {file_name}")
            if len(lines) > _MAX_TREE_LINES:
                lines.append("... (truncated)")
                break
    except Exception as exc:
        return f"탐색 실패: {exc}"

    return "\n".join(lines)
