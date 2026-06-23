import os
import re
import collections
from uuid import UUID
from typing import List

from app.core.config import get_settings
from app.core.exceptions import (
    InvalidPatternError,
    TargetFileNotFoundError,
)
from app.search.schemas import (
    GrepSearchRequest,
    GrepMatchResult,
    GrepSearchData,
)

settings = get_settings()

# 탐색에서 제외할 대용량/바이너리 디렉토리
EXCLUDE_DIRS = {".git", "node_modules", "venv", ".venv", "__pycache__", "build", "dist", ".idea", ".vscode"}
# 최대 파일 크기 (5MB) - 탐색 대상 제외
MAX_FILE_SIZE = 5 * 1024 * 1024

def search_grep(repo_id: UUID, req: GrepSearchRequest) -> GrepSearchData:
    """
    저장소 내 파일에서 키워드 또는 정규식을 탐색한다.
    명령어 삽입을 막기 위해 순수 Python 기반 스트리밍으로 탐색한다.
    """
    base_dir = os.path.realpath(os.path.join(settings.CLONE_BASE_DIR, str(repo_id), "repo"))
    if not os.path.exists(base_dir):
        raise TargetFileNotFoundError("저장소 디렉토리를 찾을 수 없습니다.")
        
    # 정규식 패턴 컴파일
    try:
        if req.isRegex:
            pattern_obj = re.compile(req.pattern)
        else:
            escaped = re.escape(req.pattern)
            pattern_obj = re.compile(escaped)
    except re.error:
        raise InvalidPatternError("정규식 패턴 문법이 잘못되었습니다.")

    results: List[GrepMatchResult] = []
    total_matches = 0
    
    # 디렉토리 순회 (동기, 단일 스레드)
    for root, dirs, files in os.walk(base_dir):
        # Pruning: 제외 폴더는 하위 탐색 생략
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file_name in files:
            # 확장자 필터
            if req.fileExtensions:
                ext = os.path.splitext(file_name)[1].lstrip('.')
                if ext not in req.fileExtensions:
                    continue
                    
            file_path = os.path.join(root, file_name)
            
            # 용량 필터 (5MB 초과 파일 무시)
            try:
                if os.path.getsize(file_path) > MAX_FILE_SIZE:
                    continue
            except OSError:
                continue

            rel_path = os.path.relpath(file_path, base_dir).replace("\\", "/")
            
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    context_queue = collections.deque(maxlen=3)
                    pending_matches = []
                    
                    for line_idx, line in enumerate(f, start=1):
                        line_str = line.rstrip('\n\r')
                        
                        # Pending된 매치 처리
                        for pm in pending_matches:
                            if pm['after_needed'] > 0:
                                pm['after'].append(line_str)
                                pm['after_needed'] -= 1
                                
                        # 완료된 매치 추출
                        while pending_matches and pending_matches[0]['after_needed'] == 0:
                            pm = pending_matches.pop(0)
                            ctx_lines = list(pm['before']) + [pm['line_str']] + pm['after']
                            full_context = "\n".join(ctx_lines)
                            
                            results.append(GrepMatchResult(
                                filePath=rel_path,
                                lineNumber=pm['line_idx'],
                                lineContent=pm['line_str'],
                                context=full_context
                            ))
                            total_matches += 1
                            
                            if total_matches >= req.maxResults:
                                return GrepSearchData(
                                    pattern=req.pattern,
                                    totalMatches=total_matches,
                                    results=results
                                )
                                
                        # 현재 라인 매칭 검사
                        if pattern_obj.search(line_str):
                            pending_matches.append({
                                'line_idx': line_idx,
                                'line_str': line_str,
                                'before': list(context_queue),
                                'after_needed': 3,
                                'after': []
                            })
                            
                        context_queue.append(line_str)

                    # 파일 끝에 도달하여 마무리되지 않은 매치 처리
                    for pm in pending_matches:
                        ctx_lines = list(pm['before']) + [pm['line_str']] + pm['after']
                        full_context = "\n".join(ctx_lines)
                        results.append(GrepMatchResult(
                            filePath=rel_path,
                            lineNumber=pm['line_idx'],
                            lineContent=pm['line_str'],
                            context=full_context
                        ))
                        total_matches += 1
                        if total_matches >= req.maxResults:
                            return GrepSearchData(
                                pattern=req.pattern,
                                totalMatches=total_matches,
                                results=results
                            )
            except Exception:
                continue

    return GrepSearchData(
        pattern=req.pattern,
        totalMatches=total_matches,
        results=results
    )
