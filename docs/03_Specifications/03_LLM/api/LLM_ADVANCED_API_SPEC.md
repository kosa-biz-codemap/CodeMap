# LLM Advanced API 명세서

> **도메인**: LLM | **범위**: Memory / Allowed Tools / Reasoning Extension | **최종 업데이트**: 2026-06-25

> [!NOTE]
> 본 문서의 모든 API는 **Phase 2** 범위이며 현재 미구현 상태입니다.

## LLM-ADVANCED-API-001 에이전트 장기 기억 조회

### 기본 정보

| 항목 | 값 |
| --- | --- |
| Endpoint | `GET /api/chat/{repo_id}/memory` |
| Method | GET |
| 관련 기능 ID | `LLM-MEMORY-B-201` |
| 목적 | 이전 대화 세션에서 에이전트가 학습한 장기 기억 컨텍스트 조회 |
| 상태 | Phase 2 / 보류 |

### 응답

| 필드명 | 타입 | 설명 |
| --- | --- | --- |
| `code` | Integer | HTTP 상태 코드 |
| `message` | String | `success` |
| `data.repoId` | UUID | 저장소 ID |
| `data.memories` | Array<Object> | 장기 기억 목록 |
| `data.memories[].id` | String | memory ID |
| `data.memories[].summary` | String | 기억 요약 |
| `data.memories[].sourceRunId` | UUID | 생성 근거 run |
| `data.memories[].createdAt` | String | 생성 시각 |

---

## LLM-ADVANCED-API-002 허용 외부 도구 Worker 목록 조회

### 기본 정보

| 항목 | 값 |
| --- | --- |
| Endpoint | `GET /api/chat/{repo_id}/tools/allowed` |
| Method | GET |
| 관련 기능 ID | `LLM-WORKER-B-206` |
| 목적 | Phase 2에서 확장 가능한 외부 도구 worker allowlist와 권한 범위 조회 |
| 상태 | Phase 2 / 보류 |

### 응답

| 필드명 | 타입 | 설명 |
| --- | --- | --- |
| `code` | Integer | HTTP 상태 코드 |
| `message` | String | `success` |
| `data.repoId` | UUID | 저장소 ID |
| `data.tools` | Array<Object> | 허용된 외부 도구 worker 목록 |
| `data.tools[].name` | String | 도구 worker 이름 |
| `data.tools[].type` | String | `github`, `docs`, `issue`, `webhook` 등 |
| `data.tools[].enabled` | Boolean | 활성화 여부 |
| `data.tools[].allowedActions` | Array<String> | 허용 action 목록 |
| `data.tools[].requiresConfirmation` | Boolean | 사용자 확인 필요 여부 |

### 응답 예시

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "repoId": "8cfd0f7b-3ec3-42e3-97c4-8f4b4cc9390f",
    "tools": [
      {
        "name": "github_issue_search",
        "type": "github",
        "enabled": false,
        "allowedActions": ["search"],
        "requiresConfirmation": false
      }
    ]
  }
}
```

---

## LLM-ADVANCED-API-003 선택형 Reasoning Worker 고도화 실행 요청

### 기본 정보

| 항목 | 값 |
| --- | --- |
| Endpoint | `POST /api/chat/{repo_id}/runs/{run_id}/reasoning` |
| Method | POST |
| 관련 기능 ID | `LLM-WORKER-B-205`, `LLM-WORKER-B-207` |
| 목적 | 기존 run의 State evidence를 기반으로 Phase 2 선택형 reasoning worker 실행 |
| 상태 | Phase 2 / 보류 |

### Request Body

| 필드명 | 타입 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| `focus` | String | N | - | `security`, `architecture`, `data_flow`, `bug_risk` 등 |
| `maxEvidence` | Integer | N | 12 | reasoning worker가 읽을 최대 evidence 수 |
| `includeNewSearch` | Boolean | N | false | 추가 worker 검색 허용 여부 |

### 응답

#### 성공 응답 - 202 Accepted

| 필드명 | 타입 | 설명 |
| --- | --- | --- |
| `code` | Integer | HTTP 상태 코드 |
| `message` | String | `accepted` |
| `data.runId` | UUID | 대상 run ID |
| `data.reasoningRunId` | UUID | 추가 reasoning 실행 ID |
| `data.status` | String | `reasoning_queued` |

### 에러 응답

| HTTP Status | Error Code | 발생 시점 | 설명 |
| --- | --- | --- | --- |
| 404 | `LLM_RUN_NOT_FOUND` | run 조회 | run_id가 존재하지 않음 |
| 409 | `AGENT_EVIDENCE_NOT_READY` | 사전 검증 | reasoning에 필요한 evidence 미준비 |
| 500 | `AGENT_REASONING_FAILED` | worker 실행 | 선택형 reasoning worker 실행 실패 |

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
