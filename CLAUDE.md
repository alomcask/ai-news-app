# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

`PRD.md` (Korean) is the source of truth for requirements, data model, and the 6-step implementation order. Steps 1–3 are implemented (Clerk login, Drizzle schema, RSS fetch + Claude translate/summarize/categorize via `fetchNewsAction`); the card list has pagination but no category filter yet (step 4), and category CRUD (5) and Notion save (6) are not started. Check `PRD.md` before implementing any feature.

`ui.md` (Korean) is the UI guide (Tailwind tokens, dashboard layout, category bar, Usagi mascot cards). Read it before writing or changing any UI.

## Commands

```bash
npm run dev      # next dev
npm run build    # next build
npm run start    # next start
npm run lint     # eslint (flat config, eslint.config.mjs)
npx drizzle-kit  # migrations (config in drizzle.config.ts, output in ./drizzle)
```

No test runner is configured.

## Next.js version warning

`next@16.4.3` / React 19.3 — APIs differ from older versions. `AGENTS.md` requires reading the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. `next.config.ts` enables `cacheComponents` and `partialPrefetching`, and wires `@tailwindcss/turbopack` for CSS (Tailwind v4), which affects how data fetching/caching must be written.

## Architecture (planned, per PRD)

- Next.js App Router + TypeScript, path alias `@/*` → `src/*`.
- Clerk protects every page and API route (single user; no `userId` columns).
- Neon Postgres via Drizzle: `categories` and `articles` (`articles.url` unique for dedup; `categoryId` nullable → "미분류").
- Fetch flow: RSS (TechCrunch AI, The Verge AI via `rss-parser`) → dedup by URL → one Claude call per new article returning JSON (Korean title, Korean summary, category chosen from DB categories) → save. Per-run max article count and concurrency are capped; a single article failure must not abort the run.
- Notion save goes through a Notion MCP server (`@modelcontextprotocol/sdk` client, candidate `@notionhq/notion-mcp-server` with API token), writing to one DB given by env var; skip articles that already have `notionPageUrl`.
- Secrets (`ANTHROPIC_API_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, Notion token/DB ID) are server-only; Clerk keys go in `.env.local`.
