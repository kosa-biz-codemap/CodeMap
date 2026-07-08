# RAG EMBED 기능 명세서

> **도메인**: RAG | **모듈**: RAG-EMBED | **최종 업데이트**: 2026-06-19


## 전체 기능 요약

| 기능 ID | 기능명 | 계층 | Phase |
| --- | --- | --- | --- |
| RAG-EMBED-B-201 | 임베딩 생성 | Backend | Phase 1 |
| RAG-EMBED-B-301 | pgvector 저장 | Backend | Phase 1 |

---

## Phase 1

### RAG-EMBED-B-201: 임베딩 생성

| 항목 | 내용 |
| --- | --- |
| 분류 | Backend |
| 모듈명 | EMBED |

**설명**

코드 및 문서를 벡터화. 파싱된 청크 텍스트를 OpenAI `text-embedding-3-large` 모델로 임베딩 벡터 생성. 배치 API 호출로 비용 최적화.

**구현 노트**

- 모델: `text-embedding-3-large` + `dimensions=1536`
  - large 모델의 다국어(한국어↔영어) 검색 강점 유지
  - 1536차원으로 저장 용량·pgvector HNSW 인덱스 호환성 확보
  - 결정 근거: [`docs/04_Decisions/EMBEDDING_MODEL_DECISION.md`](../../../../04_Decisions/EMBEDDING_MODEL_DECISION.md)
- 구현 방식: LangChain `OpenAIEmbeddings` wrapper 사용 (`langchain-openai` 패키지)
  ```python
  from langchain_openai import OpenAIEmbeddings

  embeddings = OpenAIEmbeddings(
      model="text-embedding-3-large",
      dimensions=1536,  # 마트료시카 축소 파라미터
  )
  ```
- 배치 크기: 100개 청크 (환경변수 `EMBEDDING_BATCH_SIZE`로 제어)
- API 호출 실패 시 지수 백오프 재시도 (최대 3회, `tenacity` 라이브러리 사용)
  - 1회 실패 → 1초 대기, 2회 실패 → 2초 대기, 3회 실패 → 4초 대기
- 환경변수: `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`, `EMBEDDING_BATCH_SIZE`, `EMBEDDING_MAX_RETRIES` (`infra/config.py` 관리)


### RAG-EMBED-B-301: pgvector 저장

| 항목 | 내용 |
| --- | --- |
| 분류 | Backend |
| 모듈명 | EMBED |

**설명**

임베딩 및 메타데이터 저장. 생성된 임베딩 벡터를 pgvector(PostgreSQL 확장)에 저장. 메타데이터(파일명, 라인, 언어, 심볼명)와 함께 저장.

**구현 노트**

- pgvector extension 활성화 (`CREATE EXTENSION IF NOT EXISTS vector`)
- `source_files` 테이블: `id`, `repo_id`, `file_path`, `raw_code`, `file_summary`
- `code_chunks` 테이블:

  | 컬럼 | 타입 | 설명 |
  | --- | --- | --- |
  | `id` | UUID | 청크 고유 ID |
  | `file_id` | UUID (FK) | `source_files.id` 참조 |
  | `chunk_summary` | TEXT | 청크 텍스트 (임베딩 대상 원문) |
  | `embedding_vector` | vector(1536) | OpenAI 임베딩 벡터 |
  | `start_line` | INTEGER | AST 청킹 시작 라인 (RAG-PARSE-B-207) |
  | `end_line` | INTEGER | AST 청킹 종료 라인 |
  | `symbol` | VARCHAR(255) | 함수/클래스/모듈 심볼명 (검색 필터링용) |
  | `language` | VARCHAR(50) | 프로그래밍 언어 (python, javascript 등) |
  | `created_at` | TIMESTAMPTZ | 생성 시각 |

- 인덱스 타입: **HNSW** (cosine similarity)
  - IVFFlat 대비 빠른 빌드 시간, 증분 삽입 지원, 1536차원에서 안정적 성능
  - `CREATE INDEX USING hnsw (embedding_vector vector_cosine_ops)`
  - 추가 인덱스: `idx_code_chunks_file_id` (file_id 기반 조회), `idx_code_chunks_language` (언어 필터)
- 배치 upsert로 성능 최적화 (100개 단위)
- `forceReembed=true` 시 기존 청크 삭제 후 재삽입

---

### 📅 [2026-07-07] 프로젝트 종료 후 유지보수 단계 규칙 변경

> **적용 배경**: 공식 프로젝트 개발 기간 종료에 따라 개별 개선 및 기능 추가를 위한 명세서 수정시 아래 내용에 따라 변경 내역을 하위에 작성합니다.

- **공통 사항**
  - **내용**: 작성 전 시작에 날짜를 작성
- **1. API 명세서 추가**
  - **작성 방법**: 하단 로그 영역에 API ID와 사유를 먼저 기재한 뒤, 상위 본문에 신규 명세를 반영
- **2. API 명세서 수정**
  - **작성 방법**: 하단 로그에 수정 전 원본 명세와 사유를 먼저 보존 처리한 뒤, 상위 본문에 수정을 반영
    * *참고*: 원본 명세는 상위 도메인 대제목(##)부터 복제하되, 직접 수정하지 않는 하위 영역은 '생략'으로 대체 기재 가능
- **3. API 명세서 제거**
  - **작성 방법**: 하단 로그에 제거 직전의 원본 명세 전체와 사유를 먼저 보존 처리한 뒤, 상위 본문에서 해당 명세를 삭제
    * *참고*: API 전체 제거 시에는 상위 도메인 대제목(##)부터 전체 복제하며, 일부 정보만 부분 제거 시에는 해당 API 식별 정보와 함께 삭제되는 부분 명세만 기록

---

### 📅 [2026-07-07] API 명세 변경 로그 (예시)

- **LLM-FEEDBACK-API-001** (API 명세서 추가)
  - **사유**: 사용자가 AI 답변 품질에 대한 만족도(Thumbs up/down 및 텍스트 코멘트)를 전송하고, 이를 RAG 파인튜닝 학습 데이터셋으로 안전하게 축적하기 위해 API 명세를 신규 추가합니다.
- **API 명세서 수정**
  - **수정 전 원본 명세**:
    ## LLM 멀티에이전트 API 명세서
    ### LLM-CHAT-API-003 Agent Run 상태 및 State 요약 조회
    #### 기본 정보
    (생략)
    #### 에러 응답
    | HTTP Status | Error Code | 발생 시점 | 설명 |
    | :--- | :--- | :--- | :--- |
    | 404 | `LLM_RUN_NOT_FOUND` | run 조회 | run_id가 존재하지 않음 |
  - **사유**: 세션 타임아웃 만료로 인해 삭제된 run 상태를 프론트엔드에 정확히 안내하기 위해, 기존의 일반적인 `404` 대신 `410 Gone` HTTP 상태 코드 및 `LLM_RUN_EXPIRED` 에러 응답 코드를 반환하도록 상세 예외 처리 명세를 수정합니다.
- **API 명세서 제거**
  - **제거 직전 원본 명세**:
    ## LEGACY
    ### LEGACY-PROGRESS-API-001 미사용 구버전 웹소켓 프로그레스 API
    #### 기본 정보
    | 항목 | 값 |
    | :--- | :--- |
    | Endpoint | `GET /api/ws/analysis/legacy/progress` |
    | Method | GET / WebSocket |
    | 목적 | 구버전 웹소켓 분석 진행도 구독 엔드포인트 |
    | 상태 | 폐기 완료 |
  - **사유**: 실시간 진행률 알림이 SSE(Server-Sent Events) 프로토콜로 통합 일원화됨에 따라 더 이상 사용되지 않는 구버전 레거시 웹소켓 프로그레스 API 명세 구조를 영구 제거합니다.

---
