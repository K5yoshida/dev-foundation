# AGENTS.md

> Cross-agent instructions for all AI coding assistants (Claude Code, Codex, Gemini, Cursor, Copilot, etc.)
> For Claude Code-specific rules, see `.claude/CLAUDE.md`.

## Global Runtime Alignment

This project inherits Yoshida's global AI-agent rules:

1. `/Users/keigoyoshida/AGENTS.md` — cross-agent global rules for Codex and AGENTS.md-compatible assistants
2. `/Users/keigoyoshida/CLAUDE.md` — Claude Code entry point for the home directory
3. `/Users/keigoyoshida/.claude/CLAUDE.md` — detailed Claude Code operating principles

When these files and this project file conflict, follow this order:

1. Direct user request
2. The closest project-specific `AGENTS.md` / `CLAUDE.md`
3. `/Users/keigoyoshida/AGENTS.md`
4. `/Users/keigoyoshida/.claude/CLAUDE.md`
5. General best practices

Core expectations:

- Use Japanese honorific language when talking to Yoshida.
- Make decisions from first principles, not from precedent alone.
- Do not act on guesses; verify files, logs, docs, or live data first.
- Do not edit files you have not read.
- Before important changes, explain current state, problem, and user impact.
- Ask before destructive operations, production impact, external sends, DB changes, dependency installs, permission changes, commits, pushes, or deploys.
- Never expose secrets, API keys, tokens, or PII in logs or conversation.

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
tasks/                  # Sprint tasks + lessons learned
.agent/                 # Cross-agent orchestration & shared files
  shared/               # Shared logs (IMPLEMENTATION_STATUS, CONVICTION_LOG, LEARN_LOG)
  prompts/              # Prompt library (23 prompts, 9 categories)
.claude/                # Claude Code config + all project documentation
  01_docs/              # Design documents (WHY + 全体WHAT)
  02_specs/             # Feature specifications (個別WHAT + HOW + UI/UX)
  03_plans/             # Work plans (symlink → ~/.claude/plans)
  constitution.md       # Immutable principles (portable)
```

## Before You Implement

1. Read `/Users/keigoyoshida/AGENTS.md` and the nearest project `CLAUDE.md` / `.claude/CLAUDE.md`
2. Read `.claude/01_docs/00_INDEX.md` for the document map, then read the relevant design doc
3. Check `.claude/IMPLEMENTATION_STATUS.md` for current priorities
4. If the feature has a spec, read `.claude/02_specs/{feature-name}/`
5. Review immutable principles: `.claude/constitution.md`

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

Every feature must pass 7 gates before implementation begins (see `.claude/01_docs/44_最高意思決定基準書.md`):

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

1. **Specifications** in `.claude/02_specs/{feature-name}/spec.md` define WHAT to build
2. **Plans** in `.claude/02_specs/{feature-name}/plan.md` define HOW to build it
3. **Tasks** in `.claude/02_specs/{feature-name}/tasks.md` list work units with `[P]` markers for parallelizable tasks
4. Agents pick up `[P]` tasks independently; non-`[P]` tasks run sequentially
5. All agents share `.claude/constitution.md` as immutable principles

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

1. All 15 P0 specs have `spec.md` + `plan.md` + `tasks.md` in `.claude/02_specs/`
2. `npm run build` passes with 0 errors
3. `npm run test:coverage` shows >= 80% coverage
4. All P0 acceptance criteria marked `[x]` in their `spec.md`
5. `npm run smoke:prod` passes all checks

## 「次は？」判定ロジック

ユーザーが「次は？」と聞いたら、以下のロジックに従って最適なプロンプトを提案する。
プロンプトは `.agent/prompts/` 配下の `.md` ファイル。内容を読んでその通りに実行する。

```
0. ラテラルチェック（最優先）
   ├─ .agent/shared/CONVICTION_LOG.md が空 or 直近2週間で未実行？
   │   → .agent/prompts/00-think/product-conviction.md を実行
   └─ Shipした機能の ship-and-learn が未実行？
       → .agent/prompts/00-think/ship-and-learn.md を実行

1. .claude/02_specs/ の状態を確認し、優先順位で判定:
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

- Do NOT implement without reading the relevant design doc in `.claude/01_docs/`
- Do NOT add external libraries to `widget/` (zero dependencies)
- Do NOT skip `IMPLEMENTATION_STATUS.md` update after completing work
- Do NOT allow cross-tenant data access (RLS enforced)
- Do NOT create Supabase tables without RLS policies
- Do NOT assume PR workflow; confirm the project's deploy/main reflection rule first
- Do NOT print `.env`, service-role keys, API tokens, auth cookies, or personal information
- Do NOT commit `console.log` statements or `.env` files
