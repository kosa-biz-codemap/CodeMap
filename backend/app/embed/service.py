import logging
import os
from pathlib import Path
from typing import Optional
from uuid import UUID

from langchain_openai import OpenAIEmbeddings
from sqlalchemy.ext.asyncio import AsyncSession
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings
from app.embed.repository import EmbedRepository
from app.parse.service import ParseService

logger = logging.getLogger(__name__)
settings = get_settings()

class EmbedService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = EmbedRepository(session)
        self.parse_service = ParseService()

    @retry(
        stop=stop_after_attempt(settings.EMBEDDING_MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def generate_embeddings_batch(self, texts: list[str]) -> list[list[float]]:
        """Tenacity를 이용한 지수 백오프 재시도가 포함된 배치 임베딩 생성"""
        if not settings.OPENAI_API_KEY.get_secret_value():
            return [None] * len(texts)  # API 키 없으면 폴백 (임베딩 없이 저장)

        embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            api_key=settings.OPENAI_API_KEY,
            dimensions=settings.EMBEDDING_DIMENSIONS,
        )
        # aembed_documents는 비동기로 배치 처리를 지원함
        return await embeddings.aembed_documents(texts)

    def _is_target_file(self, file_path: str) -> bool:
        """분석 대상 파일인지 필터링"""
        ext = os.path.splitext(file_path)[1].lower()
        valid_exts = {
            ".py", ".ts", ".tsx", ".js", ".jsx", ".java", ".go", 
            ".md", ".mdx", ".yaml", ".yml", ".json", ".toml"
        }
        return ext in valid_exts

    async def embed_repository(self, repo_id: UUID, clone_path: str, force_reembed: bool = False) -> dict:
        """저장소 전체 코드를 청킹하고 임베딩하여 벡터 DB에 저장"""
        root_dir = Path(clone_path)
        if not root_dir.exists():
            raise ValueError(f"저장소 경로를 찾을 수 없습니다: {clone_path}")

        # 기존 데이터 삭제 처리 (force_reembed 시연용 또는 초기 멱등성 보장용)
        # 여기서는 job 단위가 아닌 repo 단위로 생각하여 파일들을 덮어쓰거나 지움.
        # 실제 구현은 파이프라인에서 호출되므로 매번 전체 삭제/재생성.
        await self.repository.delete_source_files_by_repo_id(repo_id)

        all_chunks_to_insert = []
        total_chunks = 0
        embedded_chunks_count = 0

        # 1. 파일 시스템 순회 및 청킹
        for root, dirs, files in os.walk(root_dir):
            # .git 같은 숨김 폴더 제외
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for file in files:
                if file.startswith('.'):
                    continue
                
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, str(root_dir))
                
                if not self._is_target_file(rel_path):
                    continue
                
                if os.path.getsize(file_path) > 500 * 1024:
                    logger.warning("파일 크기 초과 스킵: %s", rel_path)
                    continue

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                except UnicodeDecodeError:
                    continue  # 바이너리 파일 스킵

                # SourceFile 레코드 생성
                file_id = await self.repository.upsert_source_file(repo_id, rel_path, content)

                # 파싱 및 청킹
                lang = self.parse_service.get_language(rel_path)
                chunks = self.parse_service.chunk_file(rel_path, content, lang)
                
                for chunk in chunks:
                    chunk["file_id"] = file_id
                    # ChunkInput DTO로 변환하여 내부 데이터 규격화
                    all_chunks_to_insert.append(chunk)

        # 2. 배치로 임베딩 생성 및 저장
        batch_size = settings.EMBEDDING_BATCH_SIZE
        for i in range(0, len(all_chunks_to_insert), batch_size):
            batch = all_chunks_to_insert[i:i + batch_size]
            texts_to_embed = [c["content"] for c in batch]
            
            try:
                vectors = await self.generate_embeddings_batch(texts_to_embed)
            except Exception as exc:
                logger.exception("임베딩 생성 중 예외 발생, 폴백(None) 처리합니다: %s", exc)
                vectors = [None] * len(batch)

            db_chunks_batch = []
            for chunk, vector in zip(batch, vectors):
                db_chunks_batch.append({
                    "file_id": chunk["file_id"],
                    "chunk_summary": chunk["content"][:200], # 향후 요약 기능으로 대체 가능
                    "embedding_vector": vector,
                    "start_line": chunk["start_line"],
                    "end_line": chunk["end_line"],
                    "symbol": chunk["symbol"],
                    "language": chunk["language"]
                })
                if vector is not None:
                    embedded_chunks_count += 1
            
            await self.repository.save_chunks_batch(db_chunks_batch)
            total_chunks += len(db_chunks_batch)

        return {
            "total_chunks": total_chunks,
            "embedded_chunks": embedded_chunks_count,
            "model": settings.EMBEDDING_MODEL if settings.OPENAI_API_KEY.get_secret_value() else "fallback_none",
            "dimensions": settings.EMBEDDING_DIMENSIONS
        }

    async def get_status(self, repo_id: UUID) -> dict:
        return await self.repository.get_embed_status(repo_id)
