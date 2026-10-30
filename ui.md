# UI 가이드

앱 이름: **AI 뉴스 수집기**
메인 화면: 뉴스를 카드로 보여 주는 대시보드

스타일링은 Tailwind CSS v4를 사용한다. 색상 토큰은 `src/app/globals.css`에 이미 정의되어 있으므로 임의의 색상 값(`#xxxxxx`)을 클래스에 직접 쓰지 않고 토큰(`bg-surface`, `text-muted` 등)만 사용한다.

## 1. 디자인 원칙

- **깔끔함**: 여백을 넉넉하게 두고, 한 화면에서 강조 색은 `brand` 하나만 쓴다.
- **읽기 편함**: 본문은 `leading-relaxed`, 카드 안 정보는 제목 → 요약 → 메타 순으로 위계를 둔다.
- **귀여움은 포인트로만**: 우사기는 카드 사이사이와 빈 상태·로딩에만 등장한다. 정보 읽기를 방해하면 안 된다.
- **라이트/다크 대응**: 토큰이 `prefers-color-scheme`에 따라 바뀌므로 `dark:` 변형을 따로 쓰지 않는다.

## 2. 디자인 토큰

`globals.css`의 CSS 변수를 `@theme inline`으로 Tailwind 색상에 연결해 둔 상태다.

| 용도 | Tailwind 클래스 | 라이트 | 다크 |
| --- | --- | --- | --- |
| 페이지 배경 | `bg-background` | `#f5f8ff` | `#0b1220` |
| 기본 글자 | `text-foreground` | `#0f172a` | `#e6edf8` |
| 카드/헤더 배경 | `bg-surface` | `#ffffff` | `#131c2e` |
| 테두리 | `border-border` | `#dbe5f5` | `#243350` |
| 보조 글자 | `text-muted` | `#5b6b86` | `#93a4c3` |
| 강조색 | `bg-brand` / `text-brand` | `#2563eb` | `#60a5fa` |
| 강조 배경(칩 등) | `bg-brand-soft` | `#e3edff` | `#1b2b4d` |
| 강조 호버/진한 글자 | `bg-brand-strong` / `text-brand-strong` | `#1d4ed8` | `#93c5fd` |

### 타이포그래피

| 요소 | 클래스 |
| --- | --- |
| 앱 이름(헤더) | `text-xl font-bold text-brand` |
| 카드 제목 | `text-lg font-semibold leading-snug` |
| 카드 요약 | `text-sm leading-relaxed text-muted` |
| 메타 정보(출처·날짜·원제) | `text-xs text-muted` |
| 카테고리 칩 | `text-sm font-medium` |

### 모양

- 카드·패널: `rounded-2xl border border-border bg-surface shadow-sm`
- 칩·버튼: `rounded-full`
- 카드 호버: `transition hover:-translate-y-0.5 hover:shadow-md`
- 포커스: 모든 상호작용 요소에 `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`

## 3. 화면 구조

```
┌──────────────────────────────────────────────┐
│ 헤더 (sticky)  AI 뉴스 수집기          [User] │
├──────────────────────────────────────────────┤
│  카테고리 바                                  │
│  [전체] [모델/연구] [제품/서비스] ... [+ 추가] │
│                                              │
│  ┌─────┐  ┌─────┐  ┌─────┐                   │
│  │ 카드 │  │ 카드 │  │ 카드 │                   │
│  └─────┘  └─────┘  └─────┘                   │
│  ┌─────┐  ┌─────┐  ┌─────┐                   │
│  │ 카드 │  │우사기│  │ 카드 │   ← 중간중간 삽입   │
│  └─────┘  └─────┘  └─────┘                   │
└──────────────────────────────────────────────┘
```

- 콘텐츠 폭: `mx-auto w-full max-w-6xl px-4`
- 카드 그리드: `grid gap-5 sm:grid-cols-2 lg:grid-cols-3` (모바일 1열 → 태블릿 2열 → 데스크톱 3열)

## 4. 컴포넌트

### 4.1 헤더

- `sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur`
- 왼쪽: 우사기 아이콘(24px) + 앱 이름 **AI 뉴스 수집기** (`text-xl font-bold text-brand`)
- 오른쪽: Clerk `UserButton`
- 미로그인 화면에도 같은 앱 이름을 쓰고, 우사기 일러스트(큰 크기)와 로그인 버튼을 가운데 정렬한다.

### 4.2 카테고리 바

뉴스 카드 목록 **바로 위**에 놓는다. 카테고리 칩이 먼저 나오고, **맨 끝에 카테고리 추가 버튼**이 온다.

```tsx
<nav aria-label="카테고리" className="mb-6 flex flex-wrap items-center gap-2">
  {/* 전체 + 카테고리 칩들 */}
  {/* 마지막: 카테고리 추가 버튼 */}
</nav>
```

- 칩 순서: `전체` → DB 카테고리(생성 순) → `미분류`(미분류 기사가 있을 때만) → **`+ 카테고리 추가`**
- 모바일에서 칩이 많으면 줄바꿈 대신 가로 스크롤을 허용해도 된다(`flex-nowrap overflow-x-auto`). 이때 추가 버튼은 스크롤 끝에 위치한다.
- 선택 상태는 URL 쿼리(`?category=<id>`)로 표현해 새로고침·공유에 유지한다.

칩 스타일:

| 상태 | 클래스 |
| --- | --- |
| 기본 | `rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-muted hover:border-brand hover:text-brand` |
| 선택됨 | `rounded-full border border-brand bg-brand px-4 py-1.5 text-sm font-medium text-white` |

카테고리 추가 버튼:

- 점선 테두리로 칩과 구분한다: `rounded-full border border-dashed border-brand px-4 py-1.5 text-sm font-medium text-brand hover:bg-brand-soft`
- 라벨: `+ 카테고리 추가` (아이콘 버튼으로 줄일 때는 `aria-label="카테고리 추가"` 필수)
- 클릭 시 이름·설명을 입력하는 작은 모달(또는 인라인 폼)을 연다. 설명은 Claude 분류 기준이 되므로 입력란에 "Claude가 이 설명을 보고 분류해요" 안내 문구를 둔다.
- 저장 후 칩 목록에 즉시 반영한다.

### 4.3 뉴스 카드

현재 `src/components/news-card.tsx`의 구조를 기준으로 한다.

1. 상단: 카테고리 뱃지(`rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-strong`) / 출처(`text-muted`)
2. 제목: 한국어 제목, 원문 링크(새 탭, `rel="noopener noreferrer"`), 호버 시 `text-brand`
3. 요약: 한국어 요약 (`text-sm leading-relaxed text-muted`)
4. 하단(`border-t border-border pt-3`): 원문 제목 1줄(`line-clamp-1`) + 발행일(`ko-KR`, `Asia/Seoul`)
5. 향후 추가: Notion 저장 버튼. 저장 완료(`notionPageUrl` 있음)면 "Notion에서 보기" 링크로 바꾼다.

카테고리가 없는 기사는 뱃지에 `미분류`를 표시한다.

### 4.4 상태 화면

| 상태 | 표현 |
| --- | --- |
| 로딩 | `animate-pulse` 스켈레톤 카드 6개 (`h-48 rounded-2xl border border-border bg-surface`) |
| 뉴스 없음 | 우사기(중간 크기) + "아직 수집된 뉴스가 없어요" + 뉴스 가져오기 버튼 |
| 카테고리 내 뉴스 없음 | 우사기 + "이 카테고리에는 아직 뉴스가 없어요" |
| 오류 | 우사기(당황한 표정) + 오류 문구 + 다시 시도 버튼 |

## 5. 마스코트 "우사기"

일본 만화 *치이카와*의 우사기를 모티프로 한 캐릭터. 하얀 계열의 동글동글한 몸, 작은 점 눈, 볼터치, 길쭉한 귀가 특징이다. 공식 이미지는 저작권이 있으므로 앱에는 직접 그린 오마주 일러스트만 쓰고, 공식 이미지를 그대로 복사해 넣지 않는다.

### 5.1 에셋

`public/usagi/` 아래에 SVG로 관리한다(크기 조절·다크 모드 대응이 쉽다). 파일명은 표정/포즈 기준이다.

| 파일 | 용도 |
| --- | --- |
| `usagi-wave.svg` | 로그인 화면, 헤더 아이콘 |
| `usagi-read.svg` | 카드 사이 삽입(뉴스 읽는 포즈) |
| `usagi-idea.svg` | 카드 사이 삽입(전구, 팁 문구) |
| `usagi-sleep.svg` | 뉴스 없음 |
| `usagi-oops.svg` | 오류 |

- 몸은 밝은 크림/흰색 톤으로 하고, 소품(전구·신문 등)과 외곽선에 `brand` 계열 파랑을 써서 앱 색과 맞춘다. 다크 모드에서도 배경에 묻히지 않도록 외곽선을 넣는다.
- `next/image`로 불러오고 항상 `alt`를 넣는다. 장식용이면 `alt=""`로 두고 `aria-hidden`을 쓴다.

### 5.2 카드 사이 삽입 규칙

- 뉴스 카드 **6장마다 1번** 우사기 카드를 끼워 넣는다(6번째 카드 뒤, 12번째 카드 뒤 ...). 카드가 6장 미만이면 넣지 않는다.
- 우사기 카드는 그리드 칸 1개를 차지하며, 뉴스 카드와 구분되도록 배경을 다르게 한다.
  - `flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-brand-soft/50 p-5 text-center`
  - 일러스트 `h-24 w-auto`, 아래에 짧은 한 줄(`text-sm text-muted`)
- 문구는 가볍게 돌려 쓴다. 예: "오늘 뉴스도 열심히 읽는 중!", "조금만 더 내려가 볼까요?", "카테고리를 추가하면 더 잘 분류돼요."
- 같은 포즈가 연속으로 나오지 않게 `read` / `idea`를 번갈아 쓴다.
- 우사기 카드는 클릭 대상이 아니다. 링크·버튼 역할을 주지 않는다.
- 카테고리 필터로 카드가 6장 미만이 되면 우사기 카드는 숨긴다.

```tsx
// news-list.tsx 렌더링 개요
{rows.map((row, i) => (
  <Fragment key={row.article.id}>
    <NewsCard article={row.article} categoryName={row.categoryName} />
    {(i + 1) % 6 === 0 && <UsagiCard variant={((i + 1) / 6) % 2 ? "read" : "idea"} />}
  </Fragment>
))}
```

## 6. 접근성·반응형 체크리스트

- 칩과 버튼은 최소 높이 36px 이상, 모바일 터치 영역을 확보한다.
- 현재 선택된 카테고리 칩에는 `aria-current="true"`를 준다.
- 색만으로 상태를 구분하지 않는다(선택 칩은 색 + 채움, 추가 버튼은 점선 + `+` 기호).
- 모달은 열릴 때 첫 입력란에 포커스, `Esc`로 닫기, 닫힌 뒤 추가 버튼으로 포커스 복귀.
- 우사기 애니메이션을 넣는 경우 `motion-reduce:animate-none`으로 끌 수 있게 한다.
- 320px 폭에서도 가로 스크롤 없이 1열로 읽혀야 한다.
