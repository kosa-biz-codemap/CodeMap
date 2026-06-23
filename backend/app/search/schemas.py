from typing import List, Optional
from pydantic import BaseModel, Field

# ──────────────────────────────────────────────
# AGENT-SEARCH-API-001 Grep 검색 스키마
# ──────────────────────────────────────────────
class GrepSearchRequest(BaseModel):
    """Grep 검색 요청 DTO"""
    pattern: str = Field(..., description="검색할 키워드 또는 정규식 패턴")
    isRegex: bool = Field(default=False, description="정규식 패턴 여부")
    fileExtensions: Optional[List[str]] = Field(default=None, description="검색 대상 파일 확장자 필터")
    maxResults: int = Field(default=20, le=500, description="반환할 최대 결과 수")


class GrepMatchResult(BaseModel):
    """개별 매칭 결과 DTO"""
    filePath: str = Field(..., description="파일 경로")
    lineNumber: int = Field(..., description="매칭 줄 번호")
    lineContent: str = Field(..., description="매칭 줄 내용")
    context: str = Field(..., description="앞뒤 3줄 컨텍스트")


class GrepSearchData(BaseModel):
    """Grep 검색 성공 응답 데이터"""
    pattern: str = Field(..., description="검색에 사용된 패턴")
    totalMatches: int = Field(..., description="전체 매칭 수")
    results: List[GrepMatchResult] = Field(..., description="검색 결과 목록")


class GrepSearchResponse(BaseModel):
    """Grep 검색 API 응답 형식"""
    code: int = 200
    message: str = "success"
    data: GrepSearchData
