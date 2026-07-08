# LLM 공통 API 명세서

> **도메인**: LLM | **범위**: Common Contract | **최종 업데이트**: 2026-06-26

## 공통 응답 형식

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 공통 에러 형식

```json
{
  "code": 400,
  "message": "error",
  "error": {
    "code": "INVALID_CHAT_REQUEST",
    "message": "요청을 처리할 수 없습니다.",
    "detail": "question is required"
  }
}
```

에러 응답의 `detail`에는 secret, token, credential, private file content를 포함하지 않습니다.

## 공통 Headers

| 헤더명 | 값 | 필수 | 설명 |
| --- | --- | --- | --- |
| `Content-Type` | `application/json` | POST 계열 Y | JSON 요청 |
| `Authorization` | `Bearer {access_token}` | Y | 인증 토큰 |
| `Accept` | `text/event-stream` | Stream API Y | SSE 수신 |

## 공통 Path Parameters

| 파라미터명 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `repo_id` | UUID | Y | 대상 저장소 ID |
| `run_id` | UUID | run API Y | Agent 실행 ID |

## Run 상태값

| 상태 | 설명 |
| --- | --- |
| `queued` | run 생성 후 실행 대기 |
| `running` | LangGraph 데이터 수집 중 |
| `streaming` | Final Answer 응답 스트리밍 중 |
| `completed` | 정상 완료 |
| `failed` | 실패 |
| `cancelled` | 취소됨 |

## SSE 이벤트 타입

### 현재 구현 이벤트

| 이벤트 | 데이터 요약 | 설명 |
| --- | --- | --- |
| `graph_started` | `runId`, `stateKeys` | LangGraph 실행 시작 |
| `planner_plan` | `rewrittenQuery`, `selectedWorkers`, `allowedPaths` | Planner Node 계획 완료 |
| `route_validated` | `allowed`, `parallelGroups` | Dispatcher Node 검증 완료. 이벤트명은 기존 프론트 호환을 위해 유지 |
| `worker_started` | `worker`, `target` | worker 실행 시작 |
| `worker_result` | `worker`, `resultCount`, `evidenceIds` | worker 결과 기록 |
| `evidence_compacted` | `evidenceCount`, `compactContextReady` | evidence 정리 완료 |
| `evaluator_decision` | `sufficient`, `missingInfo`, `nextPlanHint`, `reason`, `confidence` | 근거 충분성 판단 |
| `replan_started` | `missingInfo`, `nextPlanHint`, `iteration`, `maxIterations` | 추가 탐색 계획 시작 |
| `answer_delta` | `content` | 최종 답변 토큰 조각 |
| `references` | `references[]` | 참조 파일 목록 |
| `completed` | `runId`, `status` | 정상 종료 |
| `cancelled` | `runId`, `cancelledAt` | 취소 종료 |
| `failed` | `runId`, `error` | 실패 종료 |

### 구현 예정 이벤트

| 이벤트 | 데이터 요약 | 설명 |
| --- | --- | --- |
| `worker_completed` | `worker`, `durationMs` | worker 실행 완료 |

## 공통 Error Code

| Error Code | HTTP Status | 설명 |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | 인증 토큰 누락 또는 만료 |
| `REPO_NOT_FOUND` | 404 | 저장소 없음 |
| `INVALID_CHAT_REQUEST` | 400 | 질문 또는 옵션 검증 실패 |
| `REPO_NOT_ANALYZED` | 409 | 저장소 분석/인덱싱 미완료 |
| `LLM_RUN_CREATE_FAILED` | 500 | agent run 생성 실패 |
| `LLM_RUN_NOT_FOUND` | 404 | agent run 없음 |
| `LLM_RUN_ALREADY_FINISHED` | 409 | 이미 종료된 run에 대한 불가능한 요청 |
| `AGENT_STREAM_FAILED` | 500 | SSE stream 처리 실패 |
| `AGENT_ROUTE_BLOCKED` | 403 | Dispatcher Node 보안 정책 차단 |
| `LLM_WORKER_FAILED` | 500 | worker 실행 실패 |
| `AGENT_EVIDENCE_NOT_FOUND` | 404 | evidence 없음 |
| `AGENT_EVIDENCE_NOT_READY` | 409 | reasoning에 필요한 evidence 미준비 |
| `AGENT_TOOL_POLICY_FAILED` | 500 | 외부 도구 정책 조회 실패 |
| `AGENT_REASONING_FAILED` | 500 | 선택형 reasoning worker 실패 |

## 모델 카탈로그 계약

Issue #181에 따라 프론트 모델 선택 UI와 백엔드 모델 검증은 같은 카탈로그를 기준으로 동작해야 합니다. 구현 방식은 `GET /api/llm/models` 또는 빌드 시 공유되는 정적 계약 중 하나를 선택할 수 있으나, 사용자에게 보이는 선택지와 backend allowlist가 어긋나서는 안 됩니다.

### LLM-COMMON-API-001: 모델 카탈로그 조회

| 항목 | 값 |
| --- | --- |
| Method | `GET` |
| Endpoint | `/api/llm/models` |
| 관련 기능 ID | `LLM-COMMON-B-201`, `LLM-COMMON-F-201` |
| 상태 | 제안 |

**성공 응답 — 200 OK**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "defaultModel": "gpt-4o",
    "models": [
      {
        "id": "gpt-4o",
        "label": "GPT-4o",
        "provider": "openai",
        "capabilities": ["planner", "answer", "tool-calling"],
        "enabled": true,
        "disabledReason": null
      }
    ]
  }
}
```

**필드 규칙**

| 필드 | 설명 |
| --- | --- |
| `id` | API 요청에 사용할 model id. backend allowlist와 동일해야 함 |
| `label` | UI 표시명 |
| `provider` | 모델 제공자 |
| `capabilities` | `planner`, `answer`, `embedding`, `summarization` 등 역할 |
| `enabled` | 현재 환경에서 선택 가능 여부 |
| `disabledReason` | 비활성 모델의 사용자 안내 문구 |

**에러 응답**

| HTTP Status | Error Code | 설명 |
| --- | --- | --- |
| 400 | `UNSUPPORTED_MODEL` | 요청한 model id가 backend allowlist에 없음 |
| 422 | `MODEL_DISABLED` | 카탈로그에는 있으나 현재 환경에서 비활성화된 모델 |
| 500 | `MODEL_CATALOG_UNAVAILABLE` | 모델 카탈로그 조회 실패 |

**클라이언트 기준**

- enabled model만 primary selectable로 보여줍니다.
- disabled model은 선택 불가 상태와 `disabledReason`을 함께 표시합니다.
- unsupported model 요청 실패는 분석/채팅 실패 뒤늦은 에러가 아니라 입력 검증 오류로 처리합니다.

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
