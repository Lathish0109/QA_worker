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
  ai-service/           AIService interface + Anthropic/OpenAI/Gemini implementations,
                        selectable per-workspace from the Settings page
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

3. **Environment variables.** `apps/web/.env.local` already has the Supabase keys and the
   worker's shared secret filled in (it's gitignored — never commit it). Still empty:
   - `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` — fill in whichever
     provider(s) you want to use, then pick the active one on the **Settings** page. Only
     one needs to be set to get started; all three power the same three AI operations (test
     generation, failure analysis, bug drafting) behind the same `AIService` interface.
   - `BUG_TRACKER_BASE_URL` / `BUG_TRACKER_API_KEY` — once the real ICore Bug Tracker API
     contract is confirmed, set these to actually sync bugs (current client code assumes a
     contract — see `packages/bug-tracker-client/src/index.ts` — isolated to one file so
     swapping in the real one is cheap)

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

**All 6 V1 milestones from DESIGN.md §8 are built.** The full pipeline — requirement → AI
test generation → human review/approval → Playwright execution → evidence capture → AI
failure analysis → bug synced to ICore — is wired end-to-end in code. What's genuinely
unverified is only the parts that need credentials this environment doesn't have: real
Claude responses (vs. the graceful-failure path) and a real ICore Bug Tracker to sync to.

- ✅ Monorepo scaffold, Supabase Auth, DB schema + a private `evidence` Storage bucket
  (applied and verified live, RLS on every table, zero open security advisories)
- ✅ Dashboard: real aggregate stats (projects, test runs, approved test cases, bugs
  synced) plus recent test runs and recent AI failure diagnoses
- ✅ Projects (create/list/detail), Requirements & Specs (global + per-project)
- ✅ AI Test Generator: generate → review/edit → approve/reject, persisted to `test_cases`,
  plus a global work-queue view ranked by what needs attention
- ✅ Test Suites & Cases: global filterable list (all/pending/approved/rejected)
- ✅ Test Runs: triggering a run executes every approved test case for a project through
  real Playwright (`apps/worker`, synchronous for V1 — see the code comment on why).
  On failure it captures a screenshot, trace, and console logs to Supabase Storage and
  renders them via short-lived signed URLs. Verified end-to-end with a genuine pass and a
  genuine fail in the same run.
- ✅ Failure Analyzer: `analyzeFailure()` runs automatically on every failed result right
  after a run completes (best-effort — never blocks the run), or on-demand via a retry
  button. The prompt structurally separates confirmed evidence (error message + screenshot)
  from `rootCauseHypothesis`, which is never asserted as fact.
- ✅ Bug Tracker: `generateBugReport()` drafts a bug from the failure analysis; the app
  fills in the structural fields (evidence links, source refs — never AI-generated) and
  sends it via `BugTrackerClient`. Not yet synced to a real ICore instance since
  `BUG_TRACKER_BASE_URL`/`BUG_TRACKER_API_KEY` are unset — verified instead via the
  client's own clear "not configured" error.
- ✅ Settings: pick which AI provider is active — Claude (Anthropic), ChatGPT (OpenAI), or
  Gemini (Google) — workspace-wide, persisted in `app_settings`. All three implement the
  same `AIService` interface (`packages/ai-service`), including image input for failure
  screenshots. Verified end-to-end: switching the active provider correctly routes AI calls
  and the resulting error names the right provider and env var (e.g. selecting Gemini with
  no key set fails with "GEMINI_API_KEY is not configured", not Anthropic's).

**To actually test this with real AI output:** set at least one of `ANTHROPIC_API_KEY` /
`OPENAI_API_KEY` / `GEMINI_API_KEY` in `apps/web/.env.local`, then select it on the
Settings page if it isn't Claude (the default). Everything downstream (test generation,
failure analysis, bug drafting) starts working immediately — no other changes needed. Bug
Tracker sync additionally needs `BUG_TRACKER_BASE_URL`/`BUG_TRACKER_API_KEY` once you have
ICore's real API contract.

### Known transient issue

Supabase's built-in email sender has a low default rate limit (a few emails/hour), which
signup testing during setup already tripped. It clears on its own — if signup returns
`over_email_send_rate_limit`, wait ~15-30 min and retry. This is unrelated to the app code.
