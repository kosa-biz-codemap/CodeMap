"""Grep Worker: repository regex scan adapter."""

from __future__ import annotations

import logging
import uuid

from app.agent.state import CodeMapState, WorkerResult
from app.tool.grep_scan import grep_repository_path

logger = logging.getLogger(__name__)


async def grep_worker(state: CodeMapState) -> dict:
    """Run a bounded grep scan for the current plan item."""
    item = state.get("_plan_item", {})
    pattern = item.get("query", "")
    rel_path = item.get("path", "")
    clone_path = state.get("clone_path", "")

    logger.info("[GrepWorker] 시작 — pattern=%r path=%s", pattern, rel_path or ".")
    content = grep_repository_path(clone_path, rel_path, pattern)
    if not content:
        return {"worker_results": [], "events": []}

    result = WorkerResult(
        id=f"ev_{uuid.uuid4().hex[:8]}",
        path=rel_path or None,
        lineStart=None,
        lineEnd=None,
        score=None,
        snippet=content,
        metadata={"worker": "grep", "tool": "grep_scan", "query": pattern},
    )
    return {
        "worker_results": [result],
        "events": [{
            "type": "worker_result",
            "worker": "grep",
            "resultCount": 1,
            "evidenceIds": [result["id"]],
        }],
    }
