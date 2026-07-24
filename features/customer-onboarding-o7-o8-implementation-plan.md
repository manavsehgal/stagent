# G-132–G-138 implementation plan

Status: completed 2026-07-23

Authoritative specifications:

- `features/workflow-supervision-and-recovery.md`
- `features/first-run-feedback-and-runtime-guidance.md`
- `features/better-sqlite3-13-native-upgrade.md`

Architecture impact: `features/architect-report.md`

## Scope challenge result

- **PROCEED as-is:** complete the seven already-groomed goals in their
  dependency order. The operator explicitly requested all of them.
- **REDUCE:** presentation-only fixes were rejected because they would leave
  fabricated approval denial and workflow recovery/audit gaps open.
- **EXPAND:** distributed workflow leasing, general replay, silent credential
  adoption, and a new event service remain outside this release train.

## What already exists

- Durable notification responses, duplicate-response conflicts, indefinite
  AskUser pause/resume, and scheduler reconciliation.
- Workflow run numbers, child-task run identity, receipt-run rows, Operations
  Receipts, task logs, generated-document task identity, and a polling status
  API.
- Atomic sequence/swarm retry claims and fresh runtime preflight for
  `blocked_runtime`.
- A Start-run sheet with duplicate-submit protection and input preservation.
- Safe global Codex detection plus explicit, verified adoption into Relay's
  isolated auth store.
- Sticky telemetry/glance rails and a tokenized fallback offset.
- Node 22 engine policy, native binding checks, migration/backup/recovery tests,
  npm customer-install smoke, and exact dependency-debt enforcement.

## NOT in scope

- Automatic approval/denial, approval expiration, or inference from silence.
- Full arbitrary workflow replay or automatic model retries.
- Recovery for parallel, loop, checkpoint, planner-executor, or unproved
  side-effecting steps.
- Automatic copying of global Claude/Codex credentials.
- A shell redesign, new cursor switching behavior, or masking geometry with
  an overlapping background.
- Replacing SQLite, lowering Node support, or suppressing npm warnings.

## Specification and acceptance mapping

| Goal | Implementation slice | Protecting evidence |
|---|---|---|
| G-133 | Persist approval pending interaction, preallocate one child identity before dispatch, reconcile restart states without automatic live-attempt replay, and keep deny terminal | real-SQLite hold/restart/allow/deny/duplicate matrix |
| G-135 | Query bounded run summaries/details from run tasks, task logs, receipt runs, receipts, documents, and current state; render audit card and exact-run anchors | multi-run API test, component test, receipt-link regression |
| G-134 | Require a trusted blueprint replay-safe assertion, compute sequence retry eligibility, expose accessible action, retain atomic preflight/claim, write recovery lifecycle evidence | transition matrix, chat self-assertion refusal, duplicate retry, completed-prefix invariants |
| G-132 | Add persistent in-sheet live status and exact named failure while keeping values visible | deferred-promise component test and failure recovery |
| G-136 | Carry safe detected-session guidance into skipped runtime reasons and Settings deep link | runtime setup/resolver/preview tests |
| G-137 | Publish measured telemetry height to shared CSS variable and assert adjoining geometry | component observer test plus browser zoom/width proof |
| G-138 | Upgrade to `better-sqlite3` 13.0.1, remove obsolete debt, prove native/database/package lifecycle | native load, DB suites, pack/install/CLI smoke |

## Vertical slices

### 1. Explicit-only approval truth (G-133)

- Extend `WorkflowState.pendingInteraction` with an approval arm.
- Replace `waitForApproval` timeout polling with one durable notification and a
  paused return.
- Extend `resumeWorkflowInteraction` to atomically claim explicit allow/deny,
  persist a child attempt ID before insertion, reconcile terminal/missing
  attempts, and stop rather than replay a live attempt found after restart.
- Preserve task permission and AskUser behavior.

Checkpoint: targeted approval transition tests pass against real SQLite.

### 2. Run audit and receipt diagnostics (G-135)

- Expand run-history types and the status query with bounded per-run task,
  lifecycle-log, receipt, and current-step detail.
- Redact/bound human-readable failures and log summaries.
- Render a run-history/audit card on workflow details.
- Give workflow receipt buttons an exact `?run=` anchor and focus/expand the
  matching audit run; keep schedule/task links unchanged.

Checkpoint: two runs remain visible after rerun and exact receipt navigation
opens meaningful diagnostics.

### 3. Safe failed-step resume (G-134)

- Add a pure sequence-retry eligibility check with explicit unavailable reason;
  only trusted blueprints may assert `replaySafe`, never autonomous Chat.
- Run target preflight for ordinary failed steps before the atomic claim.
- Expose **Resume from failed step** only when the completed-prefix invariant
  holds; leave unsupported patterns unavailable with explanatory copy.
- Persist retry start/failure/completion evidence into the run audit substrate.

Checkpoint: one caller wins, completed prefix is unchanged, retry failure is a
new attempt, and unsupported patterns fail closed.

### 4. First-run presentation repairs (G-132, G-136, G-137)

- Add a polite live region beneath Start with starting/success/failure language.
- Add detected global Codex status to runtime setup state and skipped-candidate
  guidance, with explicit Settings adoption/sign-in link.
- Measure telemetry's border-box height and update
  `--chrome-rail-measured`; use the token fallback before measurement.

Checkpoint: component/a11y suites and browser geometry proof pass; no hand
cursor code is introduced.

### 5. Native SQLite upgrade (G-138)

- Install `better-sqlite3@13.0.1`, refresh the lockfile, and remove
  `prebuild-install` from the production debt contract.
- Run native load, migration/bootstrap, backup/restore/recovery, Host, packed
  npm, CLI, and production-build checks.
- If a supported platform lacks the declared binary/source path, revert this
  slice and record the exact upstream blocker; do not weaken platform claims.

### 6. Integrated verification and closure

- Run targeted suites after each slice, then TypeScript, token validation,
  install-debt, runtime graph, build, and customer-path checks.
- Start an isolated dev instance and execute a real multi-step workflow.
- Verify Start feedback, approval wait/audit/resume, Codex guidance, receipt
  link, and rail geometry in the in-app Browser.
- Perform fresh code review, update goal/spec/changelog/backlog status, and
  locally commit only Relay-owned goal changes. Do not publish or release.

## Regression test budget

- Approval/recovery engine: 12–16 real-SQLite transition cases.
- Audit API/query: 8–10 cases across two runs, logs, documents, receipts,
  redaction, and bounds.
- Components: 10–14 cases for pending/failure/audit/receipt/retry/Codex copy.
- Shell: ResizeObserver/token fallback plus desktop/medium/zoom browser checks.
- Native: install debt, database lifecycle, Host, package, CLI, and build
  suites.

Initial commands:

```bash
npx vitest run src/lib/workflows/__tests__/recovery-contract.test.ts
npx vitest run src/app/api/workflows/[id]/status/__tests__/route.test.ts
npx vitest run src/components/apps/__tests__/run-now-sheet.test.tsx
npx vitest run src/components/workflows src/components/operations/__tests__/operations-ui.test.tsx
npx vitest run src/lib/settings/__tests__/runtime-setup.test.ts src/lib/agents/runtime/__tests__/execution-target.test.ts
npx vitest run src/components/shell/__tests__/telemetry-rail.test.tsx src/components/shell/__tests__/glance-rail.test.tsx
npm run check:install-debt
npx tsc --noEmit
npm run validate:tokens
npm run test:runtime-graph
npm run build
```

## Error & Rescue Registry

| Failure | Visible outcome | Rescue |
|---|---|---|
| process exits while approval is pending | workflow remains paused with one Inbox action | scheduler/response reconciliation resumes from persisted interaction |
| duplicate approval/retry | named 409 conflict; no second task | refetch authoritative state |
| historic logs are incomplete | run still shows task/receipt/state evidence and names missing detail | do not fabricate events or use broad JSON scans |
| retry safety cannot be proved | action hidden/disabled with reason | use explicit rerun from beginning |
| global Codex exists but is keyring-only | detected, not connected, isolated sign-in guidance | customer explicitly signs in; no export/copy |
| ResizeObserver unavailable | tokenized fallback geometry | retain fixed fallback and report measurement unavailable only in diagnostics |
| native binary/install fails on supported target | G-138 remains open with exact platform blocker | retain v12/debt entry; never suppress warning |
| runtime module cycle | real dev task fails before dispatch | replace static registry-adjacent import with function-local dynamic import and rerun smoke |

## Rollback

Each slice is independently revertible. Approval rollback must return to a
durable paused state, never timeout-as-denial. Audit additions are response/UI
additions over existing rows. Retry UI can be disabled without deleting run
history. Rail measurement falls back to the existing token. The SQLite upgrade
can revert package/lock/debt together without customer database conversion.
