---
title: Mobile Settings overflow containment
status: completed
goal: G-024
priority: P1
date: 2026-07-24
source: output/quality/g142-regression-lineage.md
dependencies:
  - recent-regression-lineage-and-guard-hardening
---

# Mobile Settings overflow containment (G-024)

## Outcome

Every Settings section remains readable and operable inside a 390 px viewport
without widening the document or hiding essential controls. Desktop keeps its
existing dense composition.

## Verified red state

On the post-G-142 source build at 390 px:

- `.settings-density` measures 315 px wide with a 515 px scroll width;
- the full document measures 390 px wide with a 553 px scroll width;
- `#settings-channels` is the largest current offender at 515 px because each
  configured channel forces identity, switches, status and actions into one
  unbreakable row and renders the inbound URL as an unconstrained inline code
  run; and
- `#settings-providers` reaches 357 px because the single-column provider grid
  permits min-content sizing wider than its card content area.

Current Access, instance, license, Host, Chat, Runtime, learning, web-search,
environment, authoring, dashboard, browser-tools, GitHub, budget, permission,
snapshot/recovery and data-management fixtures remain within 315 px. They are
still part of the page-level regression scan so later state-dependent overflow
cannot silently return.

## Required behavior

- Settings anchors and grids permit descendants to shrink through a complete
  `min-width: 0` chain.
- Compact provider cards use an explicit `minmax(0, 1fr)` mobile column and
  remain contained both collapsed and expanded.
- Delivery-channel identity, controls and actions reflow into deliberate
  mobile rows while retaining every control, accessible label and status.
- Long inbound URLs scroll or wrap inside their own bounded field rather than
  widening the Settings page.
- Empty and populated channel states, provider collapsed/expanded states and
  the complete Settings page remain within their owning containers at 390 px.
- Desktop composition, actions and information remain unchanged.

## Acceptance criteria

- [x] The live 390 px document, main, `.settings-density`, provider anchor and
      channels anchor satisfy `scrollWidth <= clientWidth`.
- [x] Every other Settings anchor also satisfies the same invariant in the
      clean-data fixture.
- [x] All provider rows remain visible and each selected local/frontier
      provider can expand without page overflow.
- [x] Configured Slack, Telegram and webhook rows preserve name, type,
      direction/active controls, test status, Test and Delete actions.
- [x] Bidirectional inbound URLs remain selectable and readable in a bounded
      local scroller without widening the document.
- [x] Empty channel state and Add Channel remain usable at 390 px.
- [x] Real-browser regression tests distinguish the documented page-level and
      isolated-component red states from the repaired geometry.
- [x] Desktop browser verification confirms no density or action regression.
- [x] TypeScript, design-token validation, production build and the applicable
      PR quality profile pass.

## Regression test budget

- Add a real-browser Settings mobile-geometry test with populated delivery
  channels and compact provider cards.
- Assert semantic control presence in addition to geometry so containment
  cannot be achieved by clipping or hiding controls.
- Retain live full-page browser measurements because isolated component tests
  do not prove the complete flex/grid shrink chain.
- No runtime-registry source changes are planned; the runtime-graph smoke stays
  in the always-on quality gate and provides broader confidence.

## Non-goals

- Redesigning Settings information architecture or provider authentication.
- Hiding controls, truncating statuses without an accessible full value, or
  applying blanket page-level `overflow-hidden`.
- Changing channel persistence, transport, authentication or test behavior.
- Reopening completed G-139–G-142 acceptance decisions.

## Rescue and rollback

If a row cannot remain both complete and contained, prefer a deliberate
stacked mobile layout or a local overflow region. Do not mask document overflow.
The provider and channel repairs are independently revertible with their
protecting assertions.

## Completion receipt

- At 390 px the document, main, Settings density wrapper and all 19 Settings
  anchors measure `scrollWidth === clientWidth`; the provider and channels
  anchors are each 315/315 px.
- Ollama, LM Studio, LiteLLM, Anthropic and OpenAI were expanded in the live
  page one after another without widening either the provider anchor or
  document.
- The populated/empty channel and provider collapsed/expanded browser
  regression passed three tests. Its deliberate red fixture measured 607/315
  px for populated channels and 385/315 px for provider cards.
- At 1440 px the provider grid retained two 627 px columns, every populated
  channel row remained contained, and the document stayed 1440/1440 px.
- Fresh two-pass review found no blocking or informational finding after the
  inbound URL became keyboard-focusable and all three local-provider expanded
  states joined the browser guard.
- The final PR quality profile passed all 21 planned lanes, including 4,021
  regressions plus one intentional skip, ten browser tests, runtime graph,
  mutation strength, package compatibility and design-token validation.
- The completion verification is recorded in `features/changelog.md`.

## References

- `_IDEAS/backlog.md` — G-024 Goal Contract
- `features/recent-regression-lineage-and-guard-hardening.md`
- `output/quality/g142-regression-lineage.md`
- `output/staging/2026-07-24-operator-walkthrough/FINDINGS-live.md`
