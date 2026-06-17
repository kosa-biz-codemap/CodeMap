<!-- Converted from Notion HTML export: 배포전 검증가이드 907cc46ed95482dab4438102761cae47.html -->

📑

# 배포전 검증가이드

## [QA/Ops] 10. TEST-DOCS-DEPLOY

섹션 설명:

기능 구현 후 팀원 환경과 배포 환경에서 같은 결과가 재현되도록 검증하는 영역이다. 테스트, README, 구현 노트, Docker, 배포 문서, 보안 검증을 담당한다.

| 기능 축 | 섹션 | ID | 우선순위 | 대상 파일 | 작업 내용 | 세부 구현 | 완료 기준 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5. 검증/문서화/배포 | backend test | QA-01 | P0 | `backend/tests/test_health.py` | health endpoint 테스트 작성 | `/api/health` status, service, mock\_mode 검증 | backend 기본 테스트 통과 |
| 5. 검증/문서화/배포 | backend test | QA-02 | P0 | `backend/tests/test_routes.py` | analyze/report/history API 테스트 작성 | analyze 요청, job id, history, report 404/200 검증 | 주요 API 회귀 방지 |
| 5. 검증/문서화/배포 | backend test | QA-03 | P1 | `backend/tests/test_repo_cloner.py` | repo cloner 테스트 작성 | URL validation, exclude pattern, cleanup 검증 | clone 로직 안정성 검증 |
| 5. 검증/문서화/배포 | backend test | QA-04 | P1 | `backend/tests/test_progress_bus.py` | progress bus 테스트 작성 | publish/subscribe/final event/cleanup 검증 | WebSocket event 기반 안정성 검증 |
| 5. 검증/문서화/배포 | frontend test | QA-05 | P1 | `frontend/src/lib/sanitize.test.ts` | HTML sanitizer 테스트 작성 | script, onClick, javascript href 제거 검증 | XSS 방어 회귀 방지 |
| 5. 검증/문서화/배포 | frontend test | QA-06 | P1 | `frontend/src/lib/api.test.ts` | API client 테스트 작성 | success/error response, report fetch error 검증 | 실패 응답 처리 안정화 |
| 5. 검증/문서화/배포 | docs | QA-07 | P0 | `docs/core_features.md` | MVP 기능 범위 동기화 | 4대 핵심 기능과 실제 구현 범위 정리 | 발표 문서와 코드 불일치 제거 |
| 5. 검증/문서화/배포 | docs | QA-08 | P0 | `docs/current-work.md` | 현재 작업 상태 문서화 | 현재 branch, 목표, 진행 상태, 담당 영역, 명령 기록 | 팀원/다른 Codex 세션이 이어받기 가능 |
| 5. 검증/문서화/배포 | docs | QA-09 | P1 | `docs/implementation-notes.md` | 구현 의사결정 기록 | agent pipeline, report schema, 보안 정책 설명 | 후속 개발자가 구조 이해 가능 |
| 5. 검증/문서화/배포 | README | QA-10 | P0 | `README.md` | 최종 실행/검증 명령 추가 | backend/frontend 실행, test, build, docker 명령 정리 | 팀원이 로컬에서 같은 결과 재현 |
| 5. 검증/문서화/배포 | deploy | QA-11 | P1 | `docker-compose.yml` | 통합 실행 검증 | frontend/backend compose 실행, port/env 확인 | 데모 환경에서 한 번에 실행 가능 |
| 5. 검증/문서화/배포 | deploy | QA-12 | P1 | `README.md` | 배포 체크리스트 작성 | env, CORS, API base URL, WebSocket URL, storage path 확인 항목 추가 | 배포 전 누락 항목 확인 가능 |
