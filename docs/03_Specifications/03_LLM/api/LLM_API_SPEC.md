# LLM API 명세서

> **도메인**: LLM | **최종 업데이트**: 2026-06-25

본 문서는 CodeMap LLM API 명세의 인덱스입니다. 기존 단일 파일 구조는 최신 `chat/` + `agent/` 아키텍처를 반영하기 어렵기 때문에, 사용자-facing API와 확장 API를 파일 단위로 분리합니다.

## 문서 구성

| 파일 | 범위 | 관련 기능 |
| --- | --- | --- |
| `LLM_COMMON_API_SPEC.md` | 공통 응답, 공통 에러, SSE 이벤트 형식 | LLM-OPS |
| `LLM_CHAT_RUN_API_SPEC.md` | run 생성, SSE 스트림 | LLM-CHAT-B-101, LLM-CHAT-B-203 |
| `LLM_RUN_MANAGEMENT_API_SPEC.md` | run 상태 조회, 취소, evidence 조회 | LLM-CHAT-B-204, LLM-EVALUATOR-B-201 |
| `LLM_ADVANCED_API_SPEC.md` | 장기 기억, 허용 외부 도구, reasoning 확장 | LLM-MEMORY-B-201, LLM-WORKER-B-206, LLM-WORKER-B-207 |

## 아키텍처 기준

| 항목 | 기준 |
| --- | --- |
| 실행 생성 | `POST /api/chat/{repo_id}/runs` |
| 스트림 | `GET /api/chat/{repo_id}/runs/{run_id}/stream` |
| 상태 조회 | `GET /api/chat/{repo_id}/runs/{run_id}` |
| 취소 | `POST /api/chat/{repo_id}/runs/{run_id}/cancel` |
| 근거 조회 | `GET /api/chat/{repo_id}/runs/{run_id}/evidence` |
| LangGraph 계층 | `backend/app/agent/` |
| Application 계층 | `backend/app/chat/` |
| 최종 답변 생성 | `chat/final_answer_agent.py` |

## 폐기된 이전 API

> 아래 표의 **소스 코드 상태**는 2026-06-25 기준 `grep -rn` 전수 검색으로 확인했습니다.
> `backend/` 코드에서 라우터 등록이 제거되었고 남은 참조는 HTTP 예시 파일과 명세서 내 설명 문구뿐입니다.

| 이전 API | 처리 | 소스 코드 상태 |
| --- | --- | --- |
| `POST /api/chat/{repo_id}` | `POST /api/chat/{repo_id}/runs` + SSE stream으로 대체 | ✅ 라우터에서 제거 완료. `chat/router.py`에 미존재 확인 |
| `POST /api/chat/{repo_id}/context` | evidence 조회와 worker 결과 기반 flow로 대체 | ✅ 라우터에서 제거 완료. `chat/router.py`에 미존재 확인 |
| `POST /api/search/{repo_id}/grep` | 외부 공개 API가 아니라 내부 `grep_worker` tool contract로 이동 | ⚠️ `backend/tests/http/LLM-TOOL/post-grep-001.http` 예시 파일에 참조 잔존 (구현 시작 전 예시이므로 실제 라우터 미노출) |
| `GET /api/search/{repo_id}/file` | 외부 공개 API가 아니라 내부 `read_worker`/`dir_worker` tool contract로 이동 | ⚠️ `backend/tests/http/LLM-TOOL/get-file-002.http` 예시 파일에 참조 잔존 (구현 시작 전 예시이므로 실제 라우터 미노출) |
| `GET /api/chat/{repo_id}/agent/status` | `GET /api/chat/{repo_id}/runs/{run_id}`로 대체 | ✅ 라우터에서 제거 완료. `agent/router.py`의 `get_run_status`로 대체 확인 |

## 관련 기능 명세

| 기능 명세 | 설명 |
| --- | --- |
| `../spec/LLM_CHAT_SPEC.md` | Chat Application Layer |
| `../spec/LLM_AGENT_SPEC.md` | CodeMapState, LangGraph workflow, dispatcher 보안/fan-out, 이벤트·상태, 메모리(통합본) |
| `../spec/LLM_PLANNER_SPEC.md` | Planner Node 계획 수립 |
| `../spec/LLM_EVALUATOR_SPEC.md` | 근거 집계 및 충분성 평가 |
| `../spec/LLM_TOOL_SPEC.md` | Workers, RRF 하이브리드 검색, 결정론적 도구 실행 |

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
