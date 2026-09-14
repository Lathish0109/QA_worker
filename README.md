# Obsidian QA Engine

AI-powered QA platform: requirement → AI-generated test cases → human review/approval →
Playwright execution → evidence capture → AI failure analysis → structured bug → ICore Bug Tracker.

See [DESIGN.md](./DESIGN.md) for the full architecture, schema, and phased plan.

## Repo layout

```
apps/
  web/      Next.js app — UI + internal API routes (Milestone 1+)
  worker/   Playwright execution service (Milestone 3, not yet implemented)
packages/
  shared-types/        TestCase, TestRun, FailureAnalysis, BugPayload, etc.
  db/                   Supabase client + hand-written DB types + migrations
  ai-service/           AIService interface + AnthropicAIService implementation
  bug-tracker-client/   Client for the ICore Bug Tracker's bug-creation API
```

## First-time setup

1. **Install dependencies** (from repo root):
   ```
   npm install
   ```

2. **Apply the database schema.** This repo's Supabase project (`qkmjvgaiuzofvwntxlrg`) is
   not connected to any automated migration tool yet — run the SQL by hand once:
   - Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/qkmjvgaiuzofvwntxlrg/sql/new)
   - Paste the contents of `packages/db/migrations/0001_init.sql` and run it

3. **Environment variables.** `apps/web/.env.local` already has the Supabase keys filled in
   (it's gitignored — never commit it). Still empty:
   - `ANTHROPIC_API_KEY` — needed once AI test generation is wired into the UI (Milestone 2)
   - `BUG_TRACKER_BASE_URL` / `BUG_TRACKER_API_KEY` — needed for Milestone 5, once the real
     ICore Bug Tracker API contract is confirmed (current client code assumes a contract —
     see `packages/bug-tracker-client/src/index.ts`)

4. **Run the web app:**
   ```
   npm run dev:web
   ```
   Visit http://localhost:3000 — it redirects to `/login`. Sign up with any email/password
   (Supabase Auth); a `profiles` row is created automatically via a DB trigger.

## Current status (Milestone 1 — Foundation)

- ✅ Monorepo scaffold, Supabase Auth, DB schema
- ✅ Projects: create + list + detail
- ✅ Requirements: add to a project
- ⏳ AI test generation, approval flow, Playwright execution, failure analysis, and Bug
  Tracker sync are not implemented yet — see DESIGN.md §8 for the milestone order.
