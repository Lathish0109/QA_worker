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

2. **Database schema.** Already applied to the live Supabase project
   (`qkmjvgaiuzofvwntxlrg`) — `packages/db/migrations/*.sql` is the record of what's been
   run, in order. If you ever need to reapply from scratch (e.g. a fresh project), run each
   file in order in the [Supabase SQL Editor](https://supabase.com/dashboard/project/qkmjvgaiuzofvwntxlrg/sql/new).

3. **Environment variables.** `apps/web/.env.local` already has the Supabase keys filled in
   (it's gitignored — never commit it). Still empty:
   - `ANTHROPIC_API_KEY` — required for the AI Test Generator to actually generate test cases
     (the UI/API/DB path is built; without this key it fails gracefully with a clear error)
   - `BUG_TRACKER_BASE_URL` / `BUG_TRACKER_API_KEY` — needed for Milestone 5, once the real
     ICore Bug Tracker API contract is confirmed (current client code assumes a contract —
     see `packages/bug-tracker-client/src/index.ts`)

4. **Run the web app:**
   ```
   npm run dev:web
   ```
   Visit http://localhost:3000 — it redirects to `/login`. Sign up with any email/password
   (Supabase Auth); a `profiles` row is created automatically via a DB trigger.

## Current status (Milestone 2 — AI Test Generator)

- ✅ Monorepo scaffold, Supabase Auth, DB schema (applied and verified live — 9 tables,
  RLS enabled on all of them, zero open security advisories)
- ✅ Projects: create + list + detail
- ✅ Requirements: add to a project
- ✅ AI Test Generator: generate test cases from a requirement (`AnthropicAIService`),
  review/edit/approve/reject flow, all persisted to `test_cases` — verified end-to-end
  (generation error handling, edit, approve all confirmed working against the live DB;
  full real generation still needs `ANTHROPIC_API_KEY` set)
- ⏳ Playwright execution, failure analysis, and Bug Tracker sync are not implemented yet —
  see DESIGN.md §8 for the milestone order.

### Known transient issue

Supabase's built-in email sender has a low default rate limit (a few emails/hour), which
signup testing during setup already tripped. It clears on its own — if signup returns
`over_email_send_rate_limit`, wait ~15-30 min and retry. This is unrelated to the app code.
