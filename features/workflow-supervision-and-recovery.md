---
title: Workflow Supervision and Recovery
status: completed
priority: P0
milestone: post-mvp
source: output/staging/2026-07-23-operator-walkthrough/FINDINGS-live.md
dependencies:
  - workflow-recovery-state-transition-contracts
  - workflow-run-history
  - operations-receipts
---

# Workflow Supervision and Recovery

## Description

The public `0.46.3` first-customer walkthrough exposed three connected trust
gaps after a workflow starts. An unanswered checkpoint approval is converted
into a denial the customer never made. Workflow tasks, logs, run numbers, and
receipts persist, but the workflow page does not render them as an auditable
run. Safe suffix-only retry exists for some failures, but the customer usually
sees only a whole-workflow **Re-run** action.

This specification completes the supervision loop in three independently
releasable goals. G-133 fixes decision truth first. G-135 makes each attempt
auditable. G-134 then exposes recovery only where Relay can prove it will not
repeat completed work or unreceipted external side effects.

## User story

As an operator supervising a multi-step workflow, I want Relay to wait for my
real decisions, show a durable account of every attempt, and safely continue
from a recoverable failure so that unattended time never becomes a fabricated
decision or duplicated work.

## G-133 — Explicit-only workflow approval resolution

### Outcome

An unanswered `WorkflowCheckpoint` approval remains pending indefinitely. The
workflow stays paused across process restart and admits one durable child
attempt only after explicit allow. Its task identity is persisted before
insertion/dispatch: a missing row is recovered with the same identity, a
terminal row is reconciled, and a non-terminal row found after restart fails
visibly instead of being replayed. Explicit deny dispatches nothing.

### Technical approach

- Remove the five-minute synthetic-denial branch from `waitForApproval`.
- Persist a paused/waiting state that is reconstructable from SQLite.
- Preserve explicit allow/deny handling, duplicate-response conflicts, and
  actionable Inbox/deep-link behavior.
- Distinguish cancellation or administrative expiry, if later introduced, from
  user denial with separate named states and copy.

### Acceptance criteria

- [x] Waiting beyond five minutes never writes `behavior: "deny"`.
- [x] An unanswered workflow remains paused after restart and still exposes one
      actionable approval.
- [x] Explicit allow admits one durably identified attempt; explicit deny
      fails/stops it with truthful user-denial copy.
- [x] Duplicate or stale responses return a named conflict and dispatch no
      duplicate child task.
- [x] Task permission approvals and `requiresInput` ask-user behavior do not
      regress.

## G-135 — Run-scoped workflow audit and receipt diagnostics

### Outcome

Workflow details render a durable run-by-run execution history comparable to
task audit history. Operations Receipt actions open meaningful diagnostics for
the exact workflow run instead of navigating to the unchanged current page.

### Technical approach

- Add an indexed run-scoped event/query boundary. Prefer explicit workflow/run
  identity over JSON `LIKE` scans.
- Reconcile existing child tasks, agent-log lifecycle events, run summaries,
  generated documents, approvals, retry attempts, and terminal receipts into a
  bounded chronological view.
- Preserve prior run snapshots when a new execution begins; do not depend only
  on the current workflow `_state`.
- Reuse or deliberately retire the orphaned workflow debug panel.
- Point receipt diagnostics to the exact run/attempt or expand equivalent
  diagnostics inline; never render a same-route no-op.

### Acceptance criteria

- [x] Workflow details list the newest 20 runs with start/finish time, terminal
      state, step transitions, child attempts, approvals, failures, and
      resume/retry events; older runs and evidence beyond each per-run bound
      are disclosed as partial instead of silently omitted.
- [x] A new run cannot erase the prior run's audit history.
- [x] Generated documents and Operations Receipts link to the producing run.
- [x] A workflow-owned receipt action changes to a run-specific diagnostics
      view or meaningful inline expansion.
- [x] Logs remain bounded and redact credential/token material.
- [x] Schedule/task receipt navigation remains unchanged.

## G-134 — Safe resume from eligible failed steps

### Outcome

An eligible failed workflow exposes **Resume from failed step** and continues
from the exact failed step without replaying its completed prefix. Relay hides
or refuses the action when it cannot prove side-effect safety.

### Technical approach

- Reuse the atomic suffix-retry machinery for sequence workflows only when a
  trusted blueprint/operator contract explicitly marks a step replay-safe.
- Expand sequence UI from `blocked_runtime` to other safely retryable failed
  steps.
- Add patterns only after defining their completed-prefix and side-effect
  invariants; checkpoint, parallel, planner, and loop may ship incrementally.
- Make the audit surface from G-135 show each failed and resumed attempt.
- Keep **Re-run from beginning** distinct and explicit.

### Acceptance criteria

- [x] Eligible failed sequence steps expose one accessible resume action.
- [x] Resume performs a fresh execution-target preflight and atomically admits
      one caller.
- [x] Completed prefix tasks, documents, approvals, and receipts remain
      singular and unchanged.
- [x] Recovery failure is persisted as another named attempt without rewriting
      history.
- [x] Unsupported or unreceipted side-effecting steps fail closed and explain
      why resume is unavailable.
- [x] Pattern-specific tests prove every newly supported workflow family.

## Completion receipt

Accepted locally on 2026-07-23. Approval checkpoints now persist as one paused
interaction until an explicit allow or deny response; the response boundary
allocates one durable child identity for an allowed decision. Workflow details query indexed
`workflow_id`/`workflow_run_number` identity and render bounded attempts,
decisions, documents, lifecycle event names, and exact-run receipt anchors.
Ordinary sequence recovery is available only when a trusted blueprint carries
`replaySafe: true` and the eligibility check proves a completed prefix and
untouched suffix. Chat-created workflows cannot self-assert this flag. All
other steps and patterns fail closed with an explanation.

Focused workflow/API/component regressions, TypeScript, production build, the
real runtime-module graph task, and an isolated browser run passed. Browser
evidence is retained under
`output/staging/2026-07-23-goals-g132-g138/`.

## Scope boundaries

Included:

- Workflow checkpoint approval semantics.
- Durable run-level audit and receipt diagnostics.
- Explicit, safe failed-step recovery.

Excluded:

- Automatic retry of model generation.
- Inferring approval from silence.
- Distributed queues or multi-process leasing.
- Replay of arbitrary external side effects without receipts/idempotency.
- Redesigning task-level audit history.

## Verification and regression budget

- Real-SQLite approval hold/restart/allow/deny/duplicate fixtures.
- Run-history query and API contract tests across at least two runs and one
  resumed attempt.
- Component tests for pending approval, run history, receipt diagnostics, and
  resume eligibility.
- Existing transition matrix, Operations Receipt, task-history, and
  notification suites.
- Required real `npm run dev` multi-step workflow smoke because the workflow
  engine is runtime-registry-adjacent.
- Customer-identical browser proof for wait, audit, resume, and unsupported
  recovery states.

## Rescue and rollback

If a pattern cannot prove prefix and side-effect safety, ship G-134 for the
already-safe sequence/swarm subset and leave that pattern terminal. Never
restore timeout-as-denial. If a new event table is too broad for G-135, first
ship a run-scoped query over existing tasks/logs with an explicit migration
path, but do not keep the same-page receipt action.

## References

- `features/fix-workflow-hitl-ask-user.md`
- `features/workflow-recovery-state-transition-contracts.md`
- `features/transient-workflow-step-recovery-plan.md`
- `features/workflow-run-history.md`
- `features/operations-receipts.md`
