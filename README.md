# AI 뉴스 수집기

해외 AI 뉴스를 RSS로 수집하고, Claude가 한국어로 번역·요약·카테고리 분류한 결과를 카드 형태로 보여주는 개인용 웹 앱입니다. 마음에 드는 뉴스는 Notion 데이터베이스에 저장할 수 있습니다.

## 주요 기능

- **뉴스 가져오기**: TechCrunch AI, The Verge AI의 RSS를 수집하고 URL 기준으로 중복을 제거합니다. 신규 기사마다 Claude가 한국어 제목, 한국어 요약, 카테고리를 한 번에 생성합니다. 1회 최대 20건, 동시 호출 4건으로 제한하며, 기사 하나가 실패해도 나머지는 계속 처리합니다.
- **뉴스 카드 목록**: 카테고리 뱃지, 출처, 발행일, 원문 링크를 보여주고 페이지네이션을 지원합니다.
- **카테고리 필터·관리**: 카테고리별로 뉴스를 보고, 카테고리를 추가·수정·삭제할 수 있습니다. 카테고리 이름과 설명은 Claude의 분류 기준이 됩니다.
- **Notion 저장**: 카드의 '뉴스 저장' 버튼을 누르면 Notion MCP 서버를 통해 지정한 DB에 페이지를 만들고, 버튼이 '저장됨'으로 바뀝니다. 이미 저장된 뉴스는 중복 저장하지 않습니다.
- **로그인**: Clerk로 모든 페이지와 서버 액션을 보호합니다(단일 사용자).

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router) + React 19 + TypeScript |
| 스타일 | Tailwind CSS v4 |
| 인증 | Clerk |
| DB | Neon (PostgreSQL) + Drizzle ORM |
| 번역·요약·분류 | Claude API (`@anthropic-ai/sdk`) |
| RSS | `rss-parser` |
| Notion 저장 | `@modelcontextprotocol/sdk` 클라이언트 + `@notionhq/notion-mcp-server` |

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경변수

프로젝트 루트에 `.env.local`을 만들고 다음 값을 채웁니다. (`.env.local`은 git에 올라가지 않습니다.)

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Neon (PostgreSQL)
DATABASE_URL=

# Claude API
ANTHROPIC_API_KEY=

# Notion
NOTION_TOKEN=          # Notion 통합(Integration) 토큰
NOTION_DATABASE_ID=    # 뉴스를 저장할 데이터베이스 ID
```

### 3. Notion 데이터베이스 준비

저장 대상 데이터베이스에 아래 속성이 있어야 하며, 통합(Integration)에 해당 DB의 연결(Connections) 권한을 부여해야 합니다.

| 속성 | 타입 |
| --- | --- |
| 제목 | title |
| 요약 | text |
| 원문링크 | url |
| 카테고리 | select |
| 발행일 | date |

### 4. 데이터베이스 마이그레이션 및 시드

```bash
npx drizzle-kit migrate
```

기본 카테고리(모델/연구, 제품/서비스, 기업/투자, 정책/규제, 기타)는 `src/db/seed.ts`로 넣습니다. 예: `npx tsx --env-file=.env.local src/db/seed.ts`

### 5. 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에 접속해 로그인한 뒤 대시보드에서 '뉴스 가져오기'를 누르세요.

## 스크립트

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버
npm run lint     # ESLint
npx drizzle-kit  # 마이그레이션 (설정: drizzle.config.ts, 출력: ./drizzle)
```

## 프로젝트 구조

```
src/
├── app/
│   ├── dashboard/        # 대시보드 페이지, 서버 액션(뉴스 가져오기, Notion 저장, 카테고리)
│   └── sign-in/          # 로그인 페이지
├── components/           # 뉴스 카드·목록, 카테고리 바·관리, 저장 버튼 등 UI
├── db/                   # Drizzle 스키마, 연결, 시드
└── lib/
    ├── ai/               # Claude 번역·요약·분류
    ├── articles/         # 중복 제거, 저장, 카테고리 필터
    ├── notion/           # Notion MCP 연동
    └── rss/              # RSS 소스와 수집
```

## 참고 문서

- `PRD.md`: 요구사항, 데이터 모델, 구현 순서
- `ui.md`: UI 가이드 (디자인 토큰, 레이아웃, 마스코트)

## 주의

- Notion 저장은 요청마다 Notion MCP 서버 프로세스를 새로 띄웁니다. 서버리스 환경에 배포할 때는 이 방식을 다시 검토해야 합니다.
- `ANTHROPIC_API_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, Notion 토큰은 서버 전용 값이므로 공개하지 마세요.
