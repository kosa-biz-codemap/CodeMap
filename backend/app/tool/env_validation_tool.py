"""매니페스트 및 인프라 설정 검증 도구."""

from __future__ import annotations

import json
from pathlib import Path
import re


def calculate_env_validation(clone_path: str, rel_path: str | None = None) -> dict[str, int]:
    """매니페스트 및 인프라 설정 검증을 통한 보안 및 품질 점수 계산"""
    target = (Path(clone_path) / (rel_path or "")).resolve()
    root = Path(clone_path).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        return {"security": 50, "quality": 50}

    security_score = 100
    quality_score = 100

    candidates = [target] if target.is_file() else target.rglob("*")

    has_docker = False
    has_env_example = False
    has_readme = False
    has_ci_cd = False
    has_dependency_lock = False
    hardcoded_secrets_penalty = 0

    secret_pattern = re.compile(r"(?i)(password|secret|api[_\-]?key|token)\s*[:=]\s*['\"][^'\"]+['\"]")

    for file_path in candidates:
        if not file_path.is_file():
            continue
        
        name = file_path.name.lower()
        parts = file_path.parts

        if "dockerfile" in name or name in ("docker-compose.yml", "docker-compose.yaml"):
            has_docker = True
            
        if name == ".env.example":
            has_env_example = True
            
        if name == "readme.md":
            has_readme = True
            
        if ".github" in parts or ".gitlab-ci.yml" in name or "jenkinsfile" in name:
            has_ci_cd = True
            
        if name in ("package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock", "pipfile.lock", "gemfile.lock"):
            has_dependency_lock = True

        # Check for hardcoded secrets
        if file_path.suffix in (".py", ".js", ".ts", ".json", ".yml", ".yaml"):
            try:
                text = file_path.read_text(encoding="utf-8", errors="ignore")
                if secret_pattern.search(text):
                    hardcoded_secrets_penalty += 10
            except Exception:
                pass

    if not has_docker:
        quality_score -= 10
    if not has_env_example:
        security_score -= 15
        quality_score -= 5
    if not has_readme:
        quality_score -= 10
    if not has_ci_cd:
        quality_score -= 15
    if not has_dependency_lock:
        security_score -= 10
        quality_score -= 10

    security_score -= hardcoded_secrets_penalty

    return {
        "security": max(0, min(100, security_score)),
        "quality": max(0, min(100, quality_score))
    }

def analyze_env_validation(clone_path: str, rel_path: str | None = None) -> str:
    """MCP Job 반환용 텍스트 포맷팅"""
    metrics = calculate_env_validation(clone_path, rel_path)
    return f"Security Score: {metrics['security']}\nQuality Score: {metrics['quality']}"
