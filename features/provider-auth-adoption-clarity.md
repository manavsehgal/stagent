---
title: Provider Auth Adoption Clarity
status: completed
goal: G-139
priority: P0
source: output/staging/2026-07-24-operator-walkthrough/FINDINGS-live.md BUG-1, BUG-2, BUG-3, FEAT-4
dependencies: [provider-auth-bootstrap-truth, codex-auth-session-isolation]
---

# Provider Auth Adoption Clarity

## Goal contract

**Outcome:** Provider setup distinguishes an active credential from a detected
credential and from a separately configured Direct API. A customer with a
usable device Codex sign-in can adopt it into Relay's isolated store through
one explicit action, with a named failure when verification cannot complete.

**Constraints:** The global Codex credential remains read-only; Relay never
shares the live global home, exports keychain credentials, or copies merely on
detection. Anthropic and OpenAI Direct API keys remain independent from
subscription-backed runtimes. No token, email, or account identifier enters an
error response or log.

**Executable verification:** Auth-state unit matrices cover direct-only,
detected-but-unadopted, adopted, keyring-only, dual-mode, and named adoption
failures. Provider component tests protect selection, credential-boundary
labels, progressive actions, and API-key source placement. A real development
Settings smoke confirms the rendered states.

**Operator gates:** None for local implementation. A new credential-sharing
boundary, public claim, or external write would require a separate gate.

**Stop/rescue:** If current Codex App Server rejects a structurally usable
copied file after two distinct repairs, retain the safe rollback, surface the
privacy-safe failure class, and keep isolated browser sign-in as the supported
path rather than weakening file ownership or isolation checks.

## State contract

- An API key is selected when it is the only active OpenAI credential.
- A machine Codex session is `Detected — activation required`, not selected or
  connected.
- `Use existing Codex sign-in` performs consent, safe copy, verification,
  method selection, and readiness refresh as one operation.
- A successful adoption selects ChatGPT and renders `Connected via ChatGPT`.
- Browser sign-in is secondary while a file-backed session is adoptable, then
  becomes `Sign in with another ChatGPT account` on request or adoption
  failure.
- Every provider method names its boundary as `This device's account`, `This
  Relay's isolated account`, or `API key`.
- The Anthropic environment-key message lives inside the API-key/Direct API
  area and reads: `Anthropic Direct API will use the key from
  ANTHROPIC_API_KEY.`

## Failure taxonomy

- `CodexAdoptionCredentialRejectedError`: copied credentials were read but the
  App Server rejected or could not refresh them.
- `CodexAdoptionAppServerUnavailableError`: no healthy executable or the App
  Server exited before verification.
- `CodexAdoptionAccountMismatchError`: App Server returned an auth/account mode
  that is not a ChatGPT-backed subscription.
- Existing ownership, permission, mutation-race, malformed-file, and
  destination-conflict errors remain specific and fail closed.

## Vertical slices

1. Correct default OpenAI method selection and provider status semantics.
2. Consolidate detected-session adoption into the ChatGPT choice and simplify
   the alternate sign-in path.
3. Preserve the underlying App Server failure class through the adoption API.
4. Compact the Anthropic/OpenAI provider rows around one status and
   mode-specific controls.
5. Add focused regressions and real Settings browser evidence.

## Regression budget

- `openai-auth`, `codex-session-adoption`, and OpenAI Codex auth tests.
- Provider Settings component tests for both providers and all mixed states.
- Provider API route tests and TypeScript.
- Real Next.js Settings smoke because the path launches the Codex App Server.

## Verification record — 2026-07-24

- The live clean-data-dir adoption changed from a generic HTTP 400 to a
  successful isolated ChatGPT adoption. Relay selected ChatGPT, rendered
  **Connected via ChatGPT**, and verified OpenAI Codex App Server healthy.
- Root cause was a forced OAuth rotation on routine `account/read` calls.
  Relay now follows Codex's documented normal account-read path and leaves
  token refresh ownership to Codex App Server.
- Failed verification still removes only Relay's isolated copy, preserves the
  global device credential, and leaves API-key mode selected.
- The focused 224-test Settings/auth/runtime set and full 4,010-test regression
  suite passed (one intentional skip), alongside TypeScript, production build,
  the deterministic real-task runtime graph, and 1440/1024/768/390 px browser
  checks.
