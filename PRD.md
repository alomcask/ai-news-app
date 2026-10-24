# PRD: AI 뉴스 수집 앱

## 1. 개요
해외 AI 뉴스를 RSS로 수집하고, Claude AI가 한국어로 번역·요약·카테고리 분류한 결과를 카드 형태로 보여주는 개인용 웹 앱. 마음에 드는 뉴스는 Notion에 저장할 수 있다.

## 2. 목표
- 필요할 때 버튼 한 번으로 최신 해외 AI 뉴스를 한국어 요약으로 확인한다.
- 카테고리별로 뉴스를 골라 본다.
- 선택한 뉴스를 Notion에 간편하게 보관한다.

## 3. 사용자
- 개인용 (사용자 1명). 뉴스와 카테고리는 단일 공용 데이터로 관리하며 userId 컬럼은 두지 않는다.
- 로그인(Clerk)은 접근 제어 목적.

## 4. 뉴스 소스
| 소스 | RSS URL |
|---|---|
| TechCrunch AI | http://techcrunch.com/category/artificial-intelligence/feed/ |
| The Verge AI | http://www.theverge.com/rss/ai-artificial-intelligence/index.xml |

## 5. 기능 요구사항

### 5.1 로그인
- 앱 실행 시 미로그인 상태면 Clerk 로그인 화면으로 이동한다.
- 모든 페이지와 API는 로그인 후에만 접근 가능하다.

### 5.2 뉴스 가져오기
- '뉴스 가져오기' 버튼 클릭 시 두 RSS를 수집한다.
- URL 기준으로 중복을 제거하고 신규 기사만 처리한다.
- 신규 기사마다 Claude API를 호출해 한국어 제목 번역, 한국어 요약, 카테고리 분류를 한 번에 수행(JSON 응답)한다.
- 결과를 DB에 저장하고 목록을 갱신한다.
- 처리 중 로딩 상태와 완료/실패 결과(신규 N건)를 표시한다.
- 가져오기 1회당 최대 처리 건수와 동시 호출 수를 제한한다.

### 5.3 뉴스 카드
- 표시 항목: 한국어 제목, 한국어 요약, 카테고리 뱃지, 출처, 발행일, 원문 링크.
- 'Notion 저장' 버튼을 포함하며, 저장 후에는 저장 완료 상태(Notion 페이지 링크)로 표시한다.

### 5.4 카테고리 분류 및 필터
- 분류는 DB에 등록된 카테고리(이름+설명) 목록 중에서 Claude가 선택한다.
- 해당하지 않으면 '미분류'로 둔다.
- 카테고리 탭/칩을 눌러 해당 카테고리 뉴스만 볼 수 있다.

### 5.5 카테고리 관리
- 카테고리 추가, 수정(이름/설명), 삭제가 가능하다.
- 삭제 시 해당 뉴스는 '미분류'가 된다.
- 카테고리 변경 후 기존 뉴스를 재분류하는 옵션을 제공한다.
- 기본 카테고리는 시드 데이터로 제공한다(예: 모델/연구, 제품/서비스, 기업/투자, 정책/규제, 기타).

### 5.6 Notion 저장
- 카드의 'Notion 저장' 클릭 시 환경변수로 지정한 Notion 데이터베이스 1개에 페이지를 생성한다.
- 저장 속성: 제목, 요약, 카테고리, 원문 링크, 발행일.
- Notion 연동은 Notion MCP 서버를 통해 수행한다.
- 이미 저장된 뉴스는 중복 저장하지 않는다.

## 6. 데이터 모델 (Drizzle ORM / Neon)
**categories**: id, name(unique), description, createdAt

**articles**: id, url(unique), source, titleOriginal, titleKo, summaryKo, categoryId(nullable FK), publishedAt, fetchedAt, notionPageUrl(nullable)

## 7. 기술 스택
| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js (App Router, TypeScript, Tailwind) |
| 로그인 | Clerk |
| DB | Neon (PostgreSQL) + Drizzle ORM |
| 번역·요약·분류 | Claude API |
| Notion 저장 | Notion MCP 서버 (`@modelcontextprotocol/sdk` 클라이언트) |
| RSS 파싱 | rss-parser 등 경량 라이브러리 |

## 8. 환경변수
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `ANTHROPIC_API_KEY`
- Notion 토큰, Notion 데이터베이스 ID

## 9. 비기능 요구사항
- 동일 기사의 중복 저장·중복 Claude 호출 방지로 비용 절감.
- API 키는 서버에서만 사용하고 클라이언트에 노출하지 않는다.
- 일부 기사 처리 실패가 전체 가져오기를 중단시키지 않는다.

## 10. 리스크 및 검토 사항
- 공식 호스티드 Notion MCP는 OAuth 기반이라 서버 앱 연동이 번거로울 수 있다. 초기에 API 토큰 방식의 로컬 Notion MCP 서버(`@notionhq/notion-mcp-server`) 사용 가능 여부를 검증한다.
- 대량 기사 처리 시 서버리스 타임아웃과 API 비용 → 처리 건수·동시성 제한.
- RSS 원문 내용이 짧거나 일부만 제공될 수 있어 요약 품질에 영향이 있다.

## 11. 구현 순서
1. Next.js 프로젝트 + Clerk 로그인
2. Neon/Drizzle 스키마·마이그레이션, 기본 카테고리 시드
3. RSS 수집 + Claude 처리 + '뉴스 가져오기'
4. 카드 UI + 카테고리 필터
5. 카테고리 CRUD(+재분류)
6. Notion MCP 저장

## 12. 검증 기준
- 미로그인 접근이 차단된다.
- 가져오기를 연속 2회 실행해도 중복 저장이 없다.
- 카테고리 추가/수정/삭제가 필터와 분류에 반영된다.
- Notion 데이터베이스에 페이지가 정상 생성된다.

## 13. 범위 외 (현재)
- 다중 사용자, 자동 주기 수집(스케줄러), 소스 추가 UI, 검색 기능.
