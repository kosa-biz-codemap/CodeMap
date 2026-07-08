# PROJECT CORE 기능 명세서

> **도메인**: PROJECT | **모듈**: PROJECT-CORE | **최종 업데이트**: 2026-06-26

## 전체 기능 요약

| 기능 ID | 기능명 | 계층 | Phase | 관련 이슈 | 작업 상태 |
| --- | --- | --- | --- | --- | --- |
| PROJECT-CORE-F-201 | 공통 API 에러 파서 | Frontend | Phase 2 | Issue #176 | 제안 |
| PROJECT-CORE-F-202 | 접근성/i18n/motion baseline | Frontend | Phase 2 | Issue #180 | 제안 |

---

## PROJECT-CORE-F-201: 공통 API 에러 파서

| 항목 | 내용 |
| --- | --- |
| 분류 | Frontend |
| 모듈명 | CORE |
| 관련 이슈 | Issue #176 |
| 관련 문서 | `ERROR_CODES.md`, `ERROR_HANDLING.md` |

**설명**

Auth, Analysis, Chat, List 등 frontend API client가 backend 오류 envelope를 서로 다른 방식으로 해석하지 않도록 공통 `parseApiError` 규칙을 둡니다.

**구현 노트**

- parser 출력 형태는 `{ status, code, message, field, retryable, detail }`을 기준으로 합니다.
- UI에 표시할 문구는 최상위 `message` 또는 `error.code`별 사용자 문구 mapping을 우선합니다.
- `error.detail`이 객체여도 `[object Object]`를 직접 렌더링하지 않습니다.
- `error.field`가 있으면 field-level 오류로, 없으면 page/form-level 오류로 전달합니다.

**완료 조건**

- 주요 frontend API client가 같은 parser를 사용합니다.
- Auth/Analysis/Chat/List 오류 표시 방식이 일관됩니다.
- parser 단위 테스트 또는 대표 API client 테스트가 추가됩니다.

---

## PROJECT-CORE-F-202: 접근성/i18n/motion baseline

| 항목 | 내용 |
| --- | --- |
| 분류 | Frontend |
| 모듈명 | CORE |
| 관련 이슈 | Issue #180 |
| 관련 문서 | `ARCHITECTURE.md` |

**설명**

제품 전반의 언어 기준, 접근성 이름, focus 처리, motion 감소 설정을 공통 UI 품질 기준으로 정리합니다.

**구현 노트**

- `html lang`과 앱 locale 기본값은 제품 기본 언어와 일치해야 합니다.
- icon-only button은 `aria-label`을 필수로 갖고, `title`은 tooltip 보조 용도로만 사용합니다.
- modal, toast, banner는 screen reader label, focus 이동, keyboard navigation을 만족해야 합니다.
- framer-motion 등 애니메이션은 `prefers-reduced-motion`에서 duration 0 또는 정적 강조로 대체합니다.

**완료 조건**

- 주요 auth/analyze/chat/repository/history 화면의 언어 기준이 일관됩니다.
- icon-only control이 의미 있는 accessible name을 갖습니다.
- reduced motion 설정에서 흔들림/전환 애니메이션이 과하게 실행되지 않습니다.

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
