"""Source language composition for RAG-PARSE stack views.

This module answers a different question from B-206 tech stack detection:
tech stack says "what technologies are present", while language composition
says "how many source lines are written in each language/config type".
"""

from __future__ import annotations

from collections import Counter
from pathlib import Path

from app.parse.schemas import ParsedFile

_LANGUAGE_BY_EXT = {
    ".py": "Python",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".mjs": "JavaScript",
    ".cjs": "JavaScript",
    ".java": "Java",
    ".kt": "Kotlin",
    ".kts": "Kotlin",
    ".go": "Go",
    ".rs": "Rust",
    ".rb": "Ruby",
    ".php": "PHP",
    ".cs": "C#",
    ".c": "C",
    ".h": "C/C++",
    ".cc": "C++",
    ".cpp": "C++",
    ".hpp": "C++",
    ".swift": "Swift",
    ".scala": "Scala",
    ".dart": "Dart",
    ".vue": "Vue",
    ".svelte": "Svelte",
    ".sql": "SQL",
    ".sh": "Shell",
    ".bash": "Shell",
    ".zsh": "Shell",
    ".md": "Markdown",
    ".mdx": "Markdown",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "CSS",
    ".sass": "CSS",
    ".json": "Config",
    ".toml": "Config",
    ".ini": "Config",
    ".cfg": "Config",
    ".conf": "Config",
    ".xml": "Config",
    ".properties": "Config",
    ".env": "Config",
    ".example": "Config",
    ".yml": "YAML",
    ".yaml": "YAML",
}
_CONFIG_FILE_NAMES = {
    "dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    "package.json",
    "tsconfig.json",
    "pyproject.toml",
    "requirements.txt",
    "go.mod",
    "go.sum",
    "cargo.toml",
    "cargo.lock",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "settings.gradle",
    "gemfile",
    "gemfile.lock",
    "composer.json",
    "makefile",
}


def _line_count(content: str | None) -> int:
    """Count visible source lines from ParsedFile.content."""
    if not content:
        return 0
    return len(content.splitlines()) or 1


def _language_for_path(path: str) -> str:
    name = Path(path).name.lower()
    if name in _CONFIG_FILE_NAMES:
        return "Config"
    return _LANGUAGE_BY_EXT.get(Path(path).suffix.lower(), "Other")


def analyze_language_composition(files: list[ParsedFile]) -> list[dict[str, int | float | str]]:
    """Return language/config line distribution sorted by source line count."""
    lines_by_language: Counter[str] = Counter()
    for node in files:
        if node.file_type != "FILE":
            continue
        lines = _line_count(node.content)
        if lines <= 0:
            continue
        language = node.language or _language_for_path(node.path)
        lines_by_language[language] += lines

    total_lines = sum(lines_by_language.values())
    if total_lines <= 0:
        return []

    return [
        {
            "language": language,
            "lines": lines,
            "percentage": round((lines / total_lines) * 100, 1),
        }
        for language, lines in lines_by_language.most_common()
    ]
