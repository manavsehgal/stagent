---
title: Recent regression lineage and release guard hardening
status: completed
goal: G-142
priority: P0
date: 2026-07-24
source: output/staging/2026-07-24-operator-walkthrough/FINDINGS-live.md
dependencies:
  - risk-tiered-quality-gate
  - mutation-strength-governance
  - critical-api-route-contracts
  - e2e-test-automation
---

# Recent regression lineage and release guard hardening (G-142)

## Outcome

Reconstruct how Relay's customer-facing behavior changed between July 21 and
July 24, 2026, identify recurring defects and acceptance gaps that passed the
existing quality gates, repair the highest-risk coherent tranche, and make the
same regression classes fail deterministically before a future goal can be
accepted or a release can be cut.

This goal does not promise that Relay will never contain another defect. Its
measurable promise is narrower and enforceable: every confirmed recurring
regression in the audit window receives a verified lineage, a named
disposition, and the lowest reliable automated guard or a stronger documented
deterministic boundary.

## Goal Contract

- **Outcome:** turn the last four release days of git, operator-conversation,
  changelog, staging, and test evidence into a regression-lineage ledger;
  explain why existing checks missed each confirmed regression; implement the
  highest-risk related fixes and guards; and bind those guards into the
  appropriate local, pull-request, acceptance, or release gate.
- **Constraints:** audit 2026-07-21 through 2026-07-24, following earlier
  history only far enough to establish a last-known-good state; verify
  conversation claims against code, commits, release artifacts, or a
  reproduction; reuse G-065/G-068/G-070 quality infrastructure; do not inflate
  test count with duplicate or page-wide snapshot tests; do not equate global
  coverage percentage with load-bearing protection; use no live customer data,
  paid provider credentials, or public mutations; preserve unrelated work.
- **Executable verification:** historical lineage and reproduction receipts;
  red-before/green-after tests or deliberate fault/mutation proof; focused
  suites; test-audit and quality-gate topology; TypeScript; production build;
  the real runtime-module-graph task smoke when its graph is touched;
  customer-identical staging/browser checks for affected journeys; release
  preflight/package checks when release machinery is touched; and fresh review.
- **Operator gates:** product/taste decisions with multiple valid answers,
  expansion beyond the audit window, a new dependency or material CI-cost
  increase, credentials or paid services, destructive history operations, and
  every push, publish, tag, release, or other external write.
- **Stop/rescue:** after two materially different attempts cannot identify one
  exact regressing commit, retain the failing reproduction and record the
  narrowest defensible commit range with cause `unknown`; if discovery exposes
  more than three independent implementation roots, keep this goal as the
  lineage/guard program and groom bounded child goals before coding unrelated
  fixes; never invent causality or weaken an accepted gate to make it pass.

## Why this goal exists

Relay's existing gate is broad: all-source coverage ratchets, critical route
contracts, mutation checks, runtime graph smoke, packaged-install tests, and
thousands of unit/integration regressions all passed during recent work. Yet the
2026-07-24 operator walkthrough found:

- a provider deep link that loses its target after asynchronous layout growth;
- provider summary copy that contradicts an available ChatGPT activation path;
- provider and task-routing information architecture organized by
  implementation buckets rather than the customer journey;
- an included-runtime checkbox with inverted accessible naming;
- provider density and consistency that the operator explicitly rejected after
  G-141 had been recorded as complete; and
- primary navigation compressed to an unusable sliver at a 390 px viewport.

The same four-day history also contains repeated corrective commits for provider
auth/readiness, entitlement and sample-state reconciliation, workflow recovery,
npm-install correctness, and release qualification. The recurring problem is
therefore not simply missing lines under test. It is a mismatch between
customer-observable acceptance claims and the seams the existing tests and
release gates actually protect.

## Audit boundary and evidence hierarchy

### Required time window

The primary window is the complete Relay history from the start of
2026-07-21 through the end of 2026-07-24. Earlier commits may be inspected only
to prove the last-known-good behavior or an older recurring pattern. Later work
belongs to a follow-on audit unless it directly repairs a finding already in
this ledger.

### Required evidence

Review and reconcile:

1. git log, diffs, blame, reverted/replaced implementations, file churn, tags,
   and release commits;
2. `CHANGELOG.md`, `features/changelog.md`, relevant accepted feature
   specifications/plans, TDRs, and release receipts;
3. the available Codex/operator task transcript and supplied attachments for
   reports such as “worked in an earlier release,” “happens every release,” or
   “acceptance was not met”;
4. `output/staging/2026-07-23*` and
   `output/staging/2026-07-24-operator-walkthrough/`, including findings,
   screenshots, terminal output, browser geometry, and disproved observations;
5. current tests, project membership, coverage data, mutation controls,
   quality-gate policy, clean-install smoke, and release-preflight behavior; and
6. a current reproduction against the smallest real boundary that can
   distinguish the claimed behavior.

Conversation and changelog prose are discovery evidence, not product truth.
When sources conflict, runtime/code evidence wins and the conflict is recorded.
Disproved or stale observations remain in the ledger with that disposition so
they are not repeatedly re-triaged.

## Regression-lineage ledger

Create one durable table under `output/quality/` for the audit working evidence
and summarize its accepted conclusions in this specification. Every candidate
must contain:

- stable ID and behavior family;
- customer-visible symptom and impact;
- first and repeated report references;
- last-known-good version and commit, or explicit `not established`;
- first-known-bad version and regressing commit/range;
- current reproduction and affected state matrix;
- intended contract at that point in history;
- why the current test/gate/acceptance proof did not catch it;
- existing guards and whether they test the real boundary;
- disposition: `confirmed regression`, `acceptance gap`, `intended change`,
  `one-off defect`, `stale observation`, or `disproved`;
- fix/child-goal ownership; and
- protecting test/gate plus deliberate failure proof.

An exact causative commit is required when the history and reproduction support
it. A plausible commit without a behavioral proof is not a finding.

## Required behavior families

The audit must cover these recent high-churn, load-bearing families even when
the final disposition is “no confirmed regression”:

### Provider authentication, readiness, and routing

- Claude Code and Codex detection versus connected/eligible state;
- device account versus Relay-isolated account versus API-key ownership;
- adopt/sign-in/test failures and rollback;
- provider badge, selector, shell-status, routing inventory, and execution
  target agreement;
- local, gateway, subscription, and direct-API economics and ordering; and
- the reported earlier-working isolated Codex adoption path.

### Settings information architecture and responsive behavior

- stable hash navigation after asynchronous sections resolve;
- provider inventory hierarchy and routing as a downstream consumer;
- consistent compact/progressive provider cards without repeated status;
- accessible names, checked state, focus, and keyboard behavior; and
- desktop/tablet/mobile geometry, including usable primary navigation at
  390 px rather than merely “no document overflow.”

### Onboarding and state reconciliation

- free/licensed entitlement changes and customer-facing summaries;
- premium Pack discovery, selection, activation, and first run;
- clearing seeded Agency data and immediate dashboard reconciliation; and
- clean npm install/bootstrap behavior versus stale build/cache artifacts.

### Workflow execution and recovery

- atomic blueprint start and immediate progress;
- waiting approval versus denial/timeout;
- resume eligibility without prefix replay or duplicate task identity;
- run-scoped audit/receipt persistence and navigation; and
- runtime eligibility agreement with Settings readiness.

### npm, OCI, and release qualification

- exact version/SHA/tag/digest agreement;
- candidate versus immutable tag behavior;
- production-artifact and customer-identical install proof;
- supported Node/npm/platform matrix; and
- recurring manual release repairs that should become fail-closed preflight
  controls.

## Required plan before implementation

After the lineage pass and before behavior-changing code, write a codebase-
grounded implementation plan that references this specification and contains:

- the accepted candidate ledger and scope challenge;
- affected code/test/gate surfaces;
- no more than three coherent vertical implementation slices;
- the regression-test budget and exact project/lane for every new test;
- historical red/green or deliberate-fault proof;
- broader runtime, staging, browser, package, and release checks;
- fresh-review scope; and
- rollback/rescue for each slice.

Do not group independent UI taste, runtime architecture, workflow semantics, and
release machinery into one implementation patch merely because the audit found
them together.

## Test and gate strategy

### Claim-to-guard matrix

Create an executable manifest for every completed goal and release claim in the
audit window. Each claim maps to:

- a protecting test or deterministic guard;
- the real boundary it exercises;
- the required Vitest project, smoke, or release lane;
- the state/viewport/platform matrix it covers; and
- the expected semantic receipt.

The audit fails if a customer-observable acceptance claim has no guard, its test
is excluded from the intended project, its assertion cannot distinguish the
bad behavior, or the command can exit successfully without its named receipt.
The manifest must augment the G-065 quality gate rather than create an
independent optional checklist.

### Lowest reliable regression layer

Use:

- pure unit tests for normalization, ordering, eligibility, and state
  transitions;
- component tests for rendered state, action visibility, accessible names, and
  pending/error feedback;
- real SQLite/API integration tests for persistence and mutation boundaries;
- browser-project tests for actual CSS geometry, focus, overflow, disclosure,
  and asynchronous deep-link behavior;
- real runtime graph smoke for registry/agent/workflow module-load and task
  execution seams;
- customer-identical staging for installed auth/readiness/onboarding journeys;
  and
- package/release script tests for artifact, SHA, tag, digest, platform, and
  semantic-receipt contracts.

Avoid full-page snapshots whose approval can preserve a bad layout. Prefer
behavioral invariants and bounded geometry ranges, such as minimum usable
navigation width, visible target after async settlement, one authoritative
provider status, or exact accessible naming.

### Failure proof

For each confirmed regression, prove that the new guard fails against the
regressed behavior before the repair and passes afterward. When checking out
the historical commit is unsafe or incompatible, use a minimal fixture,
temporary deliberate fault, or the existing mutation harness and record why it
faithfully recreates the missing distinction. Never claim protection from a
test that was only observed green.

## Acceptance criteria

- [x] Every repeated/regression candidate found in the fixed audit window has a
      complete lineage row and one named disposition.
- [x] The July 24 BUG-8, FEAT-9, FEAT-10, BUG-11, FEAT-12, and BUG-13 evidence
      is reconciled; the disproved BUG-14 remains excluded from product work.
- [x] Every confirmed regression names its last-known-good and first-known-bad
      commit/version or records a bounded, evidence-backed range and `unknown`
      cause after the rescue rule is met.
- [x] Each missed regression explains why the existing coverage, test,
      browser proof, or quality gate passed.
- [x] The claim-to-guard manifest covers every completed goal and release claim
      from July 21–24 and fails closed for missing, skipped, or
      receipt-less guards.
- [x] The implementation plan is approved where it contains product/taste
      choices; no more than three related root causes are implemented in this
      goal and independent work is groomed into bounded child goals.
- [x] Each implemented regression has red-before/green-after or equivalent
      deliberate-fault evidence at the lowest reliable layer.
- [x] New tests run in the intended node, jsdom, browser, runtime, package, or
      release project and `npm run test:audit` proves there is no silent skip.
- [x] `npm run quality:gate -- --profile pr` and the release profile include
      every newly required lane or manifest check with a positive semantic
      receipt.
- [x] Focused tests, TypeScript, production build, applicable runtime graph,
      clean staging/browser journeys, and package/release checks pass.
- [x] Fresh review approves the lineage, test realism, gate integration,
      residual-risk statement, and rollback.
- [x] Completion evidence reports tests added/changed/removed, affected
      coverage by behavior family, deliberately killed failures, unresolved
      risks, and every follow-on goal. It does not claim “no more regressions.”
- [x] The owning regression-resistance workstream and this goal are removed
      from the canonical backlog only after the exit gate passes.

## Completion evidence

G-142 completed on 2026-07-24 with 18 candidate lineage rows and 28 executable
claim entries covering all 28 completed goal IDs in the fixed audit window,
including G-142's own completion claim. Those entries resolve to 43 guard
anchors and fail closed on missing goals,
duplicate ownership, stale markers, wrong Vitest projects, unknown commands or
lanes, and receipt-less success.

The implementation stayed inside the approved three roots:

1. the always-on PR/release contract now executes the claim checker, its fault
   tests, and the browser project, while release qualification also executes
   portable-Host, knowledge-bundle, exact install-debt, preflight, and Cell
   publication lanes;
2. Settings presents one compact provider inventory (Ollama, LM Studio,
   LiteLLM, Anthropic, and OpenAI) before a separate task-routing surface,
   preserves persistent **Include _runtime_** checkbox names, and routes all
   setup links to the canonical provider anchor; and
3. provider hash landing follows actual target movement for a bounded three
   seconds, stops immediately on user navigation intent, and the primary shell
   navigation retains five accessible tabs and at least 180 px at 390 px.

The suite now contains 549 default Vitest files, two browser-project files,
five E2E files, and 16 Node-test files. The measured run completed 4,018 tests
with one skip; the static audit reports 4,008 direct declarations. All-source
line coverage is 49.39%; component lines improved from 33.39% to 33.99% and
component branches from 31.00% to 31.60%. The database floor was reconciled
from 214/279 to 219/286 after prior workflow/workshop schema growth: absolute
covered lines increased by five, and real-SQLite bootstrap/reset tests protect
the declarative seam.

Deliberate failure proof included the original inverted checkbox assertion,
missing provider-inventory/browser guard files, stale claim markers, a
receipt-less claim lane that exited zero, a body-only resize observer that left
the live hash target 1,664 px below the viewport, and a stale database ratchet.
Each failure was observed before its correction and now has a named semantic
receipt.

Residual risk is explicit: visual density remains partly a product-taste
judgment, historic screenshots cannot isolate one exact commit for every
responsive change, and the full Settings page still contains lower-section
mobile overflow already owned by G-024. G-142 protects the primary navigation
and the audited provider/hash boundary; it does not claim zero future
regressions or close G-024.

## Non-goals

- Achieving or advertising 100% repository-wide line coverage.
- Guaranteeing that no future defect or product disagreement can occur.
- Growing or pruning the suite to hit a test-count target.
- Replacing the existing Vitest, browser, mutation, runtime, staging, or
  release harness without evidence that the current boundary is incapable.
- Redesigning provider IA, Settings, onboarding, workflows, or release
  architecture beyond confirmed objective regressions and the approved
  implementation tranche.
- Auditing all historical Relay releases.
- Publishing, tagging, pushing, cutting a release, or changing live GitHub
  protections.

## Completion and rollback

Completion records the accepted ledger summary, exact guard commands and
receipts, repaired behavior, residual risks, and bounded follow-on goals in
`features/changelog.md`. Remove G-142 and the completed train from
`_IDEAS/backlog.md`; do not leave a second live queue in `features/roadmap.md`.

Rollback is per implementation slice: revert the behavior repair and its
specific guard together, then restore the prior quality-gate manifest only if
the claim itself is also withdrawn. Never retain a customer-facing completion
claim after removing its protecting guard.

## References

- `output/staging/2026-07-23-operator-walkthrough/FINDINGS-live.md`
- `output/staging/2026-07-23-operator-walkthrough/EVALUATION.md`
- `output/staging/2026-07-24-operator-walkthrough/FINDINGS-live.md`
- `features/risk-tiered-quality-gate.md`
- `features/mutation-strength-governance.md`
- `features/critical-api-route-contracts.md`
- `features/e2e-test-automation.md`
- `features/changelog.md`
- `CHANGELOG.md`
