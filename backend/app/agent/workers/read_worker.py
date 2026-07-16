"""Read Worker: repository file read adapter."""

from __future__ import annotations

import asyncio
import logging
import uuid

from app.agent.state import CodeMapState, WorkerResult
from app.tool.file_read import read_repository_file

logger = logging.getLogger(__name__)


async def read_worker(state: CodeMapState) -> dict:
    """Read a bounded repository file for the current plan item."""
    item = state.get("_plan_item") or {}
    rel_path = item.get("path", "")
    clone_path = state.get("clone_path", "")

    logger.info("[ReadWorker] 시작 — path=%s", rel_path)
    started_event = {"type": "worker_started", "worker": "read", "target": rel_path or "."}
    
    error_category = None
    try:
        content = await asyncio.wait_for(
            asyncio.to_thread(read_repository_file, clone_path, rel_path, raise_on_error=True),
            timeout=2.0
        )
    except TimeoutError:
        content = "파일 읽기 오류: Execution timed out"
        error_category = "interrupted"
    except Exception as exc:
        content = f"파일 읽기 실패: {exc}"
        error_category = "runtime_error"
        
    if not content:
        return {"worker_results": [], "events": [
            started_event,
            {"type": "worker_result", "worker": "read", "resultCount": 0, "evidenceIds": []},
        ]}

    result = WorkerResult(
        id=f"ev_{uuid.uuid4().hex[:8]}",
        path=rel_path or None,
        lineStart=None,
        lineEnd=None,
        score=None,
        snippet=content,
        metadata={
            "worker": "read",
            "tool": "file_read",
            "query": rel_path,
            "errorCategory": error_category
        },
    )
    return {
        "worker_results": [result],
        "events": [
            started_event,
            {
                "type": "worker_result",
                "worker": "read",
                "resultCount": 1,
                "evidenceIds": [result["id"]],
            },
        ],
    }

