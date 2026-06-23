from fastapi import APIRouter
from uuid import UUID

from app.search.schemas import GrepSearchRequest, GrepSearchResponse
from app.search.service import search_grep

router = APIRouter(
    prefix="/search",
    tags=["Search"]
)

@router.post("/{repo_id}/grep", response_model=GrepSearchResponse, summary="Grep 검색")
def grep_search_endpoint(repo_id: UUID, req: GrepSearchRequest) -> GrepSearchResponse:
    """
    저장소 내 파일에서 주어진 키워드 또는 정규식으로 텍스트를 검색한다.
    결과는 최대 maxResults 개수만큼 반환된다.
    """
    data = search_grep(repo_id, req)
    return GrepSearchResponse(data=data)
