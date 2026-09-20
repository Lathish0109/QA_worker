# Obsidian QA Engine

AI-powered QA platform: requirement → AI-generated test cases → human review/approval →
Playwright execution → evidence capture → AI failure analysis → structured bug → ICore Bug Tracker.

See [DESIGN.md](./DESIGN.md) for the full architecture, schema, and phased plan.

## Repo layout

```
apps/
  web/      Next.js app — UI + internal API routes
  worker/   Playwright execution service — plain local Node process for now
            (Dockerize later, when deploying somewhere other than your machine)
packages/
  shared-types/        TestCase, TestRun, FailureAnalysis, BugPayload, WorkerRunRequest/Response
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

4. **Run the web app and the worker** (two terminals, both from repo root):
   ```
   npm run dev:web      # Next.js app on http://localhost:3000
   npm run dev:worker   # Playwright execution worker on http://localhost:4088
   ```
   Visit http://localhost:3000 — it redirects to `/login`. Sign up with any email/password
   (Supabase Auth); a `profiles` row is created automatically via a DB trigger. The worker
   only needs to be running when you actually trigger a test run from the Test Runs page —
   everything else works without it, just with `WORKER_URL`/`WORKER_SHARED_SECRET` already
   set in `apps/web/.env.local` and `apps/worker/.env.local` (both gitignored).

## Current status

Frontend has every sidebar page. Execution (Milestone 3) is live; failure analysis and
Bug Tracker sync are next — see DESIGN.md §8.

- ✅ Monorepo scaffold, Supabase Auth, DB schema (applied and verified live — 9 tables,
  RLS enabled on all of them, zero open security advisories)
- ✅ Dashboard, Projects (create/list/detail)
- ✅ Requirements & Specs: global cross-project list + add form, and per-project add
- ✅ AI Test Generator: per-requirement generation (`AnthropicAIService`) plus a global
  work-queue view ranked by what needs generation or review; review/edit/approve/reject
  flow persisted to `test_cases` — verified end-to-end against the live DB (full real
  generation still needs `ANTHROPIC_API_KEY` set; the error path is what's confirmed)
- ✅ Test Suites & Cases: global filterable list of all test cases (all/pending/approved/rejected)
- ✅ Test Runs (Milestone 3): triggering a run executes every approved test case for a
  project through Playwright (`apps/worker`), synchronously for V1 — no queue/webhook yet.
  On failure it captures a screenshot, a Playwright trace, and console logs, uploads them to
  a private Supabase Storage bucket (`evidence`), and the Test Run detail page renders them
  via short-lived signed URLs. Verified end-to-end with a real pass and a real fail in the
  same run (`partial` status computed correctly), including a fix for raw ANSI escape codes
  that were leaking into stored error messages.
- ⏳ Failure Analyzer, Bug Tracker: pages exist and query their real (currently empty) tables,
  with honest "not built yet" states — AI failure analysis (Milestone 4) and ICore Bug
  Tracker sync (Milestone 5) aren't implemented yet

### Known transient issue

Supabase's built-in email sender has a low default rate limit (a few emails/hour), which
signup testing during setup already tripped. It clears on its own — if signup returns
`over_email_send_rate_limit`, wait ~15-30 min and retry. This is unrelated to the app code.
