# Lessons Learned

> Record mistakes and their fixes here. The goal is to never repeat the same mistake.
> This is the mechanism by which quality compounds (Constitution, Article X).

## Format

```
### YYYY-MM-DD — {Category}

**Mistake**: What went wrong
**Root Cause**: Why it happened
**Rule**: What to do differently next time
**Applies to**: Where this rule applies (e.g., "all API routes", "widget code", "migrations")
```

## Categories

- `type-safety` — TypeScript errors, wrong types, missing validation
- `test-gap` — Missing tests, wrong assertions, flaky tests
- `security` — Auth bypass, data leak, injection, missing RLS
- `performance` — Slow queries, bundle bloat, unnecessary re-renders
- `architecture` — Wrong abstraction, coupling, missing separation
- `process` — Skipped steps, wrong order, missing verification
- `communication` — Misunderstood requirements, wrong assumptions

---

(Entries will be added as mistakes occur)
