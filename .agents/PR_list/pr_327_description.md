# PR #327 — FIX: 폴더 요약 버그 해소 + 기술스택/파일요약 UI 개선 (순서18)

- **브랜치**: `fix/guide-ui-improvements` → `main`
- **검증 커밋**: `a2e484a`
- **URL**: https://github.com/kosa-bistelligence-2026-mini2-04/CodeMap/pull/327

## 개요

온보딩 가이드북 UI의 세 가지 핵심 개선사항을 반영한 PR입니다.

### 수정된 버그 및 개선사항

**1. 폴더 요약 탭 — 빈 토글 문제 근본 해소**
- 백엔드 `DocFolderSummaryItem.description` 필드명을 `summary`로 통일
- 프론트엔드 타입(`DocFolderSummary.summary`)과 JSON 키가 불일치하여 항상 `undefined`를 반환하던 버그 수정
- 토글 아코디언 방식 → **카드형 레이아웃**으로 교체 (요약 항상 노출)

**2. 기술 스택 탭 — 주언어 분리 및 3-존 구조**
- 백엔드 `_normalize_primary_language()` 함수 추가, `DocGetJsonData`에 `primaryLanguage` 필드 추가
- 기술스택을 **주 언어(하이라이트) / 기술스택 / 기타·미분류** 3개 섹션으로 분리
- 주 언어는 액센트 컬러 배지로 강조, 중복 제거

**3. 파일 단위 요약 탭 — 폴더 그룹 아코디언**
- 왼쪽 파일 목록을 **폴더별 그룹 아코디언**으로 재설계
- 폴더 클릭 시 해당 폴더의 요약 설명 오른쪽 패널에 표시
- 파일 클릭 시 기존 파일 상세 정보 표시 (읽기 순서, 위험 여부, 폴더 요약, 파일 요약)

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|-----------|
| `backend/app/gen/schemas.py` | `DocFolderSummaryItem.description → summary`, `DocGetJsonData.primaryLanguage` 추가 |
| `backend/app/gen/service.py` | `_normalize_folder_summaries` 수정, `_normalize_primary_language()` 추가 |
| `frontend/src/common/types/contracts.ts` | `DocGetJsonData.primaryLanguage` 필드 추가 |
| `frontend/src/features/docs/components/GuideViewer.tsx` | `FolderSummariesPanel` 카드형 변환, `StackPanel` 3-존 구조 |
| `frontend/src/features/docs/components/FileSummaryPanel.tsx` | 폴더 그룹 아코디언 재설계 |
| `frontend/src/features/docs/__tests__/docsApi.typecheck.ts` | `primaryLanguage` 픽스처 추가 |
| `frontend/src/features/docs/__tests__/fileSummary.typecheck.ts` | `primaryLanguage` 픽스처 추가 |

## 테스트 결과

- 백엔드 단위 테스트: 82개 통과 (라우터 테스트는 jwt 환경 이슈 — 기존과 동일)
- TypeScript 컴파일: `tsc --noEmit` 에러 0건
- Self 리뷰: 9대 정적 검증 항목 전체 통과

## Self 리뷰 정적 검증 결과

1. **KeyError 방어**: `report.get("stack")` 등 전 구간 `.get()` 사용 — 이상 없음
2. **Null-Safety**: `primaryLanguage: str | None`, TypeScript `string | null` 양측 완비 — 이상 없음
3. **Exception Safety**: 단순 데이터 매핑 함수 — 예외 경로 없음
4. **비동기 블로킹**: 변경 없음
5. **데이터 불변성**: Pydantic 신규 인스턴스 생성 방식 — 원본 안전
6. **연계 영향도**: `DocGetJsonData` 변경 → 2개 typecheck 픽스처 모두 업데이트 완료
7. **리소스 누수**: 해당 없음
8. **관측가능성**: 변경 없음
9. **타입 엄격성**: Pydantic alias + TypeScript 인터페이스 동기화 완료
