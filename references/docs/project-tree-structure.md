<!-- Converted from Notion HTML export: 프로젝트 tree 구조 381cc46ed954800a9c88df40e19b280a.html -->

🌲

# 프로젝트 tree 구조

```
codemap-ai/
├── frontend/
│   ├── package.json               # 프론트엔드 패키지 의존성 관리
│   └── src/
│       ├── app/
│       │   ├── layout.tsx         # 앱 최상위 레이아웃 (폰트, Provider 주입)
│       │   ├── page.tsx           # 서비스 메인 랜딩 페이지
│       │   ├── globals.css        # 전역 CSS 변수 및 Tailwind 진입점
│       │   └── analyze/
│       │       └── page.tsx       # 저장소 분석 대시보드 메인 페이지
│       ├── components/
│       │   ├── RepoInput.tsx      # GitHub URL 및 로컬 경로 입력 폼
│       │   ├── HistoryList.tsx    # 과거 분석 이력 목록 조회 패널
│       │   ├── ProgressPanel.tsx  # 에이전트 실시간 분석 진행률 UI
│       │   ├── ReportViewer.tsx   # 최종 마스터 리포트 렌더링 뷰어
│       │   ├── HeatmapChart.tsx   # 파일 리스크 트리맵 시각화 차트
│       │   ├── AgentDurationsPanel.tsx # 각 에이전트 소요 시간 시각화
│       │   ├── InteractiveDemo.tsx # 랜딩 페이지 터미널 모의 데모
│       │   ├── BentoFeatures.tsx  # 핵심 기능 소개용 Bento Grid UI
│       │   ├── Navbar.tsx         # 상단 네비게이션 (로고, 테마/언어 토글)
│       │   ├── CodeMapFooter.tsx  # 하단 푸터 영역
│       │   ├── SecurityBanner.tsx # 보안 정책 안내 배너
│       │   └── hero/
│       │       ├── AsciiScene.tsx  # Three.js 캔버스 렌더링 컴포넌트
│       │       └── ascii-effect.ts # 3D 오브젝트 ASCII 변환 로직
│       ├── contexts/
│       │   └── AppContext.tsx     # 다국어(i18n) 및 테마 관리 Context
│       ├── hooks/
│       │   └── useWebSocket.ts    # WebSocket 연결을 위한 커스텀 Hook
│       ├── lib/
│       │   ├── api.ts             # 백엔드 API 통신(Axios/Fetch) 유틸리티
│       │   ├── translations.ts    # 한국어/영어 다국어 번역 딕셔너리
│       │   └── sanitize.ts        # Markdown 렌더링 시 XSS 방어 살균 유틸리티
│       └── types/
│           └── contracts.ts       # 백엔드 연동 프론트엔드 TS 타입 정의
└── backend/
    ├── requirements.txt           # 파이썬 라이브러리 패키지 의존성
    └── app/
        ├── main.py                # FastAPI 애플리케이션 진입점 및 CORS 설정
        ├── api/
        │   ├── routes.py          # 분석 시작, 이력 조회, 결과 반환 라우터
        │   ├── progress_bus.py    # 진행 상황 WebSocket 브로드캐스트 버스
        │   └── health.py          # 서버 상태 검사(Health Check) 라우터
        ├── models/
        │   ├── schemas.py         # Pydantic 기반 Request/Response DTO 정의
        │   └── config.py          # 환경 변수(.env) 및 전역 설정 관리
        ├── services/
        │   ├── repo_cloner.py     # Git 복제, 로컬 마운트 및 필터링 로직
        │   └── analysis_store.py  # 분석 진행 상태 및 결과 캐싱 DB 관리
        ├── orchestrator/
        │   └── planner.py         # 에이전트 비동기 작업 스케줄링 및 제어
        └── agents/
            ├── code_mapper.py     # (정적 분석) AST 구문 분석 및 구조 파악
            ├── doc_generator.py   # (동적 추론) 로직 파악 및 컴포넌트별 요약
            └── onboarding_guide.py # 종합 리포트 작성 및 LLM 의견 충돌 해결
```
