# PROJECT LIST 기능 명세서

> **도메인**: PROJECT | **모듈**: PROJECT-LIST | **최종 업데이트**: 2026-06-26


## 전체 기능 요약

| 기능 ID | 기능명 | 계층 | Phase | 담당자 | 작업 상태 |
| --- | --- | --- | --- | --- | --- |
| PROJECT-LIST-B-101 | 레포 목록 조회 API | Backend | Phase 1 | 강영우, 성민 신 | 시작 전 |
| PROJECT-LIST-B-201 | 레포 크기/파일 수 사전 검증 | Backend | Phase 1 | 강영우, 성민 신 | 시작 전 |
| PROJECT-LIST-B-202 | 프로젝트 목록 조회 및 관리 | Backend | Phase 1 | 성민 신, 강영우 | 시작 전 |
| PROJECT-LIST-B-301 | 분석 job metadata 저장 | Backend | Phase 1 | 성민 신, 강영우 | 시작 전 |
| PROJECT-LIST-B-401 | 개인/팀 scope 기반 분석 이력 필터링 | Backend | Phase 2 | - | 제안 |
| PROJECT-LIST-F-101 | 분석 이력 목록 화면 | Frontend | Phase 1 | 강영우, 성민 신 | 시작 전 |
| PROJECT-LIST-F-201 | store에서 job 목록 조회 | Frontend | Phase 1 | 성민 신, 강영우 | 시작 전 |
| PROJECT-LIST-F-202 | job 상태 업데이트 | Frontend | Phase 1 | 성민 신, 강영우 | 시작 전 |
| PROJECT-LIST-F-203 | 실패 job error 표시 | Frontend | Phase 1 | 성민 신, 강영우 | 시작 전 |
| PROJECT-LIST-F-204 | 분석 완료 화면의 History 접근 유지 | Frontend | Phase 1 | - | 제안 |
| PROJECT-LIST-F-205 | History 검색/필터/재시도/삭제 UX | Frontend | Phase 2 | - | 제안 |

---

## Phase 1

### PROJECT-LIST-B-101: 레포 목록 조회 API

| 항목 | 내용 |
| --- | --- |
| 분류 | Backend |
| 모듈명 | LIST |
| 담당자 | 강영우, 성민 신 |
| 작업상태 | 시작 전 |

**설명**

전체 분석 이력 목록 반환. `GET /api/list/analysis` — 사용자가 이전에 분석한 저장소 및 분석 작업 목록을 페이지네이션하여 반환.

**구현 노트**

- page, limit 쿼리 파라미터 지원
- 상태별 필터링(queued/running/completed/failed)
- 최신순 정렬 기본값
- Phase 2에서는 `scope=private|team|all`, `teamId`를 지원하고, current user가 볼 수 있는 private/team 분석만 반환합니다.


### PROJECT-LIST-B-201: 레포 크기/파일 수 사전 검증

| 항목 | 내용 |
| --- | --- |
| 분류 | Backend |
| 모듈명 | LIST |
| 담당자 | 강영우, 성민 신 |
| 작업상태 | 시작 전 |

**설명**

clone 전 파일 수·용량이 제한 초과 여부 확인 및 초과 시 사용자 안내. `POST /api/list/validate` — 본격 분석 전 사전 검증으로 불필요한 clone 방지.

**구현 노트**

- 파일 수 제한: 100개 이하
- 파일 크기 제한: 파일당 100KB 이하
- GitHub API로 저장소 메타데이터 조회


### PROJECT-LIST-B-202: 프로젝트 목록 조회 및 관리

| 항목 | 내용 |
| --- | --- |
| 분류 | Backend |
| 모듈명 | LIST |
| 담당자 | 성민 신, 강영우 |
| 작업상태 | 시작 전 |

**설명**

이전에 사용자가 진행한 작업에 대한 조회, 삭제 기능. 분석 이력 관리 및 단일 레포 분석 우선으로 인한 일부 기능 보류.

**구현 노트**

- 단일 레포 분석 우선으로 UI/API 일부 보류
- queued/running/completed/failed 상태 저장


### PROJECT-LIST-B-301: 분석 job metadata 저장

| 항목 | 내용 |
| --- | --- |
| 분류 | Backend |
| 모듈명 | LIST |
| 담당자 | 성민 신, 강영우 |
| 작업상태 | 시작 전 |

**설명**

분석 결과물에 대한 메타데이터 저장. job_id, repo_url, status, created_at, updated_at 저장.

**구현 노트**

- `analysis_jobs` 테이블에 저장
- 상태 전이: queued → running → completed/failed
- Phase 2 팀 기능에서는 `created_by_user_id`, `visibility`, `team_id`를 함께 저장합니다.

### PROJECT-LIST-B-401: 개인/팀 scope 기반 분석 이력 필터링

| 항목 | 내용 |
| --- | --- |
| 분류 | Backend |
| 모듈명 | LIST |
| 관련 명세 | `PROJECT_TEAM_SPEC.md`, Issue #164 |
| 작업상태 | 제안 |

**설명**

분석 이력 목록과 상세 조회는 더 이상 전체 `analysis_jobs`를 그대로 반환하지 않고, current user의 private 기록과 active team membership으로 접근 가능한 team 기록만 반환합니다.

**구현 노트**

- `scope=private`: `created_by_user_id == current_user.id` AND `visibility='private'`
- `scope=team`: `visibility='team'` AND `team_id`가 current user의 active membership에 포함
- `scope=all`: private 결과와 접근 가능한 team 결과를 합산
- 다른 사용자의 private job 또는 소속되지 않은 team job 요청은 403 또는 목록 제외로 처리합니다.


### PROJECT-LIST-F-101: 분석 이력 목록 화면

| 항목 | 내용 |
| --- | --- |
| 분류 | Frontend |
| 모듈명 | LIST |
| 담당자 | 강영우, 성민 신 |
| 작업상태 | 시작 전 |

**설명**

이미 분석한 레포 목록과 각 분석 상태(완료, 처리중, 실패)를 조회하는 홈 화면. HistoryList 컴포넌트로 구성.

**구현 노트**

- 상태별 색상 구분 (완료: 초록, 처리중: 파랑, 실패: 빨강)
- 클릭 시 분석 결과 상세 페이지 이동


### PROJECT-LIST-F-201: store에서 job 목록 조회

| 항목 | 내용 |
| --- | --- |
| 분류 | Frontend |
| 모듈명 | LIST |
| 담당자 | 성민 신, 강영우 |
| 작업상태 | 시작 전 |

**설명**

이전 작업한 내용 확인 가능하게 frontend 구성. store(Zustand/Redux)에서 분석 job 목록을 조회하여 HistoryList에 표시.


### PROJECT-LIST-F-202: job 상태 업데이트

| 항목 | 내용 |
| --- | --- |
| 분류 | Frontend |
| 모듈명 | LIST |
| 담당자 | 성민 신, 강영우 |
| 작업상태 | 시작 전 |

**설명**

작업 결과물에 대한 상태 확인 가능하게 frontend 구성. queued/running/completed/failed 상태를 store에 저장하여 frontend가 최신 상태 재조회 가능.


### PROJECT-LIST-F-203: 실패 job error 표시

| 항목 | 내용 |
| --- | --- |
| 분류 | Frontend |
| 모듈명 | LIST |
| 담당자 | 성민 신, 강영우 |
| 작업상태 | 시작 전 |

**설명**

실패한 작업에 대한 frontend 구성. exception message, failed_agent, timestamp를 저장하여 frontend에서 실패 원인 표시 가능.

### PROJECT-LIST-F-204: 분석 완료 화면의 History 접근 유지

| 항목 | 내용 |
| --- | --- |
| 분류 | Frontend |
| 모듈명 | LIST |
| 관련 이슈 | Issue #162 |
| 관련 명세 | `PROJECT_ANALYZE_SPEC.md` |
| 작업상태 | 제안 |

**설명**

분석 완료 후 Repository 파일 트리가 표시되는 상태에서도 `HistoryList`에 접근할 수 있게 유지합니다. `/analyze` 좌측 aside에서 Repository와 History를 탭 또는 접이식 섹션으로 제공하며, History 선택 시 `job` URL 파라미터와 화면 상태를 함께 갱신합니다.

### PROJECT-LIST-F-205: History 검색/필터/재시도/삭제 UX

| 항목 | 내용 |
| --- | --- |
| 분류 | Frontend |
| 모듈명 | LIST |
| 관련 이슈 | Issue #177 |
| 관련 API | `PROJECT-LIST-API-001`, `PROJECT-LIST-API-007`, `PROJECT-LIST-API-008` |
| 작업상태 | 제안 |

**설명**

분석 이력이 많아졌을 때 사용자가 원하는 job을 찾고, 실패 job을 다시 실행하거나 불필요한 기록을 정리할 수 있도록 HistoryList 자체의 탐색/관리 기능을 제공합니다.

**구현 노트**

- repository name/url 검색, status 필터, private/team scope 필터, 최신순/상태순 정렬을 제공합니다.
- failed job은 실패 원인 요약과 retry CTA를 표시합니다.
- delete 또는 hide action은 confirm modal을 거치며 optimistic update 실패 시 원상 복구합니다.
- 401/403/404/500은 빈 목록과 다른 error state로 표시합니다.

**완료 조건**

- History에서 검색, 필터, 정렬이 가능합니다.
- 실패 job의 원인과 재시도 action이 사용자 언어로 보입니다.
- 삭제/숨김 흐름이 명확한 확인 UI를 거칩니다.

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
