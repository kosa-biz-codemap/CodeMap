# 📋 중간발표 교수님 피드백 및 RDB 설계 보완 방향

> [!NOTE]
> **작성일**: 2026-06-24 (중간발표 직후)
> **목적**: 교수님 구두 피드백 원문 보존 + 현 설계 문서의 RDB 측면 공백 분석 + 보완 방향 정리

---

## 1. 교수님 피드백 원문 (중간발표)

> "로컬과 GitHub 주소 넣는 거 분리한 건 좋다. 로컬에서 Zip 파일을 올리면 서버에서 압축 풀기 기능이 필요하다."
>
> "DB에 벡터 DB와 RDB가 있는데 구분 잘하고 설계 잘 해야 할 것 같다."
>
> "이 파일이 뭔지 질문은 RDB 검색이 더 유리하고, 어떤 검색은 유사도 검색이 더 유리할 수 있음. 아마 이 검색 구현이 힘들 수 있다. 왜냐하면 파일 안에 변수도 있고 함수도 있을 텐데, 파일 선택도 LLM이 하지만 파일 전체 분석도 LLM이 해야 하기 때문에 파일 자체 코드도 DB에 들어가야 하는데, 또 자체 코드만 넣는 것만으로는 안 됨. 파일에 대한 데이터뿐만 아니라 추가적으로… 그래서 결론적으로는 RDB 설계를 잘 해야 함. 다른 팀보다 벡터 DB보다 RDB 비중이 더 높을 수 있음."

### 핵심 요점 정리

| # | 피드백 주제 | 요약 |
|---|---|---|
| 1 | **입력 방식 다양화** | GitHub URL / 로컬 ZIP 업로드 분기 처리 필요 — ZIP은 서버 압축 해제 로직 추가 |
| 2 | **벡터 DB vs RDB 역할 분리** | 두 DB를 단순히 같이 쓰는 게 아니라, 질문 유형에 따라 어느 DB를 우선 쿼리할지 명확한 전략이 있어야 함 |
| 3 | **파일 단위 정형 검색** | "이 파일이 뭐야?" 같은 파일 정체 질문 → Vector Search보다 RDB Exact Match가 훨씬 유리 |
| 4 | **파일 내부 구조의 복잡성** | 파일 안의 함수·클래스·변수는 별도 구조화된 메타데이터로 RDB에 저장해야 LLM이 정밀하게 참조 가능 |
| 5 | **파일 원문 + 메타데이터 동시 저장** | 파일 원문 코드만 저장하는 것으로는 부족 — 파일에 대한 구조적 데이터(심볼 목록, 역할, 타입 등)를 함께 저장해야 함 |
| 6 | **RDB 비중이 타 팀보다 높을 것** | 이 프로젝트는 코드베이스 구조 파악이 핵심이므로, 정형 메타데이터 조회가 벡터 검색만큼 혹은 그 이상으로 중요함 |

---

## 2. 추가 기능 도출: 로컬 ZIP 업로드 지원

피드백 1번에 따라 아래 기능 명세가 신규로 필요합니다.

### 필요 기능 (Phase 1 추가 검토)

| 기능 ID (안) | 기능명 | 설명 |
|---|---|---|
| `PROJECT-REPO-B-206` | ZIP 파일 업로드 수신 | `multipart/form-data`로 `.zip` 파일 수신 및 임시 디렉토리 저장 |
| `PROJECT-REPO-B-207` | ZIP 압축 해제 및 보안 검증 | Python `zipfile` 모듈로 서버 임시 경로에 압축 해제. ZipSlip(경로 탈출 공격) 방어 포함 |
| `PROJECT-REPO-F-205` | ZIP 업로드 UI | 드래그&드롭 또는 파일 선택 폼. GitHub URL 입력 탭과 분리된 탭 UI |

> [!IMPORTANT]
> GitHub URL 입력과 로컬 ZIP 업로드는 **완전히 분리된 분기**로 처리해야 합니다. 클론/해제 후 파일 필터링 파이프라인(`PROJECT-REPO-B-201` ~ `B-203`)은 두 경로 모두 동일하게 통과하도록 공통 인터페이스로 추상화하는 것이 좋습니다.

---

## 3. RDB 설계 관점에서 현 문서의 공백 분석

> [!CAUTION]
> 아래 분석은 기존 문서(`database/init.sql`, `RAG_EMBED_SPEC.md`, `AGENTIC_RAG_ARCHITECTURE.md`, `FUNCTIONAL_SPECIFICATION.md` 등)를 검토한 결과입니다. **팀 회의에서 벡터 DB 중심으로만 논의되었고, RDB의 역할과 쿼리 전략이 거의 명세되지 않았습니다.**

### 3-0. 현재 RDB 구조 현황 (`database/init.sql` 기준)

| 테이블 | 역할 | 현재 상태 |
|---|---|---|
| `analysis_jobs` | 분석 작업 상태 관리 | ✅ 충분히 설계됨 |
| `source_files` | 파일 경로·원문·요약 저장 | ⚠️ 구조적 메타데이터(역할·심볼) 없음 |
| `code_chunks` | AST 청킹 + 임베딩 벡터 | 벡터 DB 역할에 치중 |
| `code_nodes` | 청크 + 임베딩 통합 (신버전) | 벡터 DB 역할에 치중 |
| `code_dependencies` | import 관계 그래프 | ⚠️ 파일 레벨만, 심볼(함수) 레벨 관계 없음 |
| `file_dependencies` | import 관계 (구버전) | ⚠️ `code_dependencies`와 중복, 정리 필요 |
| `chat_conversations` | 대화 세션 | ✅ 충분히 설계됨 |
| `chat_messages` | 메시지 이력 | ✅ 충분히 설계됨 |

---

### 3-1. 공백 A: `file_symbols` 테이블 부재 — 파일 내부 구조가 RDB에 없음

**문제**

`source_files`는 `raw_code`(원문)와 `file_summary`(LLM 요약)만 저장합니다. 파일 안에 어떤 함수·클래스·변수가 있는지를 RDB에서 정형 쿼리로 조회할 수 없습니다.

**결과적 영향**
- `"login 함수가 어느 파일에 있어?"` → RDB에서 직접 조회 불가, 벡터 검색에만 의존해야 함
- Supervisor Agent가 plan 수립 시 "어느 파일을 읽을지" 판단에 정형 데이터 활용 불가
- AST 청킹(`RAG-PARSE-B-207`)은 이미 심볼 단위로 쪼개고 있는데, 그 결과가 벡터에만 들어가고 RDB에는 남지 않음

**보완 필요 테이블: `file_symbols`**

```sql
CREATE TABLE file_symbols (
    id           UUID PRIMARY KEY,
    file_id      UUID    NOT NULL REFERENCES source_files(id) ON DELETE CASCADE,
    job_id       UUID    NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
    symbol_name  VARCHAR(255) NOT NULL,  -- 함수명 · 클래스명 · 변수명
    symbol_type  VARCHAR(50)  NOT NULL,  -- 'function' | 'class' | 'variable' | 'constant' | 'export' | 'decorator'
    start_line   INTEGER NOT NULL,
    end_line     INTEGER,
    is_exported  BOOLEAN NOT NULL DEFAULT FALSE,
    is_async     BOOLEAN NOT NULL DEFAULT FALSE,  -- async 함수 여부
    docstring    TEXT,                -- 주석 · docstring
    signature    TEXT,                -- 함수 시그니처 (매개변수 포함)
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- 파일별 심볼 조회 인덱스
CREATE INDEX idx_file_symbols_file   ON file_symbols (file_id);
-- 심볼 이름 검색 인덱스 (Exact Match + LIKE 패턴)
CREATE INDEX idx_file_symbols_name   ON file_symbols (symbol_name);
CREATE INDEX idx_file_symbols_type   ON file_symbols (file_id, symbol_type);
CREATE INDEX idx_file_symbols_job    ON file_symbols (job_id);
```

---

### 3-2. 공백 B: `source_files`에 파일 역할·분류 컬럼 없음

**문제**

"이 파일이 뭐야?", "라우터 파일 목록 보여줘"와 같은 질문은 유사도 검색이 아니라 **정형 필터 조회**가 압도적으로 유리합니다. 그러나 현재 파일의 역할(`router`, `service`, `config` 등)이 RDB 컬럼으로 저장되어 있지 않아 SQL WHERE 절로 조회할 수 없습니다.

**보완 필요: `source_files` 컬럼 추가**

```sql
ALTER TABLE source_files ADD COLUMN IF NOT EXISTS file_role         VARCHAR(50);
-- 'router' | 'service' | 'repository' | 'schema' | 'model' | 'config'
-- | 'test' | 'util' | 'entry_point' | 'middleware' | 'migration' | 'unknown'

ALTER TABLE source_files ADD COLUMN IF NOT EXISTS language          VARCHAR(50);   -- 'python' | 'typescript' | 'sql' | 'markdown'
ALTER TABLE source_files ADD COLUMN IF NOT EXISTS file_size_bytes   INTEGER;
ALTER TABLE source_files ADD COLUMN IF NOT EXISTS line_count        INTEGER;
ALTER TABLE source_files ADD COLUMN IF NOT EXISTS symbol_count      INTEGER;       -- file_symbols 행 수 (캐시)
ALTER TABLE source_files ADD COLUMN IF NOT EXISTS fan_out           INTEGER;       -- 이 파일이 import하는 파일 수
ALTER TABLE source_files ADD COLUMN IF NOT EXISTS fan_in            INTEGER;       -- 이 파일을 import하는 파일 수
ALTER TABLE source_files ADD COLUMN IF NOT EXISTS complexity_score  FLOAT;         -- 순환 복잡도 (AST 분석)
ALTER TABLE source_files ADD COLUMN IF NOT EXISTS is_entry_point    BOOLEAN NOT NULL DEFAULT FALSE;
-- main.py, App.tsx, index.ts, __init__.py 등 진입점 여부

-- file_role 기반 필터링 인덱스
CREATE INDEX idx_source_files_role     ON source_files (job_id, file_role);
CREATE INDEX idx_source_files_entry    ON source_files (job_id, is_entry_point);
CREATE INDEX idx_source_files_language ON source_files (job_id, language);
```

---

### 3-3. 공백 C: 질문 유형 → DB 라우팅 전략 문서 없음

**문제**

현재 Supervisor Agent의 `access_plan`은 어떤 *Worker*(dir/grep/search/read)를 쓸지만 명세되어 있습니다. 어떤 질문을 **벡터 DB**로 보내고 어떤 질문을 **RDB 쿼리**로 처리할지에 대한 판단 로직이 없습니다.

**보완 필요: 검색 라우팅 매트릭스**

| 질문 유형 | 예시 | 우선 검색 전략 | SQL/API 힌트 |
|---|---|---|---|
| 파일 정체 질문 | "auth.py 가 뭐야?" | **RDB Exact** | `WHERE file_path LIKE '%auth.py'` |
| 심볼 존재 질문 | "login 함수 어디 있어?" | **RDB Exact** | `file_symbols WHERE symbol_name = 'login'` |
| 역할 기반 질문 | "라우터 파일 다 보여줘" | **RDB Filter** | `source_files WHERE file_role = 'router'` |
| 진입점 질문 | "실행 시작점이 어디야?" | **RDB Filter** | `WHERE is_entry_point = TRUE` |
| 의존성 질문 | "이 파일 import하는 곳은?" | **RDB Graph** | `code_dependencies` recursive query |
| 개념·동작 질문 | "인증 로직이 어떻게 돼?" | **Vector Search** | pgvector cosine similarity |
| 구현 세부 질문 | "JWT 검증 코드 보여줘" | **Hybrid** | Vector → file_id → RDB 원문 JOIN |
| 유사 패턴 질문 | "에러 핸들링 비슷한 코드 있어?" | **Vector Search** | embedding cosine similarity |

> [!TIP]
> Supervisor Agent의 plan JSON에 `"search_strategy": "rdb" | "vector" | "hybrid"` 필드를 추가하고, Route Node에서 이 값을 기반으로 Search Worker를 다르게 라우팅하는 방식을 권장합니다.

---

### 3-4. 공백 D: 디렉토리(폴더) 단위 RDB 엔티티 없음

**문제**

RDB에는 파일 단위(`source_files`)만 존재합니다. 폴더 자체의 역할 요약, 하위 파일 수, 도메인 분류 등이 RDB에 없어서 Tree-RAG Bottom-up 요약 결과를 구조적으로 저장하고 조회할 수 없습니다.

**보완 필요 테이블: `directory_nodes`**

```sql
CREATE TABLE directory_nodes (
    id           UUID PRIMARY KEY,
    job_id       UUID    NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
    dir_path     TEXT    NOT NULL,         -- 'backend/app/chat' (저장소 루트 기준)
    depth        INTEGER NOT NULL,         -- 루트 = 0
    parent_path  TEXT,                     -- 상위 디렉토리 경로 (NULL이면 루트)
    file_count   INTEGER NOT NULL DEFAULT 0,
    domain_label VARCHAR(100),             -- LLM 분류: 'chat domain' | 'agent layer' 등
    summary      TEXT,                     -- Bottom-up 폴더 요약 (Tree-RAG 산출물, 임베딩 입력 원문)
    embedding    vector(1536),             -- 폴더 요약 임베딩 (넓은 범위 검색용)
    created_at   TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_dir_nodes_job_path UNIQUE (job_id, dir_path)
);

CREATE INDEX idx_dir_nodes_job    ON directory_nodes (job_id);
CREATE INDEX idx_dir_nodes_parent ON directory_nodes (job_id, parent_path);
CREATE INDEX idx_dir_nodes_embed  ON directory_nodes USING hnsw (embedding vector_cosine_ops);
```

---

### 3-5. 공백 E: 온보딩 가이드 결과물 JSONB 단일 컬럼 집중

**문제**

최종 생성된 온보딩 가이드북(읽기 순서, 핵심 파일 목록, 실행 방법, 위험 파일 등)이 `analysis_jobs.report_json` JSONB 단일 컬럼에 모두 몰아 저장되고 있습니다. 이는 특정 필드만 조회하거나 업데이트하기 어렵고, 향후 기능 확장도 어렵습니다.

**보완 필요 테이블: `onboarding_reports`**

```sql
CREATE TABLE onboarding_reports (
    id               UUID PRIMARY KEY,
    job_id           UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
    reading_order    JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{rank: 1, file_path: 'backend/app/main.py', reason: '서버 진입점'}]
    entry_points     JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{file_path, type: 'backend_entry' | 'frontend_entry' | 'config'}]
    tech_stack       JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{name: 'FastAPI', version: '0.111', category: 'framework'}]
    run_commands     JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{env: 'local', command: 'uvicorn app.main:app', description: '백엔드 실행'}]
    risk_files       JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{file_path, risk_level: 'high' | 'medium', reason: '.env 유출 가능성'}]
    master_summary   TEXT,  -- 프로젝트 전체 요약 마크다운
    generated_at     TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_onboarding_job UNIQUE (job_id)
);
```

---

## 4. 보완 우선순위 및 다음 액션 체크리스트

> [!IMPORTANT]
> 아래 항목들을 다음 팀 회의 아젠다로 올리고, 합의 후 해당 명세 문서에 반영합니다.

### 즉시 반영 (다음 회의 전 개인 검토)

- [ ] `file_symbols` 테이블 설계 확정 → `init.sql` 추가
- [ ] `source_files` 컬럼 확장 (`file_role`, `is_entry_point`, `language`, `line_count`, `fan_in/out`)
- [ ] Supervisor Agent `access_plan` JSON 스키마에 `search_strategy` 필드 추가 정의

### 중기 반영 (다음 스프린트 계획)

- [ ] `directory_nodes` 테이블 설계 확정 → `init.sql` 추가
- [ ] `onboarding_reports` 테이블 분리 → `analysis_jobs.report_json` 마이그레이션
- [ ] 로컬 ZIP 업로드 기능 명세 작성 (`PROJECT-REPO-B-206/207`, `PROJECT-REPO-F-205`)
- [ ] `file_dependencies` vs `code_dependencies` 중복 테이블 정리

### 관련 문서 업데이트 체크리스트

- [ ] `database/init.sql` — 신규 테이블 DDL 및 컬럼 추가
- [ ] `docs/03_Specifications/02_RAG/spec/RAG_EMBED_SPEC.md` — `file_symbols` 저장 명세 추가
- [ ] `docs/03_Specifications/01_Project/spec/PROJECT_REPO_SPEC.md` — ZIP 업로드 기능 추가
- [ ] `docs/04_Decisions/MULTI_AGENT_ARCHITECTURE_DECISION.md` — 검색 라우팅 전략 섹션 추가
- [ ] `docs/01_Overview/FUNCTIONAL_SPECIFICATION.md` — 신규 기능 ID 추가

---

## 5. 교수님 피드백 관점에서 본 현 아키텍처 강점 (Keep)

| 항목 | 현재 상태 | 평가 |
|---|---|---|
| 벡터 DB + RDB 동시 운용 (pgvector) | `code_nodes` + `analysis_jobs` 등 혼합 구조 | ✅ 방향성 맞음 |
| import 의존성 관계 그래프 RDB 저장 | `code_dependencies` 테이블 | ✅ RDB 활용 사례 있음 |
| AST 기반 청킹 + `start_line/end_line` 저장 | `code_chunks` 컬럼 존재 | ✅ 심볼 레벨 식별 기반 마련됨 |
| HNSW 인덱스 (벡터 검색 최적화) | `init.sql` 명시 | ✅ 벡터 검색 성능 설계됨 |
| Agentic RAG (LLM이 검색 도구 선택) | Supervisor Agent 설계 | ✅ 검색 라우팅 자동화 기반 있음 |

**결론**: 전체 구조와 방향성은 맞습니다. 핵심 보완 포인트는 **`file_symbols` 테이블 추가**와 **`source_files` 컬럼 확장**으로, 파일 내부 구조를 RDB에 정형화하는 것이 이 프로젝트의 가장 중요한 RDB 설계 보완 과제입니다.

---

## 6. 타 팀 발표 벤치마킹 — 3팀 (중간발표 당일 관찰)

> [!NOTE]
> 발표 당일 참관한 내용 중 **벤치마킹 가치가 있는 UX·기능 패턴**을 기록합니다. 우리 프로젝트에 적용할 수 있는 아이디어를 도출하기 위한 목적입니다.

### 총평

> "3팀 발표 제일 잘함. 특히 gem이라는 예전 GPTs와 같이 바로 에이전트를 커스텀화해서 사용하는 방식 하나랑, 분석 파이프라인 흐름 시각화 부분이 돋보이는데 분석 매트릭스 / 파이프라인 그래프 탭이 따로 있었고 파이프라인 그래프는 HTML CSS SVG를 활용해서 구현했다고 함"

---

### 6-1. 에이전트 커스터마이징 UX — "Gem" 방식

**관찰 내용**

- Google Gemini의 **Gem**(구 GPTs에 해당)처럼 에이전트를 사전에 커스터마이징해서 저장해두고, 원하는 설정의 에이전트를 꺼내 쓰는 UX
- 사용자가 직접 에이전트의 성격·도구·응답 스타일 등을 설정한 뒤 저장 → 반복 사용

**CodeMap에 적용 가능한 아이디어**

| 적용 포인트 | 구체적인 방향 | 해당 기능 ID (안) |
|---|---|---|
| **분석 프리셋 저장** | "신입 온보딩 모드" / "빠른 구조 파악 모드" / "보안 감사 모드" 등 분석 깊이·포커스를 프리셋으로 저장 | `AGENT-CHAT-F-207` (안) |
| **답변 스타일 커스텀** | "한국어 요약만" / "코드 스니펫 포함" / "초보자용 설명체" 등 Final Answer Agent의 프롬프트 파라미터 사용자 설정 | `AGENT-CHAT-B-205` (안) |
| **질문 템플릿 저장** | 자주 쓰는 질문 패턴 ("엔트리포인트 찾아줘", "DB 스키마 설명해줘")을 즐겨찾기처럼 저장 | `AGENT-CHAT-F-208` (안) |

> [!TIP]
> 당장 Phase 1에서 전부 구현하기보다, **UI에 프리셋 탭만 먼저 추가**하고 내부 로직은 Phase 2에서 연결하는 방식으로 점진적으로 도입할 수 있습니다.

---

### 6-2. 분석 파이프라인 시각화 — 별도 탭 구성

**관찰 내용**

- **"분석 매트릭스" 탭**과 **"파이프라인 그래프" 탭**이 별도로 존재
- 파이프라인 그래프는 **HTML + CSS + SVG**로 직접 구현 (외부 라이브러리 미사용)
- 분석이 진행되는 동안의 단계별 흐름을 실시간으로 시각화하는 것으로 추정

**현재 우리 구현과의 차이**

| 항목 | 3팀 | CodeMap 현재 | 보완 방향 |
|---|---|---|---|
| 파이프라인 흐름 시각화 | ✅ 별도 탭, SVG 그래프 | ❌ 진행률 바(Progress Bar) 수준 | 단계별 노드 그래프로 고도화 |
| 분석 매트릭스 뷰 | ✅ 별도 탭 존재 | ❌ 없음 | 파일별 분석 점수/상태 테이블 뷰 |
| 실시간 업데이트 | 추정 (SSE/WebSocket) | ✅ WebSocket 기반 구현 중 | 연결하면 됨 |

**CodeMap에 적용 가능한 아이디어**

1. **파이프라인 그래프 탭 신설**
   - 분석 요청 후 `clone → parse → embed → generate` 각 단계를 SVG 노드 그래프로 시각화
   - 현재 진행 중인 노드는 pulse 애니메이션, 완료 노드는 색상 변경, 실패 노드는 빨간색 처리
   - 백엔드 SSE 이벤트(`stage` 필드)를 그대로 활용 가능 → 구현 난이도 낮음

   ```
   [clone] ──▶ [filter] ──▶ [AST parse] ──▶ [embed] ──▶ [summarize] ──▶ [report]
      ✅            ✅            🔄 (진행중)     ⏳          ⏳              ⏳
   ```

2. **분석 매트릭스 탭 신설**
   - 파일별 분석 결과를 테이블로 제공: `파일명 / 역할 / 언어 / 심볼 수 / 복잡도 / 임베딩 상태`
   - `source_files` + `file_symbols` RDB 조회로 구현 가능 (위 공백 A, B 보완 후)
   - 정렬·필터 기능 추가하면 교수님이 강조한 **RDB 활용**의 좋은 시각적 증거가 됨

**관련 기존 기능 ID**

| 기능 ID | 기능명 | 연관성 |
|---|---|---|
| `PROJECT-REPO-F-203` | Git Clone 진행률 프로그레스 UI | 파이프라인 그래프로 고도화 대상 |
| `PROJECT-REPO-F-204` | AI 코드 분석 진행 상태 UI | 파이프라인 그래프로 고도화 대상 |
| `RAG-PARSE-F-201` | 구조 분석 결과 표시 UI | 분석 매트릭스 탭으로 확장 가능 |
| `AGENT-CORE-F-201` | ReportJsonResponse 필드 확정 | 매트릭스 뷰 데이터 소스 |

---

### 6-3. 벤치마킹 우선순위 정리

| 항목 | 구현 난이도 | 임팩트 | 우선순위 |
|---|---|---|---|
| 파이프라인 그래프 탭 (HTML/SVG) | 낮음 (기존 SSE 이벤트 활용) | 높음 (시각적 차별화) | **🔴 높음** |
| 분석 매트릭스 탭 (파일별 테이블) | 중간 (RDB 보완 후 가능) | 높음 (RDB 활용 증명) | **🟡 중간** |
| 에이전트 커스텀 프리셋 UI | 중간 (UI 먼저, 로직은 Phase 2) | 중간 (UX 차별화) | **🟡 중간** |
| 질문 템플릿 즐겨찾기 | 낮음 | 낮음 | **🟢 낮음** |
