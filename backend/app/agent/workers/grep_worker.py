"""Grep Worker: repository regex scan adapter."""

from __future__ import annotations


import asyncio
import logging
import uuid
import regex

from app.agent.state import CodeMapState, WorkerResult
from app.tool.grep_scan import grep_repository_path

logger = logging.getLogger(__name__)


async def grep_worker(state: CodeMapState) -> dict:
    """Run a bounded grep scan for the current plan item."""
    item = state.get("_plan_item") or {}
    pattern = item.get("query", "")
    rel_path = item.get("path", "")
    clone_path = state.get("clone_path", "")

    logger.info("[GrepWorker] 시작 — pattern=%r path=%s", pattern, rel_path or ".")
    started_event = {"type": "worker_started", "worker": "grep", "target": rel_path or "."}
    
    error_category = None
    try:
        content = await asyncio.wait_for(
            asyncio.to_thread(grep_repository_path, clone_path, rel_path, pattern, raise_on_error=True),
            timeout=2.0
        )
    except TimeoutError:
        # 워커 전체 타임아웃과 grep_scan 내부 라인 타임아웃은 이 시점에서 구분 불가하며 둘 다 interrupted로 처리한다
        content = "정규식 오류: Regex execution timed out (ReDoS protection)"
        error_category = "interrupted"
    except ValueError as exc:
        content = f"정규식 오류: {exc}"
        error_category = "input_error"
    except regex.error as exc:
        content = f"정규식 오류: {exc}"
        error_category = "runtime_error"
    except Exception as exc:
        content = f"오류 발생: {exc}"
        error_category = "runtime_error"
        
    if not content:
        return {"worker_results": [], "events": [
            started_event,
            {"type": "worker_result", "worker": "grep", "resultCount": 0, "evidenceIds": []},
        ]}

    result = WorkerResult(
        id=f"ev_{uuid.uuid4().hex[:8]}",
        path=rel_path or None,
        lineStart=None,
        lineEnd=None,
        score=None,
        snippet=content,
        metadata={
            "worker": "grep",
            "tool": "grep_scan",
            "query": pattern,
            "path": rel_path,
            "errorCategory": error_category
        },
    )
    return {
        "worker_results": [result],
        "events": [
            started_event,
            {
                "type": "worker_result",
                "worker": "grep",
                "resultCount": 1,
                "evidenceIds": [result["id"]],
            },
        ],
    }

