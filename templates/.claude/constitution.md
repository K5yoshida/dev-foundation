# Constitution — Immutable Development Principles

> These principles apply to ALL projects. They are never overridden by feature requests,
> deadlines, or convenience. Extracted from battle-tested decision frameworks.
>
> Portability: This file contains NO project-specific terms. Copy to any project as-is.

---

## Article I — Design Before Code

No implementation begins without a written specification.
A specification must answer:

1. **WHO** uses it — the end user, the decision-maker, the operator, and the support contact
2. **WHAT decision** it advances — one clear job, not a bundle of features
3. **HOW it fails** — defined behavior when external dependencies are unavailable

Violation: starting to code because "the task seems obvious."

---

## Article II — Proof Over Presence

"It exists in the codebase" is not "it works in production."
Completion requires three separate judgments:

1. **Implemented** — code exists and tests pass
2. **Operational** — external config is set, monitoring is active, runbook exists
3. **Proven** — measurable success criteria are met with real data

Never mark a feature as done based on implementation alone.

---

## Article III — Data Integrity

Separate three responsibilities clearly:

- **Settings** — values the user configures (stored as source of truth)
- **Raw data** — events, submissions, logs (immutable once recorded)
- **Derived data** — aggregations, comparisons, reports (always re-calculable)

Never store a derived value as the source of truth.
Ensure recalculation, audit, and rollback are always possible.

---

## Article IV — Graceful Degradation

Every external dependency must have:

1. **Defined behavior when unavailable** — not a crash, but a clear degraded state
2. **User-visible indication** — what is working vs. what is not
3. **Safe verification mechanism** — dry-run or health check without side effects

"It works when everything is connected" is not a valid design.

---

## Article V — Customer Literacy First

The user may have zero technical background. Design for them:

1. No technical jargon in user-facing surfaces
2. The next action must be obvious without instruction
3. "Configured but not actually working" states must be impossible
4. If the user needs to explain it to a colleague, it should be easy to describe

Violation: a screen that requires a support call to understand.

---

## Article VI — Speed Is a Feature

Performance budgets are defined at design time, not optimized later.

1. Public-facing paths have explicit load-time targets
2. Measure on low-end devices and slow connections
3. "We'll optimize later" is prohibited — it never happens

If a change makes a critical path slower, it does not ship.

---

## Article VII — Operations Is Part of the Product

Monitoring, alerting, and recovery are not afterthoughts:

1. Every cron job, webhook, and external integration has a runbook
2. Support can diagnose issues without reading source code
3. Re-execution, dry-run, and audit trail must exist for every automated process

A feature without operational support is an unfinished feature.

---

## Article VIII — Decisions Must Be Traceable

Every change must have a clear chain:

1. **Business outcome** — why this change matters to users or revenue
2. **Technical rationale** — why this approach was chosen over alternatives
3. **Status update** — the progress tracker reflects reality after every change

If you cannot explain why a change was made, it should not have been made.

---

## Article IX — Minimal Blast Radius

1. Change only what needs to change
2. No temporary fixes that become permanent
3. Prefer reversible decisions over irreversible ones
4. Test the impact of a change before it reaches all users

When in doubt, do less. A smaller, correct change beats a large, risky one.

---

## Article X — Self-Improvement Loop

Mistakes are inevitable. Repeating them is not:

1. Every correction from a user or reviewer is recorded in `tasks/lessons.md`
2. Patterns that caused mistakes become explicit rules
3. Rules are reviewed and refined each cycle
4. The mistake rate must decrease over time

This is not optional. It is the mechanism by which quality compounds.
