"""RAG-PARSE B-204: 설정 파일 탐색.

package.json, requirements.txt, Dockerfile 등 의존성·빌드·실행·컨테이너 설정
파일을 식별해 metadata["is_config"]=True로 태깅한다.
명세: docs/03_Specifications/02_RAG/spec/RAG_PARSE_SPEC.md (B-204)

NOTE: 같은 manifest 영역의 B-205(실행 방법 추론, extract_run_commands)·
B-206(기술 스택 추론, detect_tech_stack)은 단위를 분리해 후속 PR로 이 모듈에 이어서 추가한다.
"""

from __future__ import annotations

from pathlib import Path

from app.parse.schemas import ParsedFile

# 설정/매니페스트 파일 이름 (소문자 비교 — Dockerfile/Makefile 등 대문자 대응).
_CONFIG_FILE_NAMES = {
    # JS/TS
    "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock",
    "pnpm-workspace.yaml", "tsconfig.json",
    "next.config.js", "next.config.mjs", "next.config.ts",
    "vite.config.ts", "vite.config.js",
    # Python
    "requirements.txt", "pyproject.toml", "setup.py", "setup.cfg",
    "pipfile", "pipfile.lock", "poetry.lock", "tox.ini",
    # 컨테이너 / 오케스트레이션
    "dockerfile", "docker-compose.yml", "docker-compose.yaml", ".dockerignore",
    # 환경 변수 예시 (실제 .env는 민감파일이라 directory 단계에서 content 제외)
    ".env.example", ".env.sample", ".env.template",
    # 기타 언어 / 빌드
    "go.mod", "go.sum", "cargo.toml", "cargo.lock",
    "pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle",
    "gemfile", "gemfile.lock", "composer.json", "makefile", "cmakelists.txt",
}


def _is_config_file(path: str) -> bool:
    """파일 경로가 설정/매니페스트 파일이면 True (이름 기준, 대소문자 무시)."""
    name = Path(path).name.lower()
    if name in _CONFIG_FILE_NAMES:
        return True
    # requirements*.txt 변형(requirements-dev.txt 등)도 포함
    if name.startswith("requirements") and name.endswith(".txt"):
        return True
    return False


async def tag_config_files(files: list[ParsedFile]) -> list[ParsedFile]:
    """설정 파일을 식별해 metadata['is_config']=True로 태깅한다 (RAG-PARSE-B-204).

    순수 문자열 로직이라 I/O는 없지만, PARSE 파이프라인 단계 일관성과 테스트
    계약(await tag_config_files(...))을 위해 async로 유지한다(find_entry_points와 정합).
    입력을 in-place로 변경하지 않고 새 객체(model_copy)를 반환한다.
    """
    result: list[ParsedFile] = []
    for node in files:
        if node.file_type == "FILE" and _is_config_file(node.path):
            metadata = {**(node.metadata or {}), "is_config": True}
            result.append(node.model_copy(update={"metadata": metadata}))
        else:
            result.append(node)
    return result
