# PROJECT TEAM API 명세서

> **도메인**: PROJECT | **범위**: Team / Invite / Workspace Scope | **최종 업데이트**: 2026-06-26

## API 목록

| API ID | Method | Endpoint | 목적 | 상태 |
| --- | --- | --- | --- | --- |
| PROJECT-TEAM-API-001 | `POST` | `/api/teams` | 팀 생성 | 제안 |
| PROJECT-TEAM-API-002 | `GET` | `/api/teams` | 내가 속한 팀 목록 조회 | 제안 |
| PROJECT-TEAM-API-003 | `POST` | `/api/teams/{team_id}/invites` | 팀 초대 생성 | 제안 |
| PROJECT-TEAM-API-004 | `GET` | `/api/team-invites` | 내 이메일로 온 초대 목록 조회 | 제안 |
| PROJECT-TEAM-API-005 | `POST` | `/api/team-invites/{invite_id}/accept` | 초대 수락 | 제안 |
| PROJECT-TEAM-API-006 | `POST` | `/api/team-invites/{invite_id}/decline` | 초대 거절 | 제안 |
| PROJECT-TEAM-API-007 | `GET` | `/api/teams/{team_id}/members` | 팀 멤버 목록 조회 | 제안 |

## 공통 인증/권한

모든 endpoint는 `Authorization: Bearer {access_token}`을 요구한다.

| 오류 | HTTP | 설명 |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | 토큰 누락 또는 만료 |
| `TEAM_ACCESS_DENIED` | 403 | 사용자가 해당 팀의 active member가 아님 |
| `TEAM_OWNER_REQUIRED` | 403 | owner 권한이 필요한 작업 |
| `TEAM_INVITE_NOT_FOUND` | 404 | 초대가 없거나 현재 사용자에게 보이지 않음 |
| `TEAM_INVITE_EXPIRED` | 409 | 만료된 초대 |
| `TEAM_INVITE_ALREADY_USED` | 409 | 이미 처리된 초대 |

## PROJECT-TEAM-API-001 팀 생성

### Request

```http
POST /api/teams HTTP/1.1
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "CodeMap Team"
}
```

### Response

```json
{
  "code": 201,
  "message": "created",
  "data": {
    "teamId": "uuid",
    "name": "CodeMap Team",
    "role": "owner"
  }
}
```

## PROJECT-TEAM-API-002 내가 속한 팀 목록 조회

```http
GET /api/teams HTTP/1.1
Authorization: Bearer {access_token}
```

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "teams": [
      {
        "teamId": "uuid",
        "name": "CodeMap Team",
        "role": "owner",
        "joinedAt": "2026-06-26T10:00:00Z"
      }
    ]
  }
}
```

## PROJECT-TEAM-API-003 팀 초대 생성

팀 owner만 호출할 수 있다.

```http
POST /api/teams/{team_id}/invites HTTP/1.1
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "email": "member@example.com"
}
```

```json
{
  "code": 201,
  "message": "created",
  "data": {
    "inviteId": "uuid",
    "teamId": "uuid",
    "email": "member@example.com",
    "status": "pending",
    "expiresAt": "2026-07-03T10:00:00Z"
  }
}
```

## PROJECT-TEAM-API-004 내 초대 목록 조회

현재 로그인 사용자의 이메일과 일치하는 pending 초대만 반환한다.

```http
GET /api/team-invites HTTP/1.1
Authorization: Bearer {access_token}
```

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "invites": [
      {
        "inviteId": "uuid",
        "teamId": "uuid",
        "teamName": "CodeMap Team",
        "invitedByEmail": "owner@example.com",
        "status": "pending",
        "expiresAt": "2026-07-03T10:00:00Z"
      }
    ]
  }
}
```

## PROJECT-TEAM-API-005 초대 수락

```http
POST /api/team-invites/{invite_id}/accept HTTP/1.1
Authorization: Bearer {access_token}
```

성공 시 `team_members`에 active member를 생성하고 초대 상태를 `accepted`로 바꾼다.

```json
{
  "code": 200,
  "message": "accepted",
  "data": {
    "teamId": "uuid",
    "role": "member"
  }
}
```

## PROJECT-TEAM-API-006 초대 거절

```http
POST /api/team-invites/{invite_id}/decline HTTP/1.1
Authorization: Bearer {access_token}
```

```json
{
  "code": 200,
  "message": "declined",
  "data": {
    "inviteId": "uuid",
    "status": "declined"
  }
}
```

## PROJECT-TEAM-API-007 팀 멤버 목록 조회

팀 active member만 조회할 수 있다.

```http
GET /api/teams/{team_id}/members HTTP/1.1
Authorization: Bearer {access_token}
```

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "members": [
      {
        "userId": "uuid",
        "email": "owner@example.com",
        "role": "owner",
        "joinedAt": "2026-06-26T10:00:00Z"
      }
    ]
  }
}
```

## LIST/REPO/CHAT API 연결 계약

### 분석 생성

`POST /api/repo/analysis`와 `POST /api/repo/analysis/local`은 Phase 2에서 다음 필드를 추가한다.

| 필드명 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `visibility` | String | N | `private` 또는 `team`. 기본값 `private` |
| `teamId` | UUID | visibility가 `team`이면 Y | 분석을 공유할 팀 ID |

### 분석 이력 조회

`GET /api/list/analysis`는 Phase 2에서 다음 쿼리를 지원한다.

| 파라미터 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `scope` | String | `private` | `private`, `team`, `all` |
| `teamId` | UUID | null | 특정 팀 기록 조회 |

### 채팅 run/thread 조회

`POST /api/chat/{repo_id}/runs`, `GET /api/chat/{repo_id}/threads`, `GET /api/chat/{repo_id}/threads/{thread_id}`는 `repo_id`의 `analysis_jobs.visibility`와 `team_id`를 확인한 뒤 접근을 허용한다.

권한 체크 순서:

1. JWT로 current user 확인
2. `analysis_jobs.id = repo_id` 조회
3. `visibility=private`이면 `created_by_user_id == current_user.id`
4. `visibility=team`이면 `team_members(team_id, current_user.id, status=active)` 존재 여부 확인
5. 실패 시 403 반환

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
