# LLM Run Management API 명세서

> **도메인**: LLM | **범위**: Status / Cancel / Evidence | **최종 업데이트**: 2026-06-25

## LLM-CHAT-API-003 Agent Run 상태 및 State 요약 조회

### 기본 정보

| 항목 | 값 |
| --- | --- |
| Endpoint | `GET /api/chat/{repo_id}/runs/{run_id}` |
| Method | GET |
| 관련 기능 ID | `LLM-CHAT-B-204`, `LLM-GRAPH-B-201`, `LLM-OPS-B-203` |
| 목적 | 실행 상태, node별 소요 시간, State 요약, 최종 답변 상태 조회 |
| 상태 | 구현 완료 |

### 응답

### 사전 검증

Issue #173에 따라 상태 조회는 `run_id`만 단독으로 신뢰하지 않고 path의 `repo_id`와 run metadata의 repo/job ID가 일치하는지 함께 확인합니다.

- `repo_id`가 존재하지 않으면 404 `REPO_NOT_FOUND`
- `run_id`가 존재하지 않으면 404 `LLM_RUN_NOT_FOUND`
- `run_id`는 존재하지만 path의 `repo_id`와 연결되지 않으면 409 `RUN_REPO_MISMATCH`

#### 성공 응답 - 200 OK

| 필드명 | 타입 | 설명 |
| --- | --- | --- |
| `code` | Integer | HTTP 상태 코드 |
| `message` | String | `success` |
| `data.runId` | UUID | agent run ID |
| `data.sessionId` | UUID | 대화 세션 ID |
| `data.status` | String | `queued`, `running`, `streaming`, `completed`, `failed`, `cancelled` |
| `data.currentNode` | String | 현재 실행 중인 node/worker |
| `data.state.userQuery` | String | 사용자 원본 질문 |
| `data.state.rewrittenQuery` | String | Planner가 교정한 검색 질의 |
| `data.state.accessPlan` | Object | selectedWorkers, allowedPaths, riskLevel |
| `data.state.securityResult` | Object | Dispatcher Node 검증 결과 |
| `data.state.workerResultCount` | Integer | raw evidence 개수 |
| `data.state.compactContextReady` | Boolean | compact context 준비 여부 |
| `data.state.stateKeys` | Array<String> | 현재 기록된 State key 목록 |
| `data.durations` | Object | node/worker별 소요 시간 |
| `data.finalAnswer` | Object/Null | 완료된 경우 최종 답변 메타데이터 |

#### 응답 예시

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "runId": "2f86a7b7-4d9b-45f1-bc5b-1c2b938c1d10",
    "sessionId": "a0de8d29-92a4-4fd6-a657-2d22f4c0cc75",
    "status": "running",
    "currentNode": "read_worker",
    "state": {
      "userQuery": "로그인 어딧음?",
      "rewrittenQuery": "login signin auth authentication",
      "accessPlan": {
        "selectedWorkers": ["search", "grep", "read"],
        "allowedPaths": ["backend/app", "frontend/src"],
        "riskLevel": "normal"
      },
      "securityResult": {
        "allowed": true,
        "blockedPaths": [],
        "policy": "repo_allowlist"
      },
      "workerResultCount": 5,
      "compactContextReady": false,
      "stateKeys": ["user_query", "rewritten_query", "access_plan", "security_result", "worker_results"]
    },
    "durations": {
      "planner_node": 1.4,
      "dispatcher_node": 0.03,
      "search_worker": 0.8,
      "grep_worker": 0.2
    },
    "finalAnswer": null
  }
}
```

---

## LLM-CHAT-API-004 Agent Run 취소

### 기본 정보

| 항목 | 값 |
| --- | --- |
| Endpoint | `POST /api/chat/{repo_id}/runs/{run_id}/cancel` |
| Method | POST |
| 관련 기능 ID | `LLM-CHAT-B-204`, `LLM-OPS-B-202`, `LLM-OPS-B-204` |
| 목적 | 실행 중인 LangGraph/worker run을 취소하고 SSE에 `cancelled` 이벤트 발행 |
| 상태 | 구현 완료 |

### 응답

#### 성공 응답 - 200 OK

| 필드명 | 타입 | 설명 |
| --- | --- | --- |
| `code` | Integer | HTTP 상태 코드 |
| `message` | String | `cancelled` |
| `data.runId` | UUID | 취소된 run ID |
| `data.status` | String | `cancelled` |
| `data.cancelledAt` | String | 취소 시각 |

### 에러 응답

| HTTP Status | Error Code | 발생 시점 | 설명 |
| --- | --- | --- | --- |
| 404 | `REPO_NOT_FOUND` | repo 조회 | repo_id가 존재하지 않음 |
| 404 | `LLM_RUN_NOT_FOUND` | run 조회 | run_id가 존재하지 않음 |
| 409 | `RUN_REPO_MISMATCH` | run/repo 검증 | run은 존재하지만 path의 repo_id와 연결되지 않음 |
| 409 | `LLM_RUN_ALREADY_FINISHED` | 상태 검증 | 이미 completed/failed/cancelled 상태 |

---

## LLM-CHAT-API-005 Agent 근거 조회

### 기본 정보

| 항목 | 값 |
| --- | --- |
| Endpoint | `GET /api/chat/{repo_id}/runs/{run_id}/evidence` |
| Method | GET |
| 관련 기능 ID | `LLM-WORKER-B-201` ~ `LLM-WORKER-B-204`, `LLM-EVALUATOR-B-201` |
| 목적 | Worker가 `CodeMapState.worker_results`에 기록한 raw evidence와 compact context 조회 |
| 상태 | 구현 완료 |

### Query Parameters

| 파라미터명 | 타입 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| `includeRawSnippet` | Boolean | N | false | 원본 코드 snippet 포함 여부 |
| `worker` | String | N | - | `search`, `dir`, `grep`, `read`, `reasoning` |
| `limit` | Integer | N | 20 | 최대 evidence 수 |

### 응답

#### 성공 응답 - 200 OK

| 필드명 | 타입 | 설명 |
| --- | --- | --- |
| `code` | Integer | HTTP 상태 코드 |
| `message` | String | `success` |
| `data.runId` | UUID | agent run ID |
| `data.evidence` | Array<Object> | 근거 목록 |
| `data.evidence[].id` | String | evidence ID |
| `data.evidence[].worker` | String | 생성 worker |
| `data.evidence[].path` | String | 파일 경로 |
| `data.evidence[].lineStart` | Integer | 시작 라인 |
| `data.evidence[].lineEnd` | Integer | 종료 라인 |
| `data.evidence[].score` | Float | 검색/선정 점수 |
| `data.evidence[].snippet` | String/Null | 선택 시 반환되는 원본 코드 snippet |
| `data.compactContext` | Object | Final Answer Agent에 전달된 압축 근거 |
| `data.stateField` | String | `worker_results` |

### 에러 응답

| HTTP Status | Error Code | 발생 시점 | 설명 |
| --- | --- | --- | --- |
| 404 | `REPO_NOT_FOUND` | repo 조회 | repo_id가 존재하지 않음 |
| 404 | `LLM_RUN_NOT_FOUND` | run 조회 | run_id가 존재하지 않음 |
| 404 | `AGENT_EVIDENCE_NOT_FOUND` | evidence 조회 | State에 evidence가 없음 |
| 409 | `RUN_REPO_MISMATCH` | run/repo 검증 | run은 존재하지만 path의 repo_id와 연결되지 않음 |

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
