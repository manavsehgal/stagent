# G-142 implementation plan — recent regression lineage and release guards

Authoritative specification:
`features/recent-regression-lineage-and-guard-hardening.md`
Evidence ledger: `output/quality/g142-regression-lineage.md`
Plan date: 2026-07-24

## Scope challenge

### REDUCE scope

Audit and fix only the six findings from the July 24 Settings walkthrough. This
would produce faster visible repairs but would leave the repeated release,
onboarding, provider-auth, and workflow claims without a durable claim-to-guard
contract.

### PROCEED as specified

Keep the fixed July 21–24 lineage audit, reuse the existing quality harness,
and implement three coherent roots: claim integrity, provider journey, and
post-load/responsive navigation. This is the selected path; the operator's
instruction to complete the already-groomed G-142 confirms it.

### EXPAND scope

Audit all Relay history, migrate the complete suite, introduce screenshot
baselines, and redesign every Settings section. This would mix unrelated
product work with regression control and exceed the three-root rescue limit.

## What already exists

- G-065 provides the executable `quality:gate`, all-source coverage ratchets,
  project-membership guard, semantic lane receipts, and PR/release profiles.
- G-068 provides deliberate mutation/fault proof and restoration semantics.
- G-070 provides real-SQLite/API boundary precedent.
- `scripts/test-audit.mjs` inventories tests, topology, coverage, and workflow
  references.
- Vitest already has node, jsdom, and Playwright browser projects. The browser
  project imports compiled `globals.css`, but currently has one test file.
- Provider-specific local setup already shares `ProviderSetupCard`; Anthropic
  and OpenAI already share `ProviderRow`; routing already has a standalone
  `RuntimeRoutingControl`.
- `SettingsHashFocus` already owns hash targeting, but uses only four fixed
  timers.
- AppBar navigation already preserves four stable top-level groups and
  horizontal overflow.
- Existing component tests protect provider auth/adoption, routing economics,
  provider setup ordering, workflow supervision, entitlement reconciliation,
  sample-data removal, shell readiness, and release preflight.

The plan extends these boundaries. It does not replace Vitest, create a second
quality runner, add a visual-regression service, or introduce a dependency.

## Specification and acceptance mapping

| Specification acceptance | Implementation slice | Protecting evidence |
|---|---|---|
| Complete candidate ledger and dispositions | Evidence pass (already written) | `output/quality/g142-regression-lineage.md`, git receipts, diff review |
| BUG-8/FEAT-9/FEAT-10/BUG-11/FEAT-12/BUG-13 reconciled; BUG-14 excluded | Slices 2–3 | component + observer + browser geometry tests |
| Every confirmed regression explains missed guard | Evidence pass + feature completion summary | lineage table and fresh review |
| Claim-to-guard coverage for every completed July 21–24 goal | Slice 1 | manifest checker and deliberate malformed fixtures |
| No more than three related implementation roots | This plan | three slices below; all other findings retain closed/stale dispositions |
| Red-before/green-after or deliberate fault proof | All slices | failing pre-fix targeted assertions; checker fault fixtures; browser geometry |
| Correct test project and no silent skip | Slices 1–3 | `test:projects`, updated `test:audit`, quality lane receipt |
| PR/release quality profiles include new contract | Slice 1 | quality-policy tests and release dry plan |
| Focused/static/runtime/staging/browser/package proof | Verification sequence | exact commands below |
| Residual risk and follow-on ownership | Completion pass | feature/changelog/backlog receipt |

## Slice 1 — executable acceptance-to-guard integrity

### Files

- Add `scripts/regression-claim-manifest.mjs`.
- Add `scripts/check-regression-claims.mjs`.
- Add `scripts/check-regression-claims.test.mjs`.
- Update `package.json`.
- Update `scripts/quality-policy.mjs`.
- Update `scripts/quality-gate.mjs` and
  `scripts/quality-gate.test.mjs`.
- Update `scripts/test-audit.mjs`.

### Implementation

1. Parse only `### Completed` goal annotations from feature changelog sections
   dated July 21–24, expanding ranges such as G-132–G-138.
2. Keep one reviewed manifest that covers every discovered goal ID and maps it
   to a behavior family, claim, real boundary, guard file, exact assertion
   marker, test project/lane, command, and failure-proof mode.
3. Fail on a missing/duplicate/extra goal, missing guard, stale assertion
   marker, unknown package script, project mismatch, missing failure proof, or
   unsupported boundary.
4. Emit one positive semantic receipt:
   `[regression-claims] OK goals=<n> claims=<n> guards=<n>`.
5. Add `regression-claims` as an always-on G-065 lane and validate its receipt.
   Because changes to the manifest/checker alter the quality contract, retain
   their existing harness-safety path mapping.
6. Advance the test-audit schema and require the manifest/checker/script/lane
   topology. Do not parse prose claims at runtime beyond the fixed changelog
   goal inventory; the reviewed manifest owns the semantic mapping.

### Checkpoint

`npm run test:regression-claims`, `npm run check:regression-claims`,
`npm run test:quality-gate`, `npm run test:audit -- --json`, and a release
quality dry plan all pass. Fault fixtures prove each fail-closed condition.

## Slice 2 — one provider inventory, then task routing

### Files

- Update `src/app/settings/page.tsx`.
- Update `src/components/settings/providers-runtimes-section.tsx`.
- Update `src/components/settings/provider-setup-card.tsx`.
- Update `src/components/settings/runtime-routing-control.tsx`.
- Update affected Settings component tests.
- Update stale `#settings-providers-runtimes` links and their tests to the
  canonical provider anchor.

### Implementation

1. Make `ProvidersAndRuntimesSection` the page-level AI configuration surface.
   Render one **Connect AI providers** heading followed by a responsive,
   customer-recognizable inventory: Ollama, LM Studio, LiteLLM, Anthropic, and
   OpenAI. Remove the separate **OpenAI-compatible servers** implementation
   category from the Settings page.
2. Reuse `ProviderSetupCard` for the three endpoint-backed providers and the
   shared `ProviderRow` for Anthropic/OpenAI. Give all five the same compact
   collapsed hierarchy: provider, authoritative status, one-line endpoint/
   next-action summary, and disclosure icon.
3. Add controlled expansion to `ProviderSetupCard` so the parent permits one
   expanded provider at a time. Loading failures can request expansion; no
   failure becomes invisible.
4. Render **Task routing** as a separate sibling card/anchor after the complete
   provider inventory. It consumes the ready-runtime set and no longer appears
   inside an Anthropic/OpenAI card.
5. When OpenAI has an adoptable/detected device session but no active ChatGPT
   connection, render **Activate ChatGPT or add an API key** in the collapsed
   authoritative summary.
6. Give each runtime-pool checkbox the persistent accessible name
   **Include `<runtime>`**. Checked state communicates inclusion; do not encode
   an inverse click action in the name.
7. Keep provider credentials, readiness semantics, save/test/discover behavior,
   routing writes, and system cursor policy unchanged.

### Checkpoint

Settings component tests prove all five providers belong to one inventory,
routing follows the inventory as a separate labeled section, only one provider
is expanded, mixed OpenAI summary agrees with its activation action, and the
runtime checkbox name/state is unambiguous.

## Slice 3 — resilient Settings targets and usable mobile primary navigation

### Files

- Update `src/components/settings/settings-hash-focus.tsx`.
- Add its jsdom regression test.
- Update `src/components/shell/app-bar.tsx`.
- Add a jsdom semantics test if needed and a Playwright browser-project
  geometry test.

### Implementation

1. Replace timer-only hash focus with a bounded post-load stabilizer:
   initial scroll/focus, `ResizeObserver` re-scroll during layout growth, and a
   hard deadline.
2. Cancel stabilization immediately after real user wheel, touch, pointer, or
   navigation-key interaction so Relay never fights operator intent.
3. Resolve the historical `settings-providers-runtimes` fragment to the
   canonical provider target, while updating current links to the canonical
   fragment.
4. Below the `sm` breakpoint, keep top-level navigation labels available to
   assistive technology but render compact icon tabs. Add explicit accessible
   labels and preserve visible text from `sm` upward.
5. In a real Chromium browser project at 390 px, render the AppBar and require
   the Primary tablist to retain a practical minimum width, every tab to remain
   reachable, and no label/accessibility loss. Do not use a full-page snapshot.

### Checkpoint

Observer tests prove late layout growth recenters the target, user interaction
stops further movement, and the old fragment resolves. Browser tests prove the
390 px primary navigation no longer collapses to the observed ~17 px sliver.

## Regression test budget

| Changed behavior | Existing guard | New/changed guard | Negative/edge cases |
|---|---|---|---|
| Completed claims have real guards | G-065 lane topology | Node checker + manifest + quality lane | missing goal, duplicate, stale marker, missing file, wrong project, unknown command, no failure proof |
| Provider inventory hierarchy | frontier-only order assertion | page-level component hierarchy test | loading/error provider remains visible; routing separate |
| Provider disclosure density | independent compact cards | controlled one-open-at-a-time test | switching provider closes prior; load error requests visibility |
| OpenAI mixed-state summary | detailed adoption action test | collapsed summary/action agreement | detected not adoptable; direct API active; no auth |
| Runtime checkbox semantics | old **Exclude** assertion | **Include** + checked/unchecked state | toggling persists exclusion; label remains stable |
| Settings deep link | none | observer/user-intent jsdom test | alias, missing target, user wheel/key, deadline/cleanup |
| Mobile primary nav | manual zero-overflow screenshot | browser-project geometry/accessibility test | 390 px and 1280 px; all four tabs reachable |

Test count is not a target. New tests exist only where they distinguish a
previously accepted bad state.

## Verification order and exact commands

1. `npm run test:regression-claims`
2. `npm run check:regression-claims`
3. `npx vitest run --project jsdom` with the changed Settings/shell test files
4. `npm run test:browser`
5. `npm run test:projects`
6. `npm run test:quality-gate`
7. `npm run test:audit -- --json`
8. `npm run quality:gate -- --profile pr --changed-file <each changed path>`
9. `npm run quality:gate -- --profile release`
10. `npx tsc --noEmit`
11. `npm run build`
12. `npm run test:runtime-graph`
13. Start `PORT=3010 npm run dev` with an isolated `RELAY_DATA_DIR`, navigate to
    `/settings#settings-providers`, verify provider inventory/routing/deep-link
    and run one real task through the already-configured deterministic runtime;
    confirm no module-load or missing-tools error, record task ID/runtime, then
    stop the server.
14. Run a clean browser walkthrough at desktop and 390 px and save artifacts
    under `output/quality/g142/`.

The runtime smoke is mandatory because the affected Settings provider API
traverses runtime catalog/readiness code and the release profile already treats
that graph as load-bearing, even though this plan does not intend to edit a
runtime adapter.

## Error & Rescue Registry

| Failure mode | Named evidence | Recovery |
|---|---|---|
| Changelog parser misses/over-collects a goal | checker prints exact missing/extra IDs | restrict parsing to dated Completed bullet headers; do not weaken equality |
| Manifest becomes a ceremonial checklist | stale assertion/fault fixture still passes | require exact marker, classified project, runnable command, and deliberate malformed-fixture tests |
| Provider consolidation duplicates fetches or status | network/component regression | keep one provider payload owner and reuse endpoint cards; do not create a second readiness store |
| Controlled local card hides load failure | error test cannot find failed card | request parent expansion on failure and preserve named error |
| Hash stabilizer fights user scroll | user-interaction test observes another scroll | cancel observer/timers on first trusted navigation input |
| `ResizeObserver` unavailable | jsdom/older runtime branch | perform initial target focus and bounded timer fallback; no silent error |
| Mobile compact tabs lose names | browser accessibility query fails | explicit `aria-label`; hide only the visible span |
| Browser geometry is environment-sensitive | width guard flakes | assert a generous minimum that distinguishes 17 px collapse, not exact pixels |
| Module-load cycle via chat-tools import | real task fails with initialization `ReferenceError` | stop, replace any static chat-tools edge with function-scoped dynamic `await import()`, rerun real task |
| Full release profile exceeds 12-minute budget | named budget failure receipt | report timings; do not drop lanes or shard/add service without operator gate |

## NOT in scope

- A global promise of zero defects or 100% all-source coverage.
- Historical audit before July 21 except last-known-good evidence.
- New visual-regression/SaaS infrastructure or dependencies.
- Redesigning every Settings section; G-142 repairs the provider/routing
  acceptance and navigation regressions only.
- Changing provider authentication, credential isolation, billing, routing
  policy, workflow semantics, or release architecture.
- Pruning tests or optimizing suite duration.
- Live provider credentials, paid cloud resources, customer data, release tags,
  pushes, publishes, or public claims.

## Rollback

Each slice is independently revertible. If the claim manifest must be rolled
back, withdraw its completion/release-confidence claim at the same time. If the
provider consolidation is reverted, retain summary and accessibility fixes
where compatible. If the observer or mobile treatment regresses another shell
path, revert only that slice while keeping the fail-closed claim lane and
recording the residual finding.
