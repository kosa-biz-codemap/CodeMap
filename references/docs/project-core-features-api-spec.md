<!-- Converted from Notion HTML export: 프로젝트 핵심기능 (기능 명세서 + API 명세서) 468cc46ed95483cca2d48117d284795c.html -->

1️⃣

# 프로젝트 핵심기능 (기능 명세서 + API 명세서)

---

할 일

1. 기능 통합 : 각자 적어놓은 정보 많아서 가시성 확보x

2. 기능 명세서 확보 후, 하단에 API 명세서 작성

3. 6/17(수) 파트 분배 ( 방식 2가지 → 4파트를 1명씩 맡기 | 1파트 4명씩 총 4번 )

프로 젝트 핵심기능(v1)

MVP(최소 기능 제품) 구현을 위한 **Phase 1(핵심 기능)**과 이후 점진적으로 도입할 **Phase 2(고도화 추가 기능)**으로 분할하여 관리합니다. 기능 명세서는 사용자에게 직접적인 비즈니스 가치를 제공하는 기능에만 집중하므로, 인프라 구축이나 내부 DB 설계(ERD) 등의 기술적 선행 작업은 명세서에서 제외합니다.

🏗️

- 기능 id 규칙보기

  **[기능 ID 명명 규칙 (Domain-Driven Naming Convention)]**
  작업 할당과 역할 분담의 명확성을 위해 철저한 도메인 주도 설계(DDD)를 기반으로 기능 ID를 부여합니다. 모든 기능의 최종 코드는 `{대분류ID}-{모듈명}-{F/B}-{3자리_번호}` 형식을 따릅니다.

  - **대분류 ID**: 비즈니스 도메인 카테고리 (예: `PROJECT`, `RAG`, `AGENT`, `DOCS`, `COMMON`)

  - **모듈명**: 도메인 내 세부 서브모듈/폴더명 (예: `REPO`, `PARSE`, `EMBED`, `CHAT`, `SEARCH`, `GEN` 등)

  - **F/B**: 개발 계층 (F: Frontend, B: Backend)

  - **3자리 번호**: 아키텍처 폴더/계층을 매핑하는 3자리 숫자 대역

    - **프론트엔드 (F - FSD 아키텍처 기준)**:

      - `1xx`: Pages / Views (화면 진입점 페이지)

      - `2xx`: UI Components (재사용 및 개별 컴포넌트)

      - `3xx`: API Hooks / Queries (서버 통신 훅)

      - `4xx`: Model / Store (Zustand 등 상태 관리 및 클라이언트 비즈니스 로직)

      - `5xx`: Types / Utils (공통 타입 정의 및 유틸리티)

    - **백엔드 (B - 3-Tier 아키텍처 기준)**:

      - `1xx`: Router (API 엔드포인트 진입점)

      - `2xx`: Service (핵심 비즈니스 로직)

      - `3xx`: Repository (DB CRUD 및 데이터베이스 접근 DAO)

      - `4xx`: Schemas (Pydantic Request/Response DTO)

      - `5xx`: Models (SQLAlchemy 테이블 Entity)

    - **예시**

      - *백엔드*: 프로젝트 등록(`PROJECT`)의 저장소 연동(`REPO`) 백엔드(`B`) Router API 👉 `PROJECT-REPO-B-101`

      - *프론트엔드*: 프로젝트 등록(`PROJECT`)의 저장소 연동(`REPO`) 프론트엔드(`F`) UI 입력 폼 👉 `PROJECT-REPO-F-201`

- 우선순위 기준

  | 우선순위 | 의미 |
  | --- | --- |
  | P0 | MVP 동작에 반드시 필요한 작업 |
  | P1 | 데모 완성도와 안정성을 높이는 작업 |
  | P2 | 후속 고도화 또는 정리 작업 |

1️⃣

프로젝트 등록 (Git 클론 및 필터링)

- **기능 개요**: 사용자가 입력한 Git 저장소의 소스코드를 실시간으로 복제하고, 분석에 필요한 정보만 걸러내어 저장.

- **원클릭 저장소 연동**: 브라우저 화면에서 GitHub URL만 입력하면 서버 내부에 실시간 복제.

- **지능형 노이즈 필터링**: `node_modules`, `build`, 바이너리 파일 등을 자동 제외하고, 설정/문서 파일은 보존하여 분석 효율을 극대화합니다.

#### PROJECT

| ID | 기능 명칭 (대분류) | 모듈명 | 분류 | 기능명 | 상세 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- | --- |
| [PROJECT-LIST-B-101](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-LIST-B-101%20e94cc46ed95483fdaf3c01123425f0b0.html) | PROJECT | LIST | Backend | 레포 목록 조회 API | `GET /api/analysis` 전체 분석 이력 목록 반환 |  |
| [PROJECT-LIST-B-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-LIST-B-201%2019ccc46ed95483a5931e814d087a2296.html) | PROJECT | LIST | Backend | 레포 크기, 파일 수 사전 검증 | clone 전 파일 수·용량이 제한 초과 여부 확인 및 초과 시 사용자 안내 |  |
| [PROJECT-LIST-F-101](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-LIST-F-101%20745cc46ed954831e8d9c0193e70e77c5.html) | PROJECT | LIST | Frontend | 분석 이력 목록 화면 | 이미 분석한 레포 목록과 각 분석상태(완료,처리중,실패)를 조회하는 홈화면 |  |
| [PROJECT-REPO-B-101](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-REPO-B-101%203bbcc46ed954824f82730103e753e4b0.html) | PROJECT | REPO | Backend | 프로젝트 등록 API | `POST /api/analysis` 요청 처리 |  |
| [PROJECT-REPO-B-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-REPO-B-201%20ff2cc46ed95483cb9f0f81b9ef86a8e4.html) | PROJECT | REPO | Backend | Git Clone 처리 | 서버 내부 임시 디렉토리에 저장소 복제 |  |
| [PROJECT-REPO-B-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-REPO-B-202%20335cc46ed9548200bc4d811608bd5fff.html) | PROJECT | REPO | Backend | 파일 필터링 | `node\_modules`, `.git`, `build`, `dist`, 'venv', '.next', '.env', 'key' 바이너리 파일 제외 |  |
| [PROJECT-REPO-B-203](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-REPO-B-203%205b5cc46ed95483229ea481b6d0d6af78.html) | PROJECT | REPO | Backend | clone timeout 처리 | timeout seconds 설정, subprocess error capture, 실패 시 cleanup |  |
| [PROJECT-REPO-B-204](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-REPO-B-204%2001ccc46ed95482ef91ef01fcb925371c.html) | PROJECT | REPO | Backend | 전체 분석 순서 정의 | clone → code map → doc generation → onboarding guide → report 저장 |  |
| [PROJECT-REPO-B-205](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-REPO-B-205%20381cc46ed954804f9346c7063e4c57a5.html) | PROJECT | REPO | Backend | job별 event queue 관리 | publish, subscribe, timeout, cleanup 구현 |  |
| [PROJECT-REPO-B-301](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-REPO-B-301%20381cc46ed954808584b4fae93f0c6ce1.html) | PROJECT | REPO | Backend | Git 저장소 URL 검증 | GitHub URL 형식 유효성 검사 및 예외 처리, job\_id 반환 |  |
| [PROJECT-REPO-B-302](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-REPO-B-302%20381cc46ed95480afa3ffc0ad6acbb246.html) | PROJECT | REPO | Backend | 프로젝트 메타데이터 저장 | repo\_name, owner, branch, clone\_path 저장 |  |
| [PROJECT-REPO-F-101](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-REPO-F-101%20381cc46ed9548099b180f4be98a57cd4.html) | PROJECT | REPO | Frontend | progress WebSocket endpoint 정리 | frontend ProgressPanel에 이벤트 전달, /ws/progress/{job\_id} 연결, subscribe, disconnect cleanup |  |
| [PROJECT-REPO-F-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-REPO-F-201%20dbccc46ed954833db2a48194ffe59526.html) | PROJECT | REPO | Frontend | GitHub URL 입력 UI | 사용자가 GitHub 저장소 URL을 입력할 수 있는 입력 폼 제공 |  |
| [PROJECT-REPO-F-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-REPO-F-202%20381cc46ed95480188b81fefef4852f00.html) | PROJECT | REPO | Frontend | 저장소 분석 요청 버튼 | URL 검증 후 Backend API 호출 |  |
| [PROJECT-REPO-F-203](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/PROJECT/PROJECT-REPO-F-203%20381cc46ed95480bea3fee82350adf71e.html) | PROJECT | REPO | Frontend | 분석 진행 상태 UI | Clone / 분석 진행 상태(로딩, 성공, 실패) 표시 |  |

2️⃣

코드 맥락 및 관계망 이해 (RAG 및 코드 임베딩)

- **기능 개요**: 단순 단어 비교 검색을 뛰어넘어, 코드가 갖는 고유한 역할, 설계 의미, 파일 간의 연결 관계를 학습해 의미 기반 사전을 구축.

- **유기적 관계망 지도 구축**: 의존성 및 Import 흐름을 추적하여 논리적 지도를 구성하고 상향식으로 개념을 탐색.

- **자연어 질문 해석**: 평상어 질문 문맥을 파악해 의도에 맞는 소스코드 파일을 정확히 탐색합니다.

#### RAG

| ID | 기능 명칭 (대분류) | 모듈명 | 분류 | 기능명 | 상세 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- | --- |
| [RAG-PARSE-B-206](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-PARSE-B-206%20381cc46ed95481278b6df89c608bae2b.html) | RAG | PARSE | Backend | 기술 스택 추론 | package.json, requirements.txt, Dockerfile, docker-compose.yml 기반 프레임워크·런타임 자동 탐지 |  |
| [RAG-PARSE-F-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-PARSE-F-201%20381cc46ed95480edb170d6049f33f331.html) | RAG | PARSE | Frontend | 구조 분석 결과 표시 UI | 파일 트리·기술 스택·진입점 탐지 결과를 화면에 시각적으로 표시 |  |
| [RAG-PARSE-B-205](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-PARSE-B-205%20381cc46ed95480849bb1d541b559e09d.html) | RAG | PARSE | Backend | 실행 방법 추론 | install/run command 자동 생성 |  |
| [RAG-PARSE-B-204](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-PARSE-B-204%20381cc46ed95480358b9ef48a1eb37f86.html) | RAG | PARSE | Backend | 설정 파일 탐색 | `package.json`, `requirements.txt`, `docker-compose` 등 분석 |  |
| [RAG-PARSE-B-203](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-PARSE-B-203%2001acc46ed9548391b3a6813ec7fb5131.html) | RAG | PARSE | Backend | 핵심 파일 탐색 | entry point(`main.py`, `App.tsx` 등) 자동 탐색 |  |
| [RAG-PARSE-B-101](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-PARSE-B-101%2039ecc46ed95483328ca701375a894e38.html) | RAG | PARSE | Backend | 분석 결과 조회 API | `GET /api/analysis/{repo\_id}` 반환 |  |
| [RAG-PARSE-B-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-PARSE-B-201%203cecc46ed95483b7b76901dcc43cff77.html) | RAG | PARSE | Backend | README 분석 | README를 기반으로 프로젝트 목적 및 핵심 기능 추출 |  |
| [RAG-PARSE-B-208](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-PARSE-B-208%20a0acc46ed95482ac918381eecbe617aa.html) | RAG | PARSE | Backend | 파일 간 import 관계 분석 | 의존 파일 목록 추출 [7. CODE-MAP ANALYSIS] AST 청킹, 의존성 트리, 엔트리포인트, 설정파일 종합 분석 파이프라인 간단히 파싱 |  |
| [RAG-PARSE-B-209](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-PARSE-B-209%20e6ccc46ed95483d6b04e01c557ccbb94.html) | RAG | PARSE | Backend | 계층형 Bottom-up 요약 로직 | 파일 요약 → 폴더 요약 → 프로젝트 마스터 요약 순서로 상향식 요약 파이프라인 구성 (Tree-based RAG 핵심) |  |
| [RAG-EMBED-B-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-EMBED-B-201%201e7cc46ed95483a3a85b813a4a42d7be.html) | RAG | EMBED | Backend | 임베딩 생성 | 코드 및 문서를 벡터화 |  |
| [RAG-PARSE-B-207](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-PARSE-B-207%2024fcc46ed954826f9a9181a7d43bdffa.html) | RAG | PARSE | Backend | AST 기반 코드 청킹 | 함수/클래스 단위 코드 분리 |  |
| [RAG-PARSE-B-210](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-PARSE-B-210%2079acc46ed95483e393790140e7d6a308.html) | RAG | PARSE | Backend | 구조 분석 agent 구현 | 파일 트리, stack, entrypoint, risk, heatmap 결과 반환 |  |
| [RAG-PARSE-B-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-PARSE-B-202%20833cc46ed95482788e8f01624f9ab118.html) | RAG | PARSE | Backend | 디렉토리 구조 분석 | 프로젝트 폴더 트리 구조 생성 |  |
| [RAG-EMBED-B-301](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/RAG/RAG-EMBED-B-301%20fc2cc46ed954831497378141e6b3d3ef.html) | RAG | EMBED | Backend | pgvector 저장 | 임베딩 및 메타데이터 저장 |  |

3️⃣

자율 탐색형 AI 코드 분석 (Agentic Search)

- **기능 개요**: AI 비서가 스스로 계획을 세우고 디렉토리를 열어보며 답을 찾아내는 자율형 탐색 기능.

- **자가 교정(Self-Correction)**: 탐색 실패 시 다른 경로를 탐색하여 오류를 자가 검증. 무한 분석 루프 방지를 위해 최대 5회, 처리 시간 20초로 제한.

- **명확한 출처 제공**: 답변 시 소스코드 파일명과 줄 번호를 제공하여 신뢰성을 확보.

#### AGENT

| ID | 기능 명칭 (대분류) | 모듈명 | 분류 | 기능명 | 상세 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- | --- |
| [AGENT-CORE-F-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CORE-F-201%20381cc46ed954805f9b0cd274e2c577bb.html) | AGENT | CORE | Frontend | ReportJsonResponse 필드 확정 | summary, stack, file\_map, recommendations, heatmap, durations, guide 포함, frontend와 report 계약 고정 |  |
| [AGENT-CORE-B-204](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CORE-B-204%20381cc46ed95480f5b141fc443ee25420.html) | AGENT | CORE | Backend | agent 실패 처리 | 실패 agent, error message 저장 및 failed event 발행 |  |
| [AGENT-CORE-B-203](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CORE-B-203%20381cc46ed95480b3b9b7ce832ff4281e.html) | AGENT | CORE | Backend | agent 실행 시간 측정 | 각 agent start/end timestamp 기록 |  |
| [AGENT-CORE-B-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CORE-B-202%20381cc46ed9548008b432e39b0fcc8893.html) | AGENT | CORE | Backend | completed/failed 후 cleanup | final event 이후 queue 정리 |  |
| [AGENT-CORE-B-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CORE-B-201%20381cc46ed9548062ba1adeca456b259e.html) | AGENT | CORE | Backend | agent 시작/완료 이벤트 발행 | agent\_status, agent\_completed, completed, failed 이벤트 publish |  |
| [AGENT-CHAT-F-203](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CHAT-F-203%20381cc46ed954818d922fcb3f2b7e54f8.html) | AGENT | CHAT | Frontend | 관련 파일 검색 | 벡터 검색 기반 관련 코드 탐색 |  |
| [AGENT-CHAT-F-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CHAT-F-202%20381cc46ed954813d908aff2e084892b9.html) | AGENT | CHAT | Frontend | 탐색 루프 횟수/시간 제한 | 에이전트 도구 호출 최대 5회·처리 시간 최대 20초 제한, 초과 시 수집 정보 기반 최선 답변 반환 |  |
| [AGENT-CHAT-B-101](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CHAT-B-101%20381cc46ed954806c9d32e3461ced2b12.html) | AGENT | CHAT | Backend | Repo Chat API | `POST /api/chat/{repo\_id}` |  |
| [AGENT-SEARCH-B-204](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-SEARCH-B-204%20381cc46ed95480d88d30df7c9e0404cb.html) | AGENT | SEARCH | Backend | 에이전트 탐색 과정 표시 UI | 에이전트가 현재 탐색 중인 파일·단계를 실시간으로 화면에 표시 |  |
| [AGENT-CHAT-F-205](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CHAT-F-205%20381cc46ed95480c3806cc9010c4e4aa6.html) | AGENT | CHAT | Frontend | 답변 스트리밍 UI | LLM 답변을 실시간 스트리밍으로 받아 타이핑 효과로 표시 |  |
| [AGENT-CHAT-B-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CHAT-B-201%2019bcc46ed95482bdb82181df74fe83e8.html) | AGENT | CHAT | Backend | 코드 컨텍스트 생성 | 관련 파일을 묶어 LLM Context 구성 |  |
| [AGENT-SEARCH-B-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-SEARCH-B-201%20230cc46ed95482cab55e0198e919c082.html) | AGENT | SEARCH | Backend | 자가 교정 탐색 | 탐색 실패 시 최대 5회 재탐색 |  |
| [AGENT-CHAT-F-204](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CHAT-F-204%202cdcc46ed9548292914a01f2e26c8d16.html) | AGENT | CHAT | Frontend | 스트리밍 응답 처리 | FastAPI SSE(Server-Sent Events) 기반 LLM 응답 스트리밍 처리 |  |
| [AGENT-SEARCH-B-203](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-SEARCH-B-203%20787cc46ed954833e8c820145ae16e4e0.html) | AGENT | SEARCH | Backend | LLM 답변 생성 | 프로젝트 맥락 기반 응답 생성 |  |
| [AGENT-SEARCH-B-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-SEARCH-B-202%20b39cc46ed95482fc8b5781e83c188b9b.html) | AGENT | SEARCH | Backend | Repo Chat UI | 사용자 질문 입력창 제공 |  |
| [AGENT-CHAT-F-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CHAT-F-201%205dbcc46ed9548273bdb8010d098f3485.html) | AGENT | CHAT | Frontend | AI 응답 UI | 답변 및 참조 파일명 표시 |  |
| [AGENT-CHAT-F-206](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CHAT-F-206%20828cc46ed954832fa3508194a727c3df.html) | AGENT | CHAT | Frontend | 질문 의도 분석 | 자연어 질문 파싱 |  |
| [AGENT-CHAT-B-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-CHAT-B-202%20de3cc46ed954836b94100193a1e48d4b.html) | AGENT | CHAT | Backend | 출처 파일 반환 | 파일명 및 line 정보 제공 |  |
| [AGENT-SEARCH-B-205](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/AGENT/AGENT-SEARCH-B-205%20e06cc46ed95483ec800881e3284dc7be.html) | AGENT | SEARCH | Backend | 에이전트 탐색 도구 정의 | 에이전트가 호출할 코드 탐색 도구(grep 검색·파일 읽기·디렉토리 탐색) 정의 및 등록 |  |

4️⃣

계층형 프로젝트 가이드북 자동 생성 (Map-Reduce 문서화)

- **기능 개요**: 방대한 코드를 읽지 않아도 한눈에 파악할 수 있는 고품질의 Markdown 형식 '프로젝트 가이드북'을 자동 집필.

- **상향식 정보 집필**: 개별 소스코드 요약 -> 폴더 요약 -> 마스터 리포트로 융합.

- **아키텍처 시각화**: 저장소 연동 직후 트리, 핵심 데이터 흐름을 시각적으로 제공하여 온보딩 리소스 절감.

#### DOCS

| ID | 기능 명칭 (대분류) | 모듈명 | 분류 | 기능명 | 상세 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- | --- |
| [DOCS-GEN-B-101](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GEN-B-101%200e6cc46ed95482c7aaa9010ac4c86b7c.html) | DOCS | GEN | Backend | 가이드북 조회 API | `GET /api/docs/{repo\_id}` 생성된 온보딩 가이드북 Markdown 반환 |  |
| [DOCS-GEN-B-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GEN-B-201%20f2dcc46ed95482e2ad1201704933ec33.html) | DOCS | GEN | Backend | 문서 요약 agent 구현 | README, config, package, route 파일 기반 프로젝트 설명 생성 |  |
| [DOCS-GEN-B-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GEN-B-202%20139cc46ed9548324841d81105d774e4e.html) | DOCS | GEN | Backend | 온보딩 guide agent 구현 | 읽을 순서, 수정 시작점, 위험 파일, 추천 task 생성 |  |
| [DOCS-GEN-B-203](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GEN-B-203%20746cc46ed95483ff83088102e6fe19b9.html) | DOCS | GEN | Backend | 폴더 단위 요약 | 하위 파일 요약 기반 디렉토리 설명 생성 |  |
| [DOCS-GEN-B-204](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GEN-B-204%20f7ecc46ed9548340975a819a19fb9829.html) | DOCS | GEN | Backend | 프로젝트 마스터 리포트 생성 | 최종 온보딩 문서 통합 |  |
| [DOCS-GEN-B-205](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GEN-B-205%20381cc46ed954808b99c3c59b86d37b86.html) | DOCS | GEN | Backend | README 기반 프로젝트 소개 생성 | 프로젝트 목적 및 핵심 기능 요약 |  |
| [DOCS-GEN-B-206](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GEN-B-206%20b77cc46ed95483c0a6bf81bc481c74fa.html) | DOCS | GEN | Backend | 핵심 실행 플로우 설명 | 요청 흐름 및 핵심 구조 설명 |  |
| [DOCS-GEN-B-207](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GEN-B-207%206dbcc46ed954837caab181110dedd70f.html) | DOCS | GEN | Backend | 문서 재생성 | 기존 분석 기반 재생성 기능 |  |
| [DOCS-GEN-B-301](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GEN-B-301%20498cc46ed9548261ab86019760f2afc6.html) | DOCS | GEN | Backend | Markdown 저장 | 생성 결과 DB 저장 |  |
| [DOCS-GEN-F-101](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GEN-F-101%20257cc46ed954831d978681d5098b4e7c.html) | DOCS | GEN | Frontend | 온보딩 문서 화면 | JSON 기반 결과 렌더링 |  |
| [DOCS-GEN-F-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GEN-F-201%2086fcc46ed95483e5922d813cd3a63206.html) | DOCS | GEN | Frontend | 문서 다운로드 UI | JSON → Markdown / HTML → PDF 다운로드 버튼 제공 |  |
| [DOCS-GEN-F-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GEN-F-202%20381cc46ed95480c2a3b7e9b644659a5c.html) | DOCS | GEN | Frontend | 파일 단위 요약 | 개별 코드 파일 요약 생성 |  |
| [DOCS-GEN-F-203](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GEN-F-203%20381cc46ed95480cd8ec8cfeefc923af0.html) | DOCS | GEN | Frontend | 추천 읽기 순서/수정 전 주의점 생성 | 신입 개발자 기준 파일 읽기 순서 및 다음행동 제안 제공 |  |
| [DOCS-GUARD-B-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/DOCS/DOCS-GUARD-B-201%20381cc46ed9548161823ee966bf5579a0.html) | DOCS | GUARD | Backend | 민감정보 마스킹 | API key, token, password pattern 탐지 시 원문 제거. report 생성 전 report에 민감정보 원문 미노출하도록 검증 |  |

🥈

**Phase 2: 고도화 추가 기능 (유연한 수정/추가 가능)**

#### Phase2

| 대분류 ID | 기능 명칭 (대분류) | 소분류 ID | 분류 | 기능명 | 상세 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- | --- |
| [PROJECT-LIST-B-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/PROJECT-LIST-B-202%200a4cc46ed9548352bea30134750413dc.html) | PROJECT | LIST | Backend | Service | 프로젝트 목록 조회 및 관리 | 단일 레포 분석 우선으로 인한 보류 (UI/API) |
| [PROJECT-LIST-B-301](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/PROJECT-LIST-B-301%2043dcc46ed9548355bc8881fe4ea5cafa.html) | PROJECT | LIST | Backend | Repository | 분석 job metadata 저장 | job id, repo url, status, created\_at, updated\_at 저장 |
| [PROJECT-LIST-F-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/PROJECT-LIST-F-201%20e43cc46ed95483dea01001ead667ad96.html) | PROJECT | LIST | Frontend | UI Component | store에서 최근 job 목록 조회 | frontend HistoryList 표시 가능 |
| [PROJECT-LIST-F-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/PROJECT-LIST-F-202%20404cc46ed954826ea91f81ba1c1297ef.html) | PROJECT | LIST | Frontend | UI Component | job 상태 업데이트 | queued/running/completed/failed 상태 저장, frontend가 최신 상태 재조회 가능 |
| [PROJECT-LIST-F-203](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/PROJECT-LIST-F-203%200a8cc46ed95482c0897c013b0f2227b3.html) | PROJECT | LIST | Frontend | UI Component | 실패 job error 저장 | exception message, failed agent, timestamp 저장, frontend에서 실패 원인 표시 가능 |
| [PROJECT-PIPELINE-B-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/PROJECT-PIPELINE-B-201%2042ecc46ed95482058163813bfab87a25.html) | PROJECT | PIPELINE | Backend | Service | 분석 단계 상태 관리 | repository상태를 shallo\_done/deep\_processing/deep\_done으로 분리 저장 및 전환 처리 |
| [PROJECT-PIPELINE-B-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/PROJECT-PIPELINE-B-202%20381cc46ed95480df91f6d28e8a60c281.html) | PROJECT | PIPELINE | Backend | Service | 비동기 깊은 분석 파이프라인 | 얕은 분석 완료후 함수/클래스 요약,의존성 추적,Map-Reduce를 백그라운드 비동기 병렬 처리 |
| [PROJECT-PIPELINE-B-203](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/PROJECT-PIPELINE-B-203%20381cc46ed95480d4975ad499d5ccfa86.html) | PROJECT | PIPELINE | Backend | Service | 파이프라인 외부 연동 | 초기 기능 명세 외 범위로 보류 |
| [PROJECT-PIPELINE-F-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/PROJECT-PIPELINE-F-201%20381cc46ed95480f48b73f6f47ad504c2.html) | PROJECT | PIPELINE | Frontend | UI Component | 현재 분석 수준 안내 메시지 | 심층 용약 요청시 “ ㅎ현재 1차분서만 완료 - 파일트리, 주요 파일목적, 실행 단서는 지금도 제공가능” 처럼 현재 가능한 범위를 투명하게 안내함 |
| [PROJECT-PIPELINE-F-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/PROJECT-PIPELINE-F-202%20381cc46ed954807ba4e4dfa6a03fee30.html) | PROJECT | PIPELINE | Frontend | UI Component | 얕은/깊은 분석 분리 프로그레스 UI | PHase1 기본 상태UI(로딩,성공,실패)를 얕은 분석 (파일트리,README)과 깊은 분석(함수 요약, 의존서으MAP-Reduce) 2단계로 고도화한 프로그레스바 표시 |
| [PROJECT-PIPELINE-F-301](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/PROJECT-PIPELINE-F-301%20381cc46ed95480aabfdde14f01bfaeff.html) | PROJECT | PIPELINE | Frontend | API/Query | 진행률 실시간 수신 | SSE 또는 Polling으로 분석 진행률 수신후 프로그레스 바에 반영 |
| [PROJECT-REPO-B-303](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/PROJECT-REPO-B-303%20381cc46ed95480009e47e604e91628e9.html) | PROJECT | REPO | Backend | Repository | 중복 저장소 검사 | 이미 분석된 URL 여부 확인 |
| [RAG-GRAPH-B-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/RAG-GRAPH-B-201%20381cc46ed9548071a8a6cd048d8dec61.html) | RAG | GRAPH | Backend | Service | 의존성 그래프 시각화 | Import 관계 노드/엣지 그래프 렌더링을 위한 데이터 처리 및 D3.js 기반 UI |
| [RAG-GRAPH-F-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/RAG-GRAPH-F-201%20381cc46ed95480d89a1fe78d725519a0.html) | RAG | GRAPH | Frontend | UI Component | 의존성 관계 그래프 UI | imports / imported\_by 메타데이터 기반 파일 간 의존성을 인터랙티브 그래프(react-flow 또는 mermaid)로 렌더링 |
| [RAG-PARSE-B-211](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/RAG-PARSE-B-211%20381cc46ed954800786ecf980179526a5.html) | RAG | PARSE | Backend | Service | 위험 신호 태깅 | auth, db, env, payment, external API, migration, security 키워드 탐지. 위험 파일 목록 생성 |
| [RAG-PARSE-B-212](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/RAG-PARSE-B-212%20381cc46ed95481f4a6fbdee6cf9f4db2.html) | RAG | PARSE | Backend | Service | 기술 스택 점수화 | 기술 스택 숙련도 및 품질 상세 메트릭 분석 기능 보류 |
| [RAG-PARSE-F-202](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/RAG-PARSE-F-202%20381cc46ed9548118b3dcea74cc0e9e82.html) | RAG | PARSE | Frontend | UI Component | heatmap용 risk score 생성 | 파일 크기, import 수, 위험 키워드, config 여부 기반 점수화, frontend HeatmapChart 입력 데이터 생성 |
| [AGENT-CHAT-B-203](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/AGENT-CHAT-B-203%20381cc46ed95481bfa3f7e2dadc681750.html) | AGENT | CHAT | Backend | Service | 장기 기억 (Long-term Memory) | 사용자 세션 기반 지속적인 장기 기억 관리 로직 보류 |
| [AGENT-SEARCH-B-206](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/AGENT-SEARCH-B-206%20381cc46ed954815ab7ecdf44ad5125c2.html) | AGENT | SEARCH | Backend | Service | 자율 외부 도구 사용 | 에이전트가 인터넷 검색 등 외부 도구를 자율적으로 사용하는 로직 보류 |
| [AGENT-SEARCH-B-207](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/AGENT-SEARCH-B-207%20381cc46ed954812dbb55c0a8a31886c4.html) | AGENT | SEARCH | Backend | Service | Advanced Reasoning | 단순 질의응답을 넘어서는 심층 추론 로직 보류 |
| [DOCS-GEN-B-208](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/DOCS-GEN-B-208%20381cc46ed9548163b24aded3b05d1976.html) | DOCS | GEN | Backend | Service | 추천 작업 생성 | github issue 추천. 신규 팀원에게 다음 행동 제안 |
| [DOCS-UTIL-B-201](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/DOCS-UTIL-B-201%20381cc46ed954810cbd35f8303dffaf67.html) | DOCS | UTIL | Backend | Service | 번역/PDF/이메일 부가 기능 | 다국어 번역, PDF 추출, 이메일 요약 전송 등 유틸 기능 보류 |
| [Untitled](%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%95%B5%EC%8B%AC%EA%B8%B0%EB%8A%A5%20(%EA%B8%B0%EB%8A%A5%20%EB%AA%85%EC%84%B8%EC%84%9C%20+%20API%20%EB%AA%85%EC%84%B8%EC%84%9C)/Phase2/Untitled%20381cc46ed9548100b6fad18abef19b05.html) |  |  |  |  |  | P2 |

---
