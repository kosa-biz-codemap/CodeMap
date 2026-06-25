"""
MCP-style 외부 도구 Job 실행 서비스.
"""

from __future__ import annotations

import logging
from uuid import UUID

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# CodeMap 도구 서비스 클래스
# ──────────────────────────────────────────────
class CodeMapToolService:
    '''
    {tool_name, arguments} 기반의 JSON Job을 실행하는 MCP-style I/O 인터페이스입니다.
    '''

    # ──────────────────────────────────────────────
    # 도구 Job 실행 메서드
    # ──────────────────────────────────────────────
    async def execute_job(
        self,
        job_id: UUID,
        run_id: UUID,
        tool_name: str,
        arguments: dict,
    ) -> dict:
        '''
        Phase 2 실구현 전까지 더미 success를 반환하지 않습니다.
        '''
        logger.info(
            "[ToolService] 미구현 Job 차단 — tool=%s, run_id=%s",
            tool_name,
            run_id,
        )
        _ = arguments
        return {
            "code": 501,
            "message": "not_implemented",
            "status": "failed",
            "data": {
                "jobId": str(job_id),
                "runId": str(run_id),
                "toolName": tool_name,
            },
        }
