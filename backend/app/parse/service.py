import os
from typing import Optional

from app.embed.schemas import ChunkInput


class ParseService:
    """텍스트 기반 파일 파싱 및 청킹 서비스 (AST 적용 전 MVP 버전)"""

    def get_language(self, file_path: str) -> Optional[str]:
        ext = os.path.splitext(file_path)[1].lower()
        ext_map = {
            ".py": "python",
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".java": "java",
            ".go": "go",
            ".md": "markdown",
            ".mdx": "markdown",
            ".yml": "yaml",
            ".yaml": "yaml",
            ".json": "json",
            ".html": "html",
            ".css": "css",
            ".sql": "sql",
        }
        return ext_map.get(ext)

    def chunk_file(self, file_path: str, content: str, language: Optional[str]) -> list[dict]:
        """간단한 텍스트 기반 라인 청킹 (512 토큰 기준 근사치, 오버랩 50줄)"""
        lines = content.splitlines(keepends=True)
        chunks = []
        
        # 임의의 기준: 1줄당 약 10토큰이라 가정하여 50줄 단위로 청킹, 10줄 오버랩
        chunk_size_lines = 50
        overlap_lines = 10
        
        if not lines:
            return chunks

        start_idx = 0
        while start_idx < len(lines):
            end_idx = min(start_idx + chunk_size_lines, len(lines))
            chunk_content = "".join(lines[start_idx:end_idx])
            
            # TODO: uuid4 기반 file_id는 호출측에서 주입
            chunks.append({
                "content": chunk_content,
                "start_line": start_idx + 1,
                "end_line": end_idx,
                "symbol": None, # AST 적용 전에는 알 수 없음
                "language": language
            })
            
            if end_idx == len(lines):
                break
                
            start_idx += (chunk_size_lines - overlap_lines)

        return chunks
