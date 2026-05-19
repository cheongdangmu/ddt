# webfull_9_10_DDT
DDT(디지털 디톡스 타이머) 통합 레포지토리 입니다. 

### 📂 프로젝트 디렉토리 구조 (Directory Structure)

```text
ddt-workspace/
├── .github/
│   └── workflows/
│       └── ci.yml                  # PR 생성 시 실행될 CI 파이프라인
│
├── apps/
│   ├── backend/                    # (NestJS + Prisma + Redis + Socket.IO)
│   │   ├── prisma/
│   │   │   └── schema.prisma       # Supabase 연결 및 스키마 정의
│   │   ├── src/
│   │   │   ├── common/             # Sentry 인터셉터, 글로벌 예외 처리
│   │   │   ├── modules/            # 도메인별 모듈 (auth, rooms, timer 등)
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── frontend/                   # (Next.js + Zustand + Tailwind + Orval)
│       ├── public/
│       ├── src/
│       │   ├── app/                # Next.js App Router (layout, page)
│       │   ├── components/         # UI 컴포넌트
│       │   ├── hooks/              # 커스텀 훅 (useSocket 등)
│       │   ├── store/              # Zustand 스토어
│       │   └── api/                # Orval이 자동 생성할 API 클라이언트 및 타입
│       ├── orval.config.js         # Orval 설정 파일
│       ├── tailwind.config.ts
│       └── package.json
│
├── packages/
│   ├── shared/                     # (프론트/백엔드 공통 구역)
│   │   ├── src/
│   │   │   ├── constants/          # Socket 이벤트명 ('JOIN_ROOM' 등)
│   │   │   └── types/              # 공통 타입 및 인터페이스
│   │   ├── package.json            # name: "@ddt/shared"
│   │   └── tsconfig.json
│   │
│   ├── eslint-config/              # 워크스페이스 공통 ESLint 설정
│   └── typescript-config/          # 워크스페이스 공통 TS 설정 (Base)
│
├── package.json                    # 루트 의존성 (husky, turbo 등)
├── pnpm-workspace.yaml             # 모노레포 패키지 바인딩
└── turbo.json                      # build, lint, typecheck 캐싱 파이프라인
