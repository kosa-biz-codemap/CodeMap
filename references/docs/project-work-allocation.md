# Project Work Allocation

CodeMap 팀프로젝트의 MVP 1차 작업 분배 문서입니다.

기능/API의 기준 문서는 [`project-core-features-api-spec.md`](./project-core-features-api-spec.md)로 관리하고, 담당자와 관련 파일, 진행 상태는 이 문서에서 관리합니다.

## MVP 1차 분배 원칙

- 1차 목표는 GitHub 저장소 입력부터 분석, RAG 검색, Agent 응답, 온보딩 문서 생성까지 데모 가능한 흐름을 완성하는 것입니다.
- 번역, 메일, PDF 전송 같은 확장 기능은 `P2` 후순위로 두고 MVP가 안정화된 뒤 진행합니다.
- 담당자는 `TODO`로 두고, 팀 회의에서 확정되는 즉시 갱신합니다.
- 관련 파일은 현재 예상 기준이며 구현 과정에서 실제 경로에 맞게 조정합니다.

## Domain Overview

| Domain | 역할 | 1차 목표 |
| --- | --- | --- |
| PROJECT | 저장소 등록, 목록, clone, pipeline 상태 관리 | 사용자가 저장소를 등록하고 분석 진행 상태를 볼 수 있게 한다. |
| RAG | 코드/문서 파싱, 청킹, 임베딩, 검색 연결 | 레포 내용을 검색 가능한 지식 기반으로 만든다. |
| AGENT | 분석 실행, 사용자 질문 응답, 실패 처리 | RAG 결과를 바탕으로 답변과 근거를 생성한다. |
| DOCS | 문서 생성, 민감정보 검사, 공유용 산출물 | 팀원이 읽을 수 있는 온보딩 문서와 보고서를 만든다. |
| COMMON / QA | 공통 타입, 설정, 테스트, 실행 검증 | 파트 간 API 계약과 실행 안정성을 맞춘다. |

## MVP 1차 담당 영역

| Domain | Module | 주요 작업 | 관련 파일/폴더 | 담당자 | 우선순위 | 상태 |
| --- | --- | --- | --- | --- | --- | --- |
| PROJECT | LIST | 분석 목록 조회, 분석 상세 조회, 파일 수/크기 사전 검증 | `backend/app/api/routes.py`, `backend/app/services/analysis_store.py`, `frontend/src/components/HistoryList.tsx` | TODO | P0 | 예정 |
| PROJECT | REPO | GitHub URL 검증, Git clone, 파일 필터링, cleanup | `backend/app/services/repo_cloner.py`, `backend/app/models/schemas.py` | TODO | P0 | 예정 |
| PROJECT | PIPELINE | job 생성, 분석 단계 orchestration, 진행 상태 이벤트, WebSocket/SSE | `backend/app/orchestrator/planner.py`, `backend/app/api/progress_bus.py`, `frontend/src/components/ProgressPanel.tsx`, `frontend/src/hooks/useWebSocket.ts` | TODO | P0 | 예정 |
| RAG | PARSE | 파일 트리 생성, 설정 파일 탐지, entrypoint 탐지, 문서/코드 청킹 | `backend/app/agents/code_mapper.py`, `backend/app/models/schemas.py` | TODO | P0 | 예정 |
| RAG | EMBED | 임베딩 모델 호출, 벡터화, top-k 검색, source metadata 연결 | `backend/app/services/`, `backend/app/models/`, `backend/app/api/routes.py` | TODO | P0 | 예정 |
| AGENT | SEARCH | 레포 분석 agent, 근거 수집, 다단계 탐색, retry | `backend/app/agents/`, `backend/app/orchestrator/planner.py` | TODO | P0 | 예정 |
| AGENT | CHAT | 사용자 질문 처리, 답변 생성, follow-up 질문, source 표시 | `backend/app/api/routes.py`, `frontend/src/components/ReportViewer.tsx`, `frontend/src/lib/api.ts` | TODO | P1 | 예정 |
| AGENT | CORE | timeout, fallback, 에러 응답 표준화, 실패 원인 기록 | `backend/app/api/routes.py`, `backend/app/orchestrator/planner.py`, `frontend/src/types/contracts.ts` | TODO | P0 | 예정 |
| DOCS | GEN | 온보딩 문서 생성, 실행 가이드, 핵심 파일 요약, 최종 보고서 | `backend/app/agents/doc_generator.py`, `backend/app/agents/onboarding_guide.py`, `frontend/src/components/ReportViewer.tsx` | TODO | P0 | 예정 |
| DOCS | GUARD | 민감정보 검사, 제외 규칙, 안전한 source 표시 | `backend/app/services/`, `backend/app/services/repo_cloner.py`, `references/docs/` | TODO | P1 | 예정 |
| DOCS | UTIL | Markdown export, 번역, PDF/메일 전송 등 공유 기능 | `references/docs/`, `frontend/src/components/`, `backend/app/api/routes.py` | TODO | P2 | 후순위 |
| COMMON / QA | SCHEMA | API contract, Pydantic/TypeScript 타입 동기화 | `backend/app/models/schemas.py`, `frontend/src/types/contracts.ts` | TODO | P0 | 예정 |
| COMMON / QA | CONFIG | env, API base URL, CORS, storage path | `backend/app/models/config.py`, `frontend/src/lib/api.ts`, `docker-compose.yml` | TODO | P0 | 예정 |
| COMMON / QA | TEST | backend/frontend 테스트, sample repo, 배포 전 검증 | `backend/tests/`, `frontend/src/**/*.test.*`, `references/docs/deployment-verification-guide.md` | TODO | P1 | 예정 |

## 4인 페어 작업 흐름 초안

초반에는 도메인별로 1명씩 고정 배정하지 않고, `PROJECT` 영역을 2인 페어 2개로 나누어 병렬로 시작합니다. 한 페어의 작업이 먼저 끝나면 다음 병목 영역으로 이동해 다른 페어를 기다리는 시간을 줄입니다.

### Round 1: PROJECT 병렬 구현

| 페어 | 담당자 | 우선 작업 | 관련 Module | 완료 기준 |
| --- | --- | --- | --- | --- |
| Pair A | TODO / TODO | 분석 목록, 분석 상세, 파일 수/크기 사전 검증, 진행 상태 UI | PROJECT LIST / PIPELINE | 목록 조회와 분석 진행 상태가 UI에서 확인된다. |
| Pair B | TODO / TODO | GitHub URL 검증, Git clone, 파일 필터링, cleanup | PROJECT REPO | public GitHub URL을 입력하면 서버가 안전하게 clone하고 분석 대상 파일만 남긴다. |

### Round 2: 먼저 끝난 페어의 이동 경로

| 먼저 끝난 작업 | 다음 이동 후보 | 이유 |
| --- | --- | --- |
| PROJECT LIST / PIPELINE | RAG EMBED | 진행 상태와 저장 구조가 잡히면 임베딩/검색 연결을 붙일 수 있다. |
| PROJECT REPO | RAG PARSE | clone/필터링 결과를 바로 파일 트리, 설정 탐지, 청킹 입력으로 넘길 수 있다. |
| RAG PARSE | AGENT SEARCH | 파싱 결과가 나오면 분석 agent가 근거 수집과 요약을 시작할 수 있다. |
| RAG EMBED | AGENT CHAT | 검색 결과가 나오면 사용자 질문 응답과 source 표시를 붙일 수 있다. |
| AGENT SEARCH / CHAT | DOCS GEN / GUARD | 분석/답변 결과를 온보딩 문서로 만들고 민감정보 검사를 연결한다. |

### Round 3: MVP 마감 전 통합

| 담당 | 작업 | 완료 기준 |
| --- | --- | --- |
| 전체 | API contract와 타입 동기화 | backend schema와 frontend contract가 같은 응답 구조를 사용한다. |
| 전체 | end-to-end demo flow 검증 | URL 입력 -> clone -> 분석 진행 -> report 생성 -> source 확인 흐름이 동작한다. |
| 전체 | README / 실행 가이드 / 배포 전 검증 | 팀원 환경에서 같은 명령으로 실행과 검증이 가능하다. |

## Phase 2 후보

| Domain | Module | 후보 작업 |
| --- | --- | --- |
| RAG | PARSE | AST 기반 고도화 청킹, import graph, 함수/클래스 단위 source mapping |
| AGENT | CHAT | 객관식 follow-up 질문, 대화 히스토리 기반 답변 개선 |
| DOCS | UTIL | PDF 생성, 이메일 전송, 다국어 번역, 발표용 export |
| COMMON / QA | OBS | structured logging, 분석 시간/비용 통계, 실패 원인 dashboard |
