from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class EmbedRequest(BaseModel):
    model: str = Field(default="auto", description="분석 모델 정책")
    dimensions: int = Field(default=1536, description="임베딩 차원수")
    forceReembed: bool = Field(default=False, description="기존 청크 무시하고 새로 재임베딩 여부")


class EmbedStatusResponse(BaseModel):
    repoId: UUID = Field(..., description="프로젝트 (Job) ID")
    status: str = Field(..., description="현재 임베딩 작업 상태")
    totalChunks: int = Field(default=0, description="파싱된 총 청크 수")
    embeddedChunks: int = Field(default=0, description="벡터화 완료된 청크 수")
    model: str = Field(..., description="사용된 임베딩 모델")
    dimensions: int = Field(default=1536, description="임베딩 차원수")
    completedAt: Optional[datetime] = Field(default=None, description="완료 시간")


class ChunkInput(BaseModel):
    """내부 서비스 로직에서 청크 데이터를 주고받기 위한 DTO"""
    file_id: UUID
    content: str
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    symbol: Optional[str] = None
    language: Optional[str] = None
