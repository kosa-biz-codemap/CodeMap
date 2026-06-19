from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SourceFile(Base):
    __tablename__ = "source_files"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    repo_id: Mapped[UUID] = mapped_column(nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    raw_code: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    chunks: Mapped[list["CodeChunk"]] = relationship(
        "CodeChunk", back_populates="source_file", cascade="all, delete-orphan"
    )


class CodeChunk(Base):
    __tablename__ = "code_chunks"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    file_id: Mapped[UUID] = mapped_column(
        ForeignKey("source_files.id", ondelete="CASCADE"), nullable=False
    )
    chunk_summary: Mapped[str] = mapped_column(Text, nullable=False)
    embedding_vector = mapped_column(Vector(1536), nullable=True)
    start_line: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    end_line: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    symbol: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    source_file: Mapped["SourceFile"] = relationship(
        "SourceFile", back_populates="chunks"
    )
