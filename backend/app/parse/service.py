"""RAG-PARSE 서비스 진입점.

각 기능은 app/parse/<module>.py에 구현하고 여기서 re-export한다.
(테스트가 app.parse.service 기준으로 함수를 참조/patch하므로 모듈 속성으로 노출해야 한다.)

작업 단위별로 아래 import에 한 줄씩 추가된다:
  directory : analyze_directory, find_entry_points         (B-202/203)  ← 구현됨
  manifest  : tag_config_files, extract_run_commands, extract_run_command_details,
              detect_tech_stack (B-204/205/206)
  readme    : parse_readme                                  (B-201)
  chunking  : chunk_by_ast                                  (B-207)
  imports   : analyze_imports                               (B-208)
  codemap   : build_file_map, build_heatmap                  (API-005)
  summary   : build_hierarchical_summary, build_file_summaries,
              build_folder_summaries, run_structure_agent (B-209/210)
  run_parse_pipeline : 오케스트레이터                        (통합)
"""

from uuid import UUID

from app.parse.directory import analyze_directory, find_entry_points
from app.parse.chunking import chunk_by_ast
from app.parse.manifest import (
    tag_config_files,
    extract_run_commands,
    extract_run_command_details,
    detect_tech_stack,
    detect_tech_stack_details,
)
from app.parse.imports import analyze_imports
from app.parse.codemap import build_file_map, build_heatmap
from app.parse.readme import parse_readme
from app.parse.language import analyze_language_composition
from app.parse.summary import (
    build_file_summaries,
    build_folder_summaries,
    build_hierarchical_summary,
)
from app.parse.schemas import ParseResult, ParsedFile


def _directory_tree(files: list[ParsedFile], repo_name: str) -> str:
    paths = sorted(node.path for node in files)
    lines = [repo_name]
    for path in paths:
        depth = path.count("/")
        lines.append(f"{'  ' * depth}- {path.rsplit('/', 1)[-1]}")
    return "\n".join(lines)


async def run_structure_agent(files: list[ParsedFile]) -> list[ParsedFile]:
    """B-210 구조 분석 agent hook.

    현재는 앞선 deterministic parse 단계들이 이미 채운 ParsedFile 목록을 그대로
    반환한다. 추후 LLM 기반 구조 agent가 필요해지면 이 함수 안에서만 교체한다.
    """
    return files


async def run_parse_pipeline(
    *,
    job_id: UUID,
    repo_name: str,
    owner: str,
    branch: str,
    clone_path: str,
) -> ParseResult:
    """RAG-PARSE B-210 통합 파이프라인을 실행해 ParseResult를 반환한다."""
    readme_summary = await parse_readme(clone_path)
    files = await analyze_directory(clone_path)
    entry_points = await find_entry_points(files)
    files = await tag_config_files(files)

    run_commands = await extract_run_commands(files)
    run_command_details = await extract_run_command_details(files)
    tech_stack = await detect_tech_stack(files)

    files = await chunk_by_ast(files)
    files = await analyze_imports(files)
    files = await run_structure_agent(files)

    files, master_summary = await build_hierarchical_summary(files)
    file_map = await build_file_map(files)
    heatmap = await build_heatmap(files)
    file_summaries = await build_file_summaries(files)
    folder_summaries = await build_folder_summaries(files)
    config_files = [
        node.path
        for node in files
        if node.file_type == "FILE" and (node.metadata or {}).get("is_config")
    ]

    return ParseResult(
        job_id=job_id,
        repo_name=repo_name,
        owner=owner,
        branch=branch,
        readme_summary=readme_summary,
        tech_stack=tech_stack,
        run_commands=run_commands,
        run_command_details=run_command_details,
        entry_points=entry_points,
        config_files=config_files,
        master_summary=master_summary,
        folder_summaries=folder_summaries,
        file_summaries=file_summaries,
        file_map=file_map,
        heatmap=heatmap,
        directory_tree=_directory_tree(files, repo_name),
        files=files,
    )

__all__ = [
    "analyze_directory",
    "find_entry_points",
    "chunk_by_ast",
    "tag_config_files",
    "extract_run_commands",
    "extract_run_command_details",
    "detect_tech_stack",
    "detect_tech_stack_details",
    "analyze_imports",
    "build_file_map",
    "build_heatmap",
    "parse_readme",
    "analyze_language_composition",
    "build_file_summaries",
    "build_folder_summaries",
    "build_hierarchical_summary",
    "run_structure_agent",
    "run_parse_pipeline",
]
