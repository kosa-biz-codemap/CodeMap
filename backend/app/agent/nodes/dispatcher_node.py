"""
Dispatcher Node: deterministic plan validation and worker fan-out.

The dispatcher is intentionally not an LLM agent. It enforces tool/path policy,
records the security result, and uses LangGraph Send for parallel routing.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path, PurePosixPath
from typing import TYPE_CHECKING

from langgraph.types import Send
from app.agent.state import AccessPlanItem, CodeMapState

logger = logging.getLogger(__name__)

_ALLOWED_WORKERS = frozenset({"search", "dir", "grep", "read"})

_SENSITIVE_PATTERNS = re.compile(
    r"(\.env|id_rsa|id_ed25519|\.pem|\.key|\.p12|\.pfx|secret|password|credential)",
    re.IGNORECASE,
)

_ALLOWED_EXTENSIONS = {
    ".py", ".ts", ".tsx", ".js", ".jsx", ".java", ".go", ".rs",
    ".md", ".txt", ".yaml", ".yml", ".toml", ".json", ".sh",
    ".html", ".css", ".sql", "",
}


def _is_safe_path(path: str | None, clone_root: str | None = None) -> bool:
    """Block traversal, absolute paths, sensitive files, and unsupported extensions."""
    if path is None:
        return True
    normalized = path.replace("\\", "/")
    if normalized.startswith("/") or re.match(r"^[a-zA-Z]:", normalized):
        return False
    posix_path = PurePosixPath(normalized)
    if ".." in posix_path.parts:
        return False
    if _SENSITIVE_PATTERNS.search(normalized):
        return False
    suffix = posix_path.suffix
    if suffix and suffix not in _ALLOWED_EXTENSIONS:
        return False
    if clone_root:
        root = Path(clone_root).resolve()
        candidate = (root / normalized).resolve()
        try:
            candidate.relative_to(root)
        except ValueError:
            return False
    return True


def _dedup_signature(tool: str, path: str | None, query: str | None) -> str:
    """탐색 중복 방지 키 (tool, target).

    search는 `query`, grep은 `path+query`, dir/read는 `path`가 탐색 대상이다.
    grep에서 path를 누락하면 같은 패턴을 다른 파일/디렉터리에 적용하는 탐색까지
    중복으로 오판해 검색 기능이 막히므로 target에 path를 함께 포함한다.
    """
    normalized_path = (path or "").strip().replace("\\", "/")
    normalized_query = (query or "").strip()
    if tool == "search":
        target = normalized_query
    elif tool == "grep":
        target = f"{normalized_path}\0{normalized_query}"
    else:
        target = normalized_path
    target_str = (target or "").strip().replace("\\", "/")
    return f"{tool}:{target_str}"


async def dispatcher_node(state: CodeMapState) -> dict:
    """Validate access_plan, execute worker tasks concurrently, and return combined results."""
    import asyncio
    from uuid import uuid4
    from app.agent.workers.search_worker import search_worker
    from app.agent.workers.dir_worker import dir_worker
    from app.agent.workers.grep_worker import grep_worker
    from app.agent.workers.read_worker import read_worker

    plan: list[AccessPlanItem] = state.get("access_plan", [])
    approved: list[AccessPlanItem] = []
    rejected: list[AccessPlanItem] = []

    # 이전 반복(단계)에서 이미 수행한 (tool, target) 집합 을 누적 state에서 추출.
    executed: set[str] = set(state.get("attempted_signatures") or [])
    for result in state.get("worker_results", []):
        meta = result.get("metadata") or {}
        worker = meta.get("worker")
        if worker:
            executed.add(_dedup_signature(
                worker,
                meta.get("path") or result.get("path"),
                meta.get("query"),
            ))

    seen: set[str] = set()  # 단일 plan 내 중복을 1회로 잡는 용도
    duplicates = 0

    for item in plan:
        if not _is_safe_path(item.get("path"), state.get("clone_path")):
            logger.warning(
                "[Dispatcher] 보안 위반 — 거부된 plan: tool=%s path=%s",
                item.get("tool"), item.get("path"),
            )
            rejected.append(item)
            continue

        signature = _dedup_signature(item.get("tool", "search"), item.get("path"), item.get("query"))
        if signature in executed or signature in seen:
            duplicates += 1
            logger.info(
                "[Dispatcher] 중복 탐색 스킵 : %s", signature,
            )
            continue
        seen.add(signature)
        approved.append(item)

    logger.info(
        "[Dispatcher] 검증 완료 — 승인=%d 거부=%d 중복스킵=%d",
        len(approved), len(rejected), duplicates,
    )

    # 승인된 계획에 맞춰 비동기 워커 직접 가동 (try-except 격리)
    tasks = []
    for item in approved:
        tool = item.get("tool", "search")
        worker_state = {**state, "_plan_item": item}
        if tool == "search":
            tasks.append(search_worker(worker_state))
        elif tool == "dir":
            tasks.append(dir_worker(worker_state))
        elif tool == "grep":
            tasks.append(grep_worker(worker_state))
        elif tool == "read":
            tasks.append(read_worker(worker_state))

    # 병렬 워커들 실행 및 에러 방어
    results = await asyncio.gather(*tasks, return_exceptions=True)

    aggregated_results = []
    aggregated_events = [{
        "type": "route_validated",
        "allowed": len(approved) > 0,
        "parallelGroups": [[item.get("tool", "search")] for item in approved],
        "dedupedCount": duplicates,
    }]

    for r in results:
        if isinstance(r, Exception):
            logger.error("[Dispatcher] 워커 비동기 병렬 실행 중 예외 검출: %s", r, exc_info=True)
            aggregated_results.append({
                "id": f"ev_failed_{uuid4().hex[:8]}",
                "path": None,
                "lineStart": None,
                "lineEnd": None,
                "score": None,
                "snippet": f"도구 실행 예외: {str(r)}",
                "metadata": {"worker": "dispatcher", "tool": "gather_exception"}
            })
        elif isinstance(r, dict):
            aggregated_results.extend(r.get("worker_results") or [])
            aggregated_events.extend(r.get("events") or [])

    return {
        "security_result": {"approved": approved, "rejected": rejected},
        "attempted_signatures": list(seen),
        "worker_results": aggregated_results,
        "events": aggregated_events,
    }

