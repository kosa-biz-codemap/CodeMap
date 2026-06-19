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

- 배치 크기: 100개 청크
- 총 차원: 3072-dim 벡터
- API 호출 실패 시 지수 백오프 재시도


### RAG-EMBED-B-301: pgvector 저장

| 항목 | 내용 |
| --- | --- |
| 분류 | Backend |
| 모듈명 | EMBED |

**설명**

임베딩 및 메타데이터 저장. 생성된 임베딩 벡터를 pgvector(PostgreSQL 확장)에 저장. 메타데이터(파일명, 라인, 언어, 심볼명)와 함께 저장.

**구현 노트**

- pgvector extension 활성화
- `code_chunks` 테이블: id, project_id, content, embedding, file_path, start_line, end_line, symbol, language
- 배치 upsert로 성능 최적화


