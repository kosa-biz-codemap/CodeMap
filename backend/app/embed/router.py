from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.embed.schemas import EmbedRequest, EmbedStatusResponse
from app.embed.service import EmbedService

router = APIRouter(prefix="/api/embed", tags=["embed"])

@router.post("/analysis/{repo_id}", status_code=status.HTTP_202_ACCEPTED)
async def request_embedding(
    repo_id: UUID,
    request: EmbedRequest,
    db: AsyncSession = Depends(get_db)
):
    """(수동 트리거용 API)
    주어진 저장소의 복제본을 이용해 코드를 청킹하고 벡터 임베딩을 비동기 생성합니다.
    실제 서비스에서는 Pipeline 단계에서 자동으로 실행됩니다.
    """
    # 파이프라인 외부 트리거용이지만 구현은 생략하고 202만 반환
    return {"message": "임베딩 백그라운드 작업이 시작되었습니다."}

@router.get("/analysis/{repo_id}/status", response_model=EmbedStatusResponse)
async def get_embed_status(
    repo_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """해당 저장소의 임베딩 작업 진행 상태를 반환합니다."""
    service = EmbedService(db)
    stats = await service.get_status(repo_id)
    
    return EmbedStatusResponse(
        repoId=repo_id,
        status="COMPLETED" if stats["total_chunks"] > 0 else "PENDING",
        totalChunks=stats["total_chunks"],
        embeddedChunks=stats["embedded_chunks"],
        model="auto",
        dimensions=1536,
        completedAt=datetime.utcnow() if stats["total_chunks"] > 0 else None
    )
