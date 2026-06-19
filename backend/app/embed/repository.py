from typing import Sequence
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.embed.models import CodeChunk, SourceFile


class EmbedRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def upsert_source_file(self, repo_id: UUID, file_path: str, raw_code: str) -> UUID:
        stmt = select(SourceFile).where(
            SourceFile.repo_id == repo_id, SourceFile.file_path == file_path
        )
        result = await self.session.execute(stmt)
        source_file = result.scalar_one_or_none()

        if source_file:
            source_file.raw_code = raw_code
        else:
            source_file = SourceFile(
                repo_id=repo_id, file_path=file_path, raw_code=raw_code
            )
            self.session.add(source_file)
        
        await self.session.flush()
        return source_file.id

    async def save_chunks_batch(self, chunks: list[dict]) -> int:
        if not chunks:
            return 0
        
        # bulk_insert_mappings 등도 가능하지만, 단순 add_all 사용
        db_chunks = [CodeChunk(**chunk_data) for chunk_data in chunks]
        self.session.add_all(db_chunks)
        await self.session.flush()
        return len(db_chunks)

    async def delete_chunks_by_file_id(self, file_id: UUID) -> None:
        stmt = delete(CodeChunk).where(CodeChunk.file_id == file_id)
        await self.session.execute(stmt)

    async def delete_source_files_by_repo_id(self, repo_id: UUID) -> None:
        stmt = delete(SourceFile).where(SourceFile.repo_id == repo_id)
        await self.session.execute(stmt)

    async def get_embed_status(self, repo_id: UUID) -> dict:
        # TODO: 상태 집계 로직
        # 현재는 SourceFile과 연결된 CodeChunk의 수를 집계
        stmt = select(CodeChunk).join(SourceFile).where(SourceFile.repo_id == repo_id)
        result = await self.session.execute(stmt)
        chunks = result.scalars().all()

        total = len(chunks)
        embedded = sum(1 for c in chunks if c.embedding_vector is not None)

        return {
            "total_chunks": total,
            "embedded_chunks": embedded
        }
