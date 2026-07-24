---
title: First-run Feedback and Runtime Guidance
status: completed
priority: P1
milestone: post-mvp
source: output/staging/2026-07-23-operator-walkthrough/FINDINGS-live.md
dependencies:
  - provider-auth-bootstrap-truth
  - runtime-first-value-reliability
---

# First-run Feedback and Runtime Guidance

## Description

The `0.46.3` operator walkthrough found three presentation gaps around an
otherwise functional first run. Blueprint start has a pending label but it is
easy to miss. Workflow targeting says a detected global Codex login is “not
configured” without explaining Relay's deliberate isolated-session boundary.
The two sticky shell rails use different height authorities and can expose a
one-pixel strip of page content.

These are separate bounded goals under one first-run clarity specification.
They do not change runtime eligibility, credential ownership, or workflow
dispatch semantics.

## G-132 — Prominent blueprint Start-run progress

### Outcome

After **Start run**, the side panel immediately shows a persistent,
screen-reader-announced status beneath the action and keeps the variables
visible until the server returns an exact workflow or a named failure.

### Acceptance criteria

- [x] Pending state appears in the panel immediately and remains until response.
- [x] The primary action is protected against duplicate submission.
- [x] Status is announced through an appropriate live region without stealing
      focus.
- [x] Success closes only after an exact workflow ID exists and preserves the
      existing exact-run action.
- [x] Failure keeps the panel and entered variables open with a named recovery.
- [x] Component tests hold the promise open and assert the complete pending
      presentation.

## G-136 — Explain detected-but-unadopted Codex in execution targeting

### Outcome

When Relay detects a machine-level Codex login but has not adopted it into the
isolated Relay store, execution targeting explains that distinction and links
the shortest explicit adoption or sign-in action.

### Constraints

- Never call a global session connected or eligible before explicit adoption.
- Never copy a keyring/file credential automatically.
- Preserve G-129's owner-only isolated copy, no-overwrite, verification, and
  rollback behavior.
- Keyring-only sessions remain non-exportable and use isolated browser sign-in.

### Acceptance criteria

- [x] Skipped-runtime detail distinguishes **detected on this computer** from
      **connected to Relay**.
- [x] Safe file-backed sessions link to explicit adoption in Settings.
- [x] Keyring-only sessions link to isolated ChatGPT sign-in and explain why
      they cannot be imported.
- [x] Successful adoption refreshes the execution target/routing state without
      a manual extra reload.
- [x] Unadopted sessions remain excluded from runtime eligibility tests.

## G-137 — Gap-free stacked shell rail geometry

### Outcome

The telemetry and Settings-at-a-glance rails meet without a transparent seam
or overlap across supported widths, themes, zoom, and representative content.

### Technical approach

- Replace the estimated duplicated rail height with one geometry authority:
  either a shared fixed/tokenized height enforced by both rails or a measured
  CSS variable owned by the rendered telemetry rail.
- Preserve sticky behavior, overflow controls, focus visibility, and responsive
  collapse.
- Avoid masking the gap with an oversized background patch that introduces
  overlap or pointer dead zones.

### Acceptance criteria

- [x] No page pixels show between the two rails at desktop and medium widths.
- [x] The second rail never overlaps telemetry content or focus indicators.
- [x] Light/dark themes and browser-scale geometry use the same measured
      border-box authority instead of a zoom-sensitive estimate.
- [x] Browser geometry regression asserts adjoining bounding boxes within the
      device-pixel tolerance.

## Completion receipt

Accepted locally on 2026-07-23. The Run side panel now retains its inputs and
renders an immediate polite status until an exact workflow identity or inline
failure exists. Execution-target skips carry explicit Codex import or isolated
sign-in actions while keeping detected global sessions ineligible. The
telemetry rail publishes its measured border-box height, and the second sticky
rail consumes that single CSS authority.

Deferred-promise, failure, runtime-setup, execution-preview, ResizeObserver,
token, TypeScript, runtime smoke, and browser checks passed. Browser geometry
measured a zero-pixel gap at 1280×720 and 944×800; because the offset is derived
from the scaled rendered border box, browser zoom no longer introduces a
second estimated value.

## Scope boundaries

Included:

- Pending presentation inside the existing Start-run side panel.
- Copy/action for an already detected Codex adoption opportunity.
- Geometry of the two existing sticky shell rails.

Excluded:

- Automatic Codex credential adoption.
- New provider setup or routing policy.
- Redesign of the shell, telemetry metrics, or blueprint run transaction.
- Hand cursor changes; Relay retains the system cursor policy.

## Verification

- Focused component tests for pending, failure, duplicate submission, and
  adoption-copy states.
- Existing G-129 auth-isolation and runtime-readiness suites.
- Desktop/medium/390px browser inspection in light/dark themes.
- Keyboard and screen-reader semantics for the pending status and setup link.

## References

- `features/provider-auth-bootstrap-truth.md`
- `features/runtime-first-value-reliability.md`
- `src/components/apps/run-now-sheet.tsx`
- `src/components/shell/telemetry-rail.tsx`
- `src/components/shell/glance-rail.tsx`
