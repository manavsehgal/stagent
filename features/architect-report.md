---
generated: 2026-07-23
mode: integration
---

# Architect Report

## Integration analysis — G-132 through G-138 customer onboarding closure

### Accepted boundary

The seven goals complete one customer journey without changing Relay's
local-first architecture:

```text
blueprint start feedback
  → explicit-only durable checkpoint approval
  → run-scoped workflow audit
  → fail-closed suffix recovery
  → truthful Codex adoption guidance
  → gap-free shell chrome
  → Node 22-native SQLite install
```

The durable notification table remains the human-in-the-loop queue (TDR-002
and TDR-003). Workflow run numbers, child tasks, task logs, receipt-run rows,
Operations Receipts, and current step state remain the execution evidence.
Relay does not gain a second event service, a distributed lease manager,
automatic credential import, or arbitrary side-effect replay.

### Change impact analysis

| Layer | Impact | Risk/control |
|---|---|---|
| workflow engine | checkpoint pause/resume and sequence suffix retry | high; real SQLite transition matrix, atomic claims, real dev workflow smoke |
| persistence/query | bounded run audit assembled from indexed run/task/receipt identities | medium; no JSON `LIKE`, no destructive migration |
| API/types | richer run-history response and exact-run receipt anchors | medium; preserve TDR-031 discriminated union |
| UI | persistent Start feedback, audit card, retry eligibility, Codex guidance, rail geometry | medium; component tests, accessibility assertions, browser geometry proof |
| native distribution | `better-sqlite3` 13 under Node 22 | high; packed artifact, migration/backup/recovery/native-load gates |

### Decisions

1. **Persist checkpoint waits; do not hold a five-minute promise.** A checkpoint
   writes one notification plus `pendingInteraction.kind = "approval"`, marks
   the workflow paused, and returns. The existing response boundary claims and
   allocates a child task identity before dispatch after explicit allow. A new
   process reuses a missing preallocated identity, reconciles a terminal task,
   and fails a non-terminal interrupted attempt visibly instead of replaying
   it. Explicit deny remains a separate terminal transition.
2. **Make run identity explicit everywhere it is queried.** Existing
   `tasks.workflowId`/`workflowRunNumber`, receipt-run rows, and Operations
   Receipts form the base. Notifications and agent logs now receive indexed
   `workflow_id`/`workflow_run_number` columns so approval and recovery events
   can be queried without JSON scans. Current step state enriches only the
   current run.
3. **Retry only trusted, proved sequence suffixes.** A failed sequence step is
   eligible only when trusted blueprint/operator metadata says
   `replaySafe: true`, every earlier step is completed, and every later step is
   untouched. Chat-created workflows cannot grant themselves this authority.
   The compare-and-swap claim and fresh target preflight remain authoritative.
4. **Explain, never auto-adopt.** Runtime setup state may carry a safe
   detected-session hint. It must not mark Codex configured or eligible before
   the isolated Relay session is explicitly created and verified.
5. **Rendered height owns rail geometry.** Telemetry measures its actual border
   box and publishes a CSS variable consumed by the next sticky rail. The
   existing token remains a no-JavaScript fallback.
6. **Adopt `better-sqlite3` 13 only with the full native gate.** The upstream
   line now requires Node 22, matching Relay's declared engine. The production
   warning allowance must be removed rather than suppressed.

### Security and privacy

- Approval silence can no longer become a fabricated denial.
- Duplicate notification responses and retry callers remain compare-and-swap
  conflicts; approved child identity is durable before task insertion.
- Run audit payloads expose per-run bounded task/event/receipt metadata,
  disclose all truncation, and exclude log payloads and task results entirely.
- Global Codex session material is never read into the client response or
  copied automatically; UI receives only availability/adoptability status.
- Native dependency changes are package-lock governed and do not alter customer
  database format.

### TDR alignment

- TDR-001: async start still returns immediately; the side panel now makes the
  pending period visible.
- TDR-002/TDR-003: SQLite notifications remain the durable approval queue.
- TDR-031: both status response arms receive the same additive `runHistory`
  contract and consumers still narrow on `pattern`.
- TDR-032: workflow-engine/runtime-adjacent edits require a real task smoke and
  function-local dynamic imports where needed.
- TDR-043: detected-but-unadopted Codex remains excluded from eligible routing.

### Review verdict

**APPROVE with ordered delivery.** Complete approval truth first, then audit,
then safe resume; the remaining presentation/native goals can follow without
weakening those invariants. If full audit reconciliation proves insufficient
without a schema addition, ship the existing indexed task/receipt view and
record the missing event class explicitly rather than introducing JSON scans.

---

*Generated by `/architect` — Integration Analysis mode*
