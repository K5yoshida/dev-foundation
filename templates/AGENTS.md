# AGENTS.md

> Cross-agent instructions for all AI coding assistants (Claude Code, Codex, Gemini, Cursor, Copilot, etc.)
> For Claude Code-specific rules, see `.claude/CLAUDE.md`.

## Commands

```bash
# Development
npm run dev            # Dev server (localhost:3000)
npm run build          # Production build — MUST pass before commit
npm run start          # Production server
npm run lint           # ESLint
npm run typecheck      # TypeScript strict mode check
npm run format:check   # Prettier check

# Testing
npm run test           # Unit tests (Vitest)
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report (target: 80%+)
npm run test:e2e       # E2E tests (Playwright)

# Widget
npm run widget:build   # Build widget JS
npm run widget:watch   # Widget watch mode
npm run widget:size    # Bundle size check (<15KB gzip)

# Database
npx supabase db push   # Apply migrations
npx supabase migration new <name>  # Create migration

# Production
npm run smoke:prod     # Smoke test (dry_run, no side effects)
npm run audit:external # Check required env vars
```

## Architecture

- **Framework**: Next.js 14 (App Router) + TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Payments**: Stripe (Checkout, Portal, Webhooks)
- **Hosting**: Vercel (app) + CloudFlare (widget CDN)
- **UI**: shadcn/ui + Radix + Tailwind CSS
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Widget**: Vanilla JS, zero dependencies, <15KB gzip

## Project Structure

```
app/                    # Next.js App Router
  (auth)/               # Auth pages
  (dashboard)/          # Tenant dashboard
  api/                  # API Routes
    widget/             # Public API (no auth)
  lp/[slug]/            # LP delivery
  partner/              # Partner dashboard
  admin/                # Admin dashboard
components/             # React components
  ui/                   # Base UI (shadcn/ui)
  banner-editor/        # Banner creation
  lp-builder/           # LP creation
  dashboard/            # Dashboard widgets
lib/                    # Utilities
  supabase/             # Supabase client helpers
  stripe/               # Stripe helpers
widget/                 # Banner widget JS (independent build)
  src/                  # Widget source (Vanilla JS)
docs/                   # Design documents (48 files, Japanese)
specs/                  # Feature specifications (Spec-Driven Development)
memory/                 # Immutable principles (portable)
tasks/                  # Sprint tasks + lessons learned
.claude/                # Claude Code-specific config
  agent_docs/           # Developer reference docs
```

## Before You Implement

1. Read `docs/INDEX.md` for the document map, then read the relevant design doc
2. Check `.claude/IMPLEMENTATION_STATUS.md` for current priorities and v2 status
3. If the feature has a spec, read `specs/{number}-{name}/`
4. Complete the pre-implementation checklist: `docs/31_実装着手前チェックリスト.md`
5. Review immutable principles: `memory/constitution.md`

## Coding Conventions

| Target              | Convention       | Example              |
| ------------------- | ---------------- | -------------------- |
| Files (components)  | PascalCase       | `BannerEditor.tsx`   |
| Files (utilities)   | camelCase        | `formatDate.ts`      |
| Files (API routes)  | kebab-case       | `route.ts`           |
| Variables/functions | camelCase        | `getBannerConfig`    |
| Types/interfaces    | PascalCase       | `BannerConfig`       |
| Constants           | UPPER_SNAKE_CASE | `MAX_BANNER_COUNT`   |
| DB columns          | snake_case       | `tenant_id`          |
| API endpoints       | kebab-case       | `/api/landing-pages` |

### Rules

- TypeScript strict mode: zero type errors
- No `any` — use `unknown`
- No `console.log` — use a logger
- No inline styles — use Tailwind CSS
- No `.env` values in source code
- Server Components by default; `'use client'` only when needed
- Commit format: `feat(module): description`

## Testing Requirements

- Coverage target: 80%+
- Every API route: test 200, 401, 400, 404 responses
- Widget changes: verify bundle stays under 15KB gzip
- DB changes: verify RLS policies with different roles

## Decision Gates

Every feature must pass 7 gates before implementation begins (see `docs/44_最高意思決定基準書.md`):

| Gate                   | Question                                                                |
| ---------------------- | ----------------------------------------------------------------------- |
| A. Category Leadership | Does this strengthen our competitive edge?                              |
| B. Customer Literacy   | Can a non-technical user understand and use this?                       |
| C. Workflow Fit        | Does this work with real-world operations (reports, support, handoffs)? |
| D. Data Reversibility  | Can we re-calculate, audit, and roll back?                              |
| E. Speed & Interaction | Does this keep critical paths fast?                                     |
| F. Operations Safety   | Can support diagnose issues? Is there a runbook?                        |
| G. Revenue & Retention | Does this help sell, retain, or expand?                                 |

## Security

- Auth check on all non-public API routes
- Input validation with Zod schemas
- RLS policy required on every Supabase table
- Never hardcode environment variables
- `service_role_key` only for admin/webhook operations

## Multi-Agent Workflow

This project supports parallel development with multiple AI agents:

1. **Specifications** in `specs/{N}-{name}/spec.md` define WHAT to build
2. **Plans** in `specs/{N}-{name}/plan.md` define HOW to build it
3. **Tasks** in `specs/{N}-{name}/tasks.md` list work units with `[P]` markers for parallelizable tasks
4. Agents pick up `[P]` tasks independently; non-`[P]` tasks run sequentially
5. All agents share `memory/constitution.md` as immutable principles

### Agent Roles

| Agent           | Best For                          | Examples                                                                          |
| --------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| **Claude Code** | Context-heavy, interactive work   | Spec writing, UI components, complex logic, test design, integration, code review |
| **Codex**       | Well-defined, pattern-based tasks | DB migrations, type definitions, CRUD API routes, bulk file changes, RLS policies |
| **Either**      | Tasks both handle equally         | Test implementation, doc updates, bug fixes, config changes                       |

### Handoff Protocol

Agents communicate through files, not chat. Task state markers in `tasks.md`:

| Marker | Meaning     | Example                                                       |
| ------ | ----------- | ------------------------------------------------------------- |
| `[ ]`  | Not started | `- [ ] [P] Create migration`                                  |
| `[-]`  | In progress | `- [-] [P] Create migration (Claude Code, 2026-03-04)`        |
| `[x]`  | Completed   | `- [x] [P] Create migration (Claude Code, 2026-03-04)`        |
| `[!]`  | Blocked     | `- [!] [P] Create migration — BLOCKED: needs schema decision` |

Rules:

- Before starting a `[P]` task, check `tasks.md` for conflicts
- Add agent name and date when claiming a task
- Non-`[P]` tasks wait for all previous tasks in the same Phase
- Blockers go in a `## Blockers` section at the bottom of `tasks.md`

## v2 Completion Criteria

v2 Wave 1 is considered DONE when all 5 criteria pass:

1. All 15 P0 specs have `spec.md` + `plan.md` + `tasks.md` in `specs/`
2. `npm run build` passes with 0 errors
3. `npm run test:coverage` shows >= 80% coverage
4. All P0 acceptance criteria marked `[x]` in their `spec.md`
5. `npm run smoke:prod` passes all checks

## 「次は？」判定ロジック

ユーザーが「次は？」と聞いたら、以下のロジックに従って最適なプロンプトを提案する。
プロンプトは `.claude/prompts/` 配下の `.md` ファイル。内容を読んでその通りに実行する。

```
0. ラテラルチェック（最優先）
   ├─ .claude/CONVICTION_LOG.md が空 or 直近2週間で未実行？
   │   → .claude/prompts/00-think/product-conviction.md を実行
   └─ Shipした機能の ship-and-learn が未実行？
       → .claude/prompts/00-think/ship-and-learn.md を実行

1. specs/ の状態を確認し、優先順位で判定:
   ├─ spec.md がない機能がある？ → 01-spec/spec-create.md
   ├─ plan.md がない機能がある？ → 02-plan/plan-create.md
   ├─ tasks.md に未実装タスクがある？ → 03-build/build-feature.md
   └─ 全部完了？ → 04-quality/quality-scan.md
```

### 推奨チェーン

| チェーン | 用途           | フロー                                                                                  |
| -------- | -------------- | --------------------------------------------------------------------------------------- |
| A        | 新機能         | conviction → spec → review → plan → db → test-skeleton → build → quality-review → learn |
| B        | 週次メンテ     | quality-scan → docs-sync → ux-flow                                                      |
| C        | リリース前     | security → e2e → visual → release → deploy                                              |
| D        | 設計スプリント | gap-fill → review → create                                                              |
| E        | 月次品質       | polish → copy-a11y → visual → monitor                                                   |
| F        | プロダクト思考 | conviction → spec → learn                                                               |

## What NOT to Do

- Do NOT implement without reading the relevant design doc in `docs/`
- Do NOT add external libraries to `widget/` (zero dependencies)
- Do NOT skip `IMPLEMENTATION_STATUS.md` update after completing work
- Do NOT allow cross-tenant data access (RLS enforced)
- Do NOT create Supabase tables without RLS policies
- Do NOT commit `console.log` statements or `.env` files
