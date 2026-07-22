# Dev Foundation Setup — AI Instruction Manual

> **How to use**: Copy the `scaffold/` folder to a new project root, then tell Claude Code:
> "scaffold/setup.md の手順を実行して"
>
> Claude Code will read this file and set up the entire dev foundation automatically.

---

## Prerequisites

Before running, ensure the project has:

- [ ] A `package.json` (any Node.js/TypeScript project)
- [ ] A `.claude/` directory (or willingness to create one)
- [ ] `jq` installed (`which jq` to check; `brew install jq` if not)

---

## Step 1: Copy template files (no modification needed)

These files are project-agnostic. Copy them exactly as-is.

```
scaffold/templates/.claude/constitution.md          → .claude/constitution.md
scaffold/templates/CLAUDE.md                        → CLAUDE.md
scaffold/templates/.claude/AGENTS.md                → .claude/AGENTS.md
scaffold/templates/.claude/CLAUDE.md                → .claude/CLAUDE.md
scaffold/templates/.claude/rules/WORKFLOW_RULES.md   → .claude/rules/WORKFLOW_RULES.md
scaffold/templates/.claude/rules/DESIGN_SYSTEM.md    → .claude/rules/DESIGN_SYSTEM.md
scaffold/templates/.claude/02_specs/README.md        → .claude/02_specs/README.md
scaffold/templates/.claude/02_specs/DEPRECATION_GUIDE.md → .claude/02_specs/DEPRECATION_GUIDE.md
scaffold/templates/tasks/lessons.md                  → tasks/lessons.md
scaffold/templates/.claude/hooks/check-code-quality.sh → .claude/hooks/check-code-quality.sh
scaffold/templates/.claude/hooks/stop-reminder.sh    → .claude/hooks/stop-reminder.sh
scaffold/templates/commitlint.config.js              → commitlint.config.js
scaffold/templates/.claudeignore                     → .claudeignore
```

After copying, make hook scripts executable:

```bash
chmod +x .claude/hooks/check-code-quality.sh
chmod +x .claude/hooks/stop-reminder.sh
```

---

## Step 2: Create tasks/todo.md

Create `tasks/todo.md` with this content:

```markdown
# Current Sprint Tasks

> Last updated: {TODAY'S DATE}
> Note: This file tracks the current sprint's concrete work items.

## In Progress

(none)

## Up Next

- [ ] Create first feature spec (specs/001)

## Blocked

(none)

## Done (this sprint)

- [x] Dev foundation setup (scaffold)
```

---

## Step 3: Generate AGENTS.md (project-specific)

Read the project's `package.json`, directory structure, and any existing docs to generate `AGENTS.md` at the project root.

The file MUST contain these sections (adapt content to the actual project):

```markdown
# AGENTS.md

> Cross-agent instructions for all AI coding assistants

## Global Runtime Alignment

This project inherits Yoshida's global AI-agent rules:

1. `/Users/keigoyoshida/AGENTS.md`
2. `/Users/keigoyoshida/CLAUDE.md`
3. `/Users/keigoyoshida/.claude/CLAUDE.md`

When these files and this project file conflict, follow this order:

1. Direct user request
2. The closest project-specific `AGENTS.md` / `CLAUDE.md`
3. `/Users/keigoyoshida/AGENTS.md`
4. `/Users/keigoyoshida/.claude/CLAUDE.md`
5. General best practices

## Commands

(List ALL scripts from package.json, plus common manual commands like npx supabase, etc.)

## Architecture

(Framework, database, hosting, testing tools — one line each)

## Project Structure

(Directory tree, 2 levels deep, with brief descriptions)

## Before You Implement

1. Read `/Users/keigoyoshida/AGENTS.md` and the nearest project `CLAUDE.md` / `.claude/CLAUDE.md`
2. Read `docs/INDEX.md` or `.claude/01_docs/00_INDEX.md` if either exists
3. Check progress tracker for current priorities
4. If the feature has a spec, read `specs/{number}-{name}/` or `.claude/02_specs/{feature}/`
5. Review immutable principles: `.claude/constitution.md`

## Coding Conventions

(Extract from existing linting config, tsconfig, or CLAUDE.md. Include:)

- File naming (kebab-case, PascalCase for components, etc.)
- Variable/function naming (camelCase)
- Type naming (PascalCase)
- Constant naming (UPPER_SNAKE_CASE)
- Prohibited patterns (any, console.log, inline styles, etc.)

## Testing Requirements

- Coverage target: 80%+
- Every API route: test 200, 401, 400, 404 responses
- (Add project-specific requirements)

## Security

- Auth check on all non-public API routes
- Input validation with Zod schemas (or equivalent)
- (Add project-specific security requirements)

## Multi-Agent Workflow

This project supports parallel development with multiple AI agents:

1. **Specifications** in `specs/{N}-{name}/spec.md` define WHAT to build
2. **Plans** in `specs/{N}-{name}/plan.md` define HOW to build it
3. **Tasks** in `specs/{N}-{name}/tasks.md` list work units with `[P]` markers
4. Agents pick up `[P]` tasks independently; non-`[P]` tasks run sequentially
5. All agents share `.claude/constitution.md` as immutable principles

### Agent Roles

| Agent           | Best For                          | Examples                                                  |
| --------------- | --------------------------------- | --------------------------------------------------------- |
| **Claude Code** | Context-heavy, interactive work   | Spec writing, UI, complex logic, test design, integration |
| **Codex**       | Well-defined, pattern-based tasks | Migrations, type definitions, CRUD APIs, bulk changes     |
| **Either**      | Tasks both handle equally         | Test implementation, doc updates, bug fixes, config       |

### Handoff Protocol

| Marker | Meaning     | Example                                                |
| ------ | ----------- | ------------------------------------------------------ |
| `[ ]`  | Not started | `- [ ] [P] Create migration`                           |
| `[-]`  | In progress | `- [-] [P] Create migration (Claude Code, YYYY-MM-DD)` |
| `[x]`  | Completed   | `- [x] [P] Create migration (Claude Code, YYYY-MM-DD)` |
| `[!]`  | Blocked     | `- [!] [P] Create migration — BLOCKED: reason`         |

## What NOT to Do

- Do not guess PR workflow, deploy path, DB behavior, billing impact, or external-send policy.
- Do not display secrets, API keys, tokens, cookies, `.env` values, or PII.
- Do not run destructive operations, production-impacting actions, DB changes, external sends, commits, pushes, or deploys without confirmation.
- Do not edit files you have not read.
```

---

## Step 4: Create root CLAUDE.md bridge

Root `CLAUDE.md` is a bridge for Claude Code. The detailed project-specific rules live at `.claude/CLAUDE.md`.

If root `CLAUDE.md` does not exist, copy `scaffold/templates/CLAUDE.md` to `CLAUDE.md` and adjust the project name if needed.

If root `CLAUDE.md` already contains detailed project rules, move those detailed rules into `.claude/CLAUDE.md`, then replace root `CLAUDE.md` with a thin bridge:

```markdown
# Claude Code Entry

このプロジェクトの Claude Code 入口です。Codex と共通の入口は `AGENTS.md`、プロジェクト固有の詳細正本は `.claude/CLAUDE.md` です。

## 必読

1. `/Users/keigoyoshida/CLAUDE.md`
2. `/Users/keigoyoshida/AGENTS.md`
3. `./AGENTS.md`
4. `./.claude/CLAUDE.md`

## 重要ルール

- 詳細ルールは `.claude/CLAUDE.md` に集約してください。
- Codex と引き継ぐ作業文脈は、秘密情報とPIIを除外して `/Users/keigoyoshida/Desktop/_core/_org-knowledge/03_claude-handoff/ai-handoff/` に要約してください。
```

Also ensure `.claude/AGENTS.md` exists by copying `scaffold/templates/.claude/AGENTS.md`.

---

## Step 5: Configure Claude Code hooks

Update `.claude/settings.json` to include hooks:

```json
{
  "permissions": {
    "allow": []
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-code-quality.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/stop-reminder.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

If `.claude/settings.json` already has content, MERGE the `hooks` section into the existing JSON (preserve existing `permissions`).

---

## Step 6: Install Husky + lint-staged + commitlint

Run:

```bash
npm install --save-dev husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init
```

Then set up the git hooks:

**`.husky/pre-commit`** (overwrite the default):

```
npx lint-staged
```

**`.husky/commit-msg`** (create new):

```
npx commitlint --edit $1
```

Add `lint-staged` config to `package.json` (merge into existing JSON):

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

Verify `"prepare": "husky"` exists in `package.json` scripts (husky init adds it).

---

## Step 7: Set up document hierarchy (.claude/01_docs, 02_specs, 03_plans)

All project documentation lives under `.claude/` in numbered folders:

```
.claude/
├── 01_docs/     # 設計書 — WHY + 全体WHAT（プロジェクト開始時に書き切る）
├── 02_specs/    # 仕様書 — 個別機能のWHAT + HOW + UI/UX（実装直前にJust-in-Time作成）
├── 03_plans/    # 作業計画 — symlink to ~/.claude/plans（プランモード自動管理）
└── PLANS.md     # プロジェクト別プラン一覧
```

### 7a. Move existing docs/ into .claude/01_docs/

If the project has a `docs/` folder:

```bash
git mv docs .claude/01_docs
```

Then update all `docs/` path references in `.claude/CLAUDE.md`, source code comments, etc. to `.claude/01_docs/`.

If no `docs/` folder exists, create `.claude/01_docs/` and generate an INDEX.md:

1. List all `.md` files in `.claude/01_docs/`
2. Categorize into layers: Strategy, Product, Technical, Operations
3. Create reading paths (3-5 paths for common scenarios)

### 7b. Move existing specs/ into .claude/02_specs/

If the project has a `specs/` folder at root or under `docs/specs/`:

```bash
git mv specs .claude/02_specs        # or: git mv docs/specs .claude/02_specs
```

The `README.md` template (copied in Step 1) defines the 3-point spec workflow.

### 7c. Create plans folder with PLANS.md + files symlink

```bash
mkdir -p .claude/03_plans
ln -s ~/.claude/plans .claude/03_plans/files
```

Create `.claude/03_plans/PLANS.md` to track project-specific plans:

```markdown
# {PROJECT NAME} プラン一覧

## 進行中

| ステータス | ファイル | 内容 |
|:---------:|---------|------|

## 完了

| ステータス | ファイル | 内容 | 完了日 |
|:---------:|---------|------|--------|

## 未着手

| ステータス | ファイル | 内容 |
|:---------:|---------|------|
```

This gives a clean editor sidebar view:

```
03_plans/
├── PLANS.md    ← Project plan index (top of folder)
└── files/      ← Expand to see actual plan files
```

### 7d. Update .gitignore

Add to `.gitignore`:

```
# Claude Code plans (files/ is symlink to ~/.claude/plans)
.claude/03_plans/files/
```

---

## Step 8: Create or update .claude/CLAUDE.md (REQUIRED)

> **Standard placement**: project-specific CLAUDE.md MUST live at `.claude/CLAUDE.md`, NOT at project root. This separates it from the global `~/.claude/CLAUDE.md` and keeps Claude Code's lookup unambiguous.

### 8a. If `.claude/CLAUDE.md` does NOT exist — create it

Copy `scaffold/templates/.claude/CLAUDE.md` to `.claude/CLAUDE.md`, then fill project-specific fields. The generated file must preserve the global runtime references:

```markdown
# {PROJECT NAME} — Claude Code Project Instructions

> Project-specific rules. The global `/Users/keigoyoshida/AGENTS.md`, `/Users/keigoyoshida/CLAUDE.md`, and `~/.claude/CLAUDE.md` handle personal style, safety, and cross-agent runtime alignment.

## 必読

1. `/Users/keigoyoshida/AGENTS.md`
2. `/Users/keigoyoshida/CLAUDE.md`
3. `/Users/keigoyoshida/.claude/CLAUDE.md`
4. `../AGENTS.md`

## プロジェクト概要

(1-3 lines: what this product is, who uses it, current phase)

## 技術スタック

(Framework / database / hosting / testing — one line each, link to AGENTS.md for full list)

## 開発ワークフロー（docs → specs → plans → 実装）

| 種類 | 役割 | 作成タイミング | 置き場 |
|------|------|---------------|--------|
| **docs（設計書）** | WHY + 全体WHAT | プロジェクト開始時に1回書き切る | `.claude/01_docs/` |
| **specs（仕様書）** | 個別機能のWHAT + HOW + UI/UX | その機能を実装する直前 | `.claude/02_specs/<feature>/` |
| **plans（作業計画）** | 実装の手順書 | 3ステップ以上のタスクでプランモード使用 | `.claude/03_plans/` |

## クイックリファレンス

| All-agent instructions | `AGENTS.md` (project root) |
| Immutable principles | `.claude/constitution.md` |
| 設計書ナビゲーター | `.claude/01_docs/00_INDEX.md` |
| Feature spec workflow | `.claude/02_specs/README.md` |
| プラン一覧 | `.claude/03_plans/PLANS.md` |
| Current tasks | `tasks/todo.md` |
| Mistakes & learnings | `tasks/lessons.md` |

## プロジェクト固有ルール

(Add anything specific to this project that differs from defaults)
```

### 8b. If `.claude/CLAUDE.md` already exists — update it

Add the references table and the 開発ワークフロー section above into the existing file (preserve all existing content).

### 8c. If detailed rules exist only in root `CLAUDE.md` — split bridge and detail

Move the detailed rules into `.claude/CLAUDE.md`, then keep root `CLAUDE.md` as the thin bridge from Step 4.

Then ensure source code and docs point to the correct file: root `CLAUDE.md` for Claude Code entry, `.claude/CLAUDE.md` for detailed project rules.

---

## Step 9: Verify

Run these checks:

1. `npm run test` — all existing tests still pass
2. `echo '{"tool_input":{"file_path":"app/test.ts","content":"console.log(1)"}}' | bash .claude/hooks/check-code-quality.sh` — should output deny
3. `echo '{"tool_input":{"file_path":"tests/test.test.ts","content":"console.log(1)"}}' | bash .claude/hooks/check-code-quality.sh` — should output nothing (allowed)
4. Verify `.claude/constitution.md` contains zero project-specific terms
5. If the project is under `/Users/keigoyoshida`, run `node /Users/keigoyoshida/.codex/scripts/agent-context-audit.mjs` and confirm there are no `AGENTS.md` / `CLAUDE.md` one-sided entry gaps.

---

## Step 10: Clean up

After setup is complete, the `scaffold/` folder can be:

- **Kept** — as documentation of how the foundation was built
- **Deleted** — the templates have been copied to their final locations
- **Moved to a shared repo** — for reuse across multiple projects

---

## File Summary

After completing all steps, the project will have:

```
project/
├── .claudeignore                    # [Copied] Block AI from reading .env secrets
├── AGENTS.md                        # [Generated] Cross-agent instructions
├── CLAUDE.md                        # [Copied/Adjusted] Claude Code root bridge
├── commitlint.config.js             # [Copied] Commit message rules
├── tasks/
│   ├── todo.md                      # [Generated] Current sprint tasks
│   └── lessons.md                   # [Copied] Mistake/learning recorder
├── .claude/
│   ├── AGENTS.md                    # [Copied] Codex bridge for .claude/
│   ├── CLAUDE.md                    # [Modified] ワークフロー追加
│   ├── PLANS.md                     # [Generated] プロジェクト別プラン一覧
│   ├── constitution.md              # [Copied] 10 immutable principles
│   ├── settings.json                # [Modified] Hooks added
│   ├── 01_docs/                     # 設計書（WHY + 全体WHAT）
│   │   └── 00_INDEX.md              # [Generated] Document navigator
│   ├── 02_specs/                    # 仕様書（個別機能のWHAT + HOW + UI/UX）
│   │   ├── README.md                # [Copied] Spec-Driven workflow + templates
│   │   └── DEPRECATION_GUIDE.md     # [Copied] Spec status marking
│   ├── 03_plans/                    # 作業計画
│   │   ├── PLANS.md                 # [Generated] プロジェクト別プラン一覧
│   │   └── files/                   # [Symlink] → ~/.claude/plans
│   └── hooks/
│       ├── check-code-quality.sh    # [Copied] Pre-write quality gate
│       └── stop-reminder.sh         # [Copied] Session end reminder
└── .husky/
    ├── pre-commit                   # [Generated] lint-staged
    └── commit-msg                   # [Generated] commitlint
```
