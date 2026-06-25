"""
외부 MCP 신호 수신 및 도구 Job 실행을 위한 API 라우터 (Phase 2).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.infra.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tools", tags=["tools"])


class ToolExecuteRequest(BaseModel):
    tool_name: str
    arguments: dict
    job_id: str | None = None
    run_id: str | None = None


# ──────────────────────────────────────────────
# MCP 도구 Job 실행 엔드포인트
# ──────────────────────────────────────────────
@router.post("/execute", status_code=501)
async def execute_tool_job(
    request: ToolExecuteRequest,
    db: AsyncSession = Depends(get_db),
):
    '''
    외부 혹은 에이전트로부터 요청받은 MCP 표준 I/O 도구 실행 요청을 처리합니다.
    (Phase 2 실구현 연결 전까지 501/failed만 반환)
    '''
    _ = db
    logger.info(
        "[ToolRouter] 미구현 실행 요청 차단 — tool=%s, job_id=%s",
        request.tool_name,
        request.job_id,
    )

    return {
        "code": 501,
        "message": "not_implemented",
        "status": "failed",
        "data": {
            "toolName": request.tool_name,
            "jobId": request.job_id,
            "runId": request.run_id,
        },
    }
