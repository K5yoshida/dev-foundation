# specs/ — Specification-Driven Development

> Based on GitHub's spec-kit pattern.
> Every feature gets its own folder. No code without a spec.

## Overview

This folder holds feature specifications that bridge design docs (`docs/`) and implementation.

- `docs/` = the authoritative design (WHAT the product should be)
- `specs/` = the implementation blueprint (HOW to build it, in what order)
- `tasks/` = the current sprint's work items

## Workflow

```
① specify  →  Write spec.md (WHAT to build, not HOW)
② plan     →  Write plan.md (technical approach, files, tests)
③ tasks    →  Write tasks.md (parallelizable work units with [P] markers)
④ implement → Execute tasks — multiple agents can work on [P] tasks simultaneously
```

## Folder Structure

```
specs/
├── README.md                          # This file (workflow + templates)
├── 001-{feature-name}/               # Feature folders
│   ├── spec.md                        # WHAT
│   ├── plan.md                        # HOW
│   └── tasks.md                       # WORK (parallelizable task list)
├── 002-{feature-name}/
│   ├── spec.md
│   ...
```

### Naming Convention

`{three-digit-number}-{kebab-case-name}/`

---

## Templates

### spec.md Template

```markdown
# spec: {Feature Name}

> Source: docs/{relevant-doc}.md
> Status: draft | review | approved | implementing | done
> Created: YYYY-MM-DD

## Overview

(1-3 sentences: what this feature does and why it matters)

## User Personas

| Persona | Role | Key need |
| ------- | ---- | -------- |
| ...     | ...  | ...      |

## User Stories

### Story 1: {title}

As a [persona], I want to [action], so that [outcome].

**Acceptance Criteria:**

- [ ] ...
- [ ] ...

## Validation Checklist

- [ ] **WHO**: End user, decision-maker, operator, and support contact are identified
- [ ] **JOB**: One clear decision this feature advances is defined
- [ ] **DATA**: Settings vs. raw data vs. derived data responsibilities are separated
- [ ] **PROOF**: Success metric is defined and measurable
- [ ] **FAILURE**: Behavior when external dependencies are unavailable is defined
- [ ] **PERFORMANCE**: Speed target and verification method are defined
- [ ] **OPERATIONS**: Support can check status and diagnose without reading code
- [ ] **DOCS**: Documents to update after implementation are listed

## Non-Functional Requirements

| Category      | Requirement |
| ------------- | ----------- |
| Performance   | ...         |
| Security      | ...         |
| Accessibility | ...         |

## Test Design

> Define test scenarios at spec time. These become Phase 0 test skeletons in tasks.md.

| Scenario | Type                     | Input | Expected Output |
| -------- | ------------------------ | ----- | --------------- |
| ...      | unit / integration / e2e | ...   | ...             |

## Edge Cases

1. What happens when there is no data?
2. What happens when the API is unreachable?
3. What happens when the user has incomplete configuration?

## [NEEDS CLARIFICATION]

(List anything that is uncertain. Do NOT guess — mark it explicitly.)
```

### plan.md Template

```markdown
# plan: {Feature Name}

> Spec: specs/{number}-{name}/spec.md
> Status: draft | review | approved
> Created: YYYY-MM-DD

## Approach

(2-5 sentences: the high-level technical strategy)

## Files to Create/Modify

| Action | Path             | Purpose |
| ------ | ---------------- | ------- |
| Create | `app/api/...`    | ...     |
| Create | `components/...` | ...     |
| Modify | `lib/...`        | ...     |
| Create | `tests/...`      | ...     |

## Data Model Changes

| Table | Change | Migration needed |
| ----- | ------ | ---------------- |
| ...   | ...    | Yes / No         |

## API Changes

| Method | Endpoint   | Auth     | Purpose |
| ------ | ---------- | -------- | ------- |
| GET    | `/api/...` | Required | ...     |
| POST   | `/api/...` | Required | ...     |

## Test Strategy

> These tests are created in Phase 0 (before implementation begins).

| Level       | File                             | Scenarios    | Tool       |
| ----------- | -------------------------------- | ------------ | ---------- |
| Unit        | `tests/{name}.test.ts`           | ~N scenarios | Vitest     |
| Integration | `tests/api/{name}-route.test.ts` | ~N scenarios | Vitest     |
| E2E         | `e2e/{name}.spec.ts`             | ~N scenarios | Playwright |

### Phase 0 Test Skeleton Checklist

- [ ] All test files created with describe blocks
- [ ] All test cases listed (using `.todo()` or `.skip()`)
- [ ] `npm run test` passes (pending tests don't fail the suite)

## Rollback Plan

If something breaks:

1. ...
2. ...

## Docs to Update

- [ ] Progress tracker (e.g. IMPLEMENTATION_STATUS.md)
- [ ] Relevant design docs
```

### tasks.md Template

```markdown
# tasks: {Feature Name}

> Plan: specs/{number}-{name}/plan.md
> Legend: [P] = parallelizable (can run on separate agents simultaneously)

## Phase 0: Test Skeleton

> Create test files BEFORE writing implementation code.
> This ensures test coverage is designed at spec time, not bolted on after.

- [ ] [P] Create `tests/{feature-name}.test.ts` with describe blocks:
  - Happy path: main success scenarios
  - Error cases: validation failures, auth failures, not found
  - Edge cases: empty data, max values, concurrent access
- [ ] [P] Create `tests/api/{feature-name}-route.test.ts` with describe blocks:
  - 200: successful responses
  - 401: unauthenticated access
  - 403: unauthorized access (wrong role)
  - 400: invalid input
  - 404: resource not found
- [ ] Verify: `npm run test` runs (all new tests should be `.todo()`, not failing)

## Phase 1: Data Layer

- [ ] [P] Create migration for {table}
- [ ] [P] Add RLS policy for {table}
- [ ] Write unit tests for data access layer

## Phase 2: API Layer

- [ ] [P] Implement GET /api/{resource}
- [ ] [P] Implement POST /api/{resource}
- [ ] Write API integration tests

## Phase 3: UI Layer

- [ ] Create {Component} component
- [ ] Connect to API with loading/error/empty states
- [ ] Write component tests

## Phase 4: Verification

- [ ] `npm run build` passes
- [ ] `npm run test` passes (coverage >= 80%)
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] Update progress tracker
- [ ] Update relevant docs

## Agent Assignment Guide

| Task type                        | Recommended agent | Reason                     |
| -------------------------------- | ----------------- | -------------------------- |
| Migration, RLS, type definitions | Codex             | Structured, pattern-based  |
| UI components, complex logic     | Claude Code       | Context-aware, interactive |
| Test generation                  | Either            | Both capable               |
| Design review, spec writing      | Claude Code       | Strong at reasoning        |
| Bulk CRUD API routes             | Codex             | Fast execution             |

## Completion Criteria

All acceptance criteria from spec.md are met:

- [ ] (copy from spec.md)
```
