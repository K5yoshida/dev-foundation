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
scaffold/templates/constitution.md    → memory/constitution.md
scaffold/templates/specs-readme.md    → specs/README.md
scaffold/templates/lessons.md         → tasks/lessons.md
scaffold/templates/check-code-quality.sh → .claude/hooks/check-code-quality.sh
scaffold/templates/stop-reminder.sh   → .claude/hooks/stop-reminder.sh
scaffold/templates/commitlint.config.js → commitlint.config.js
scaffold/templates/.claudeignore      → .claudeignore
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

## Commands

(List ALL scripts from package.json, plus common manual commands like npx supabase, etc.)

## Architecture

(Framework, database, hosting, testing tools — one line each)

## Project Structure

(Directory tree, 2 levels deep, with brief descriptions)

## Before You Implement

1. Read `docs/INDEX.md` (if exists) or relevant docs
2. Check progress tracker for current priorities
3. If the feature has a spec, read `specs/{number}-{name}/`
4. Review immutable principles: `memory/constitution.md`

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
5. All agents share `memory/constitution.md` as immutable principles

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

(Extract from existing CLAUDE.md or define new rules)
```

---

## Step 4: Configure Claude Code hooks

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

## Step 5: Install Husky + lint-staged + commitlint

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

## Step 6: Generate docs/INDEX.md (if docs/ exists)

If the project has a `docs/` folder with design documents, generate `docs/INDEX.md`:

1. List all `.md` files in `docs/`
2. Categorize them into layers:
   - Strategy & Context — "Why this product?"
   - Product Requirements — "What to build?"
   - Technical Design — "How to build it?"
   - Operations & Quality — "How to maintain it?"
   - Top-Level Standards — "Read BEFORE any work"
3. Create reading paths (3-5 paths for common scenarios)
4. Note the relationships: docs/ = design, specs/ = blueprints, tasks/ = sprint items

If no `docs/` folder exists, skip this step.

---

## Step 7: Update .claude/CLAUDE.md references

If `.claude/CLAUDE.md` exists, add these references to any "quick reference" or "files" section:

```markdown
| All-agent instructions | `AGENTS.md` (project root) |
| Immutable principles | `memory/constitution.md` |
| Feature spec workflow | `specs/README.md` |
| Current tasks | `tasks/todo.md` |
| Mistakes & learnings | `tasks/lessons.md` |
```

---

## Step 8: Verify

Run these checks:

1. `npm run test` — all existing tests still pass
2. `echo '{"tool_input":{"file_path":"app/test.ts","content":"console.log(1)"}}' | bash .claude/hooks/check-code-quality.sh` — should output deny
3. `echo '{"tool_input":{"file_path":"tests/test.test.ts","content":"console.log(1)"}}' | bash .claude/hooks/check-code-quality.sh` — should output nothing (allowed)
4. Verify `memory/constitution.md` contains zero project-specific terms

---

## Step 9: Clean up

After setup is complete, the `scaffold/` folder can be:

- **Kept** — as documentation of how the foundation was built
- **Deleted** — the templates have been copied to their final locations
- **Moved to a shared repo** — for reuse across multiple projects

---

## File Summary

After completing all steps, the project will have:

```
project/
├── .claudeignore                # [Copied] Block AI from reading .env secrets
├── AGENTS.md                    # [Generated] Cross-agent instructions
├── commitlint.config.js         # [Copied] Commit message rules
├── memory/
│   └── constitution.md          # [Copied] 10 immutable principles
├── specs/
│   └── README.md                # [Copied] Spec-Driven workflow + templates
├── tasks/
│   ├── todo.md                  # [Generated] Current sprint tasks
│   └── lessons.md               # [Copied] Mistake/learning recorder
├── docs/
│   └── INDEX.md                 # [Generated] Document navigator (if docs/ exists)
├── .claude/
│   ├── settings.json            # [Modified] Hooks added
│   └── hooks/
│       ├── check-code-quality.sh  # [Copied] Pre-write quality gate
│       └── stop-reminder.sh       # [Copied] Session end reminder
└── .husky/
    ├── pre-commit               # [Generated] lint-staged
    └── commit-msg               # [Generated] commitlint
```
