from __future__ import annotations

import os
from datetime import datetime
import uuid

from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    DateTime,
    ForeignKey,
    JSON,
    Index,
    create_engine,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from pgvector.sqlalchemy import Vector

Base = declarative_base()


# ------------------------------------------------------------
# User Table
# ------------------------------------------------------------
class User(Base):
    """서비스 사용자 엔티티."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    repositories = relationship(
        "Repository",
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"


# ------------------------------------------------------------
# Repository Table
# ------------------------------------------------------------
class Repository(Base):
    """분석 대상 Git 저장소 엔티티."""

    __tablename__ = "repositories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    url = Column(Text, nullable=False)
    branch = Column(String(100), nullable=False, server_default="main")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="repositories")
    code_nodes = relationship(
        "CodeNode",
        back_populates="repository",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Repository id={self.id} url={self.url}>"


# ------------------------------------------------------------
# CodeNode Table – hierarchical tree of files/folders
# ------------------------------------------------------------
class CodeNode(Base):
    """파일 및 디렉토리 계층 구조 엔티티 (pgvector 임베딩 포함)."""

    __tablename__ = "code_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repo_id = Column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
    )
    parent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("code_nodes.id", ondelete="CASCADE"),
        nullable=True,
    )
    path = Column(Text, nullable=False)
    type = Column(String(20), nullable=False)   # 'FILE' or 'DIRECTORY'
    depth = Column(Integer, nullable=False, default=0)
    content = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    # pgvector – text-embedding-3-large 기본 차원(1536)
    embedding = Column(Vector(1536), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Relationships
    repository = relationship("Repository", back_populates="code_nodes")
    children = relationship(
        "CodeNode",
        backref="parent",
        cascade="all, delete-orphan",
        lazy="joined",
    )
    outgoing_dependencies = relationship(
        "Dependency",
        foreign_keys="Dependency.source_id",
        back_populates="source",
        cascade="all, delete-orphan",
    )
    incoming_dependencies = relationship(
        "Dependency",
        foreign_keys="Dependency.target_id",
        back_populates="target",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_code_nodes_repo_path", "repo_id", "path"),
        # HNSW 인덱스는 init.sql 에서 생성하므로 여기서는 선언하지 않음
    )

    def __repr__(self) -> str:
        return f"<CodeNode id={self.id} path={self.path}>"


# ------------------------------------------------------------
# Dependency Table – many-to-many between CodeNode entries
# ------------------------------------------------------------
class Dependency(Base):
    """파일 간 import 의존성 관계 엔티티."""

    __tablename__ = "dependencies"

    source_id = Column(
        UUID(as_uuid=True),
        ForeignKey("code_nodes.id", ondelete="CASCADE"),
        primary_key=True,
    )
    target_id = Column(
        UUID(as_uuid=True),
        ForeignKey("code_nodes.id", ondelete="CASCADE"),
        primary_key=True,
    )
    type = Column(String(50), nullable=False, server_default="import")

    # Relationships
    source = relationship(
        "CodeNode",
        foreign_keys=[source_id],
        back_populates="outgoing_dependencies",
    )
    target = relationship(
        "CodeNode",
        foreign_keys=[target_id],
        back_populates="incoming_dependencies",
    )

    __table_args__ = (Index("ix_dependencies_target", "target_id"),)

    def __repr__(self) -> str:
        return f"<Dependency {self.source_id} -> {self.target_id} type={self.type}>"


# ------------------------------------------------------------
# Engine creation helper
# ------------------------------------------------------------
def get_engine():
    """환경 변수 DATABASE_URL 로부터 SQLAlchemy 엔진을 생성합니다.

    .env 또는 환경 변수에 아래 키를 설정하세요:
        DATABASE_URL=postgresql+psycopg://user:password@host:port/dbname

    드라이버 문자열은 requirements.txt 의 psycopg(v3) 와 맞춰
    ``postgresql+psycopg://`` 형태를 사용합니다.
    """
    database_url = os.environ.get(
        "DATABASE_URL",
        "postgresql+psycopg://codemap:codemap@localhost:5432/codemap",
    )
    return create_engine(database_url, echo=False)


__all__ = ["Base", "User", "Repository", "CodeNode", "Dependency", "get_engine"]
