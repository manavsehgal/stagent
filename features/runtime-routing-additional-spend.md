---
title: Runtime Routing by Additional Spend
status: completed
goal: G-140
priority: P0
source: output/staging/2026-07-24-operator-walkthrough/FINDINGS-live.md BUG-5, FEAT-6
dependencies: [smart-runtime-router, explicit-eligible-runtime-pool]
---

# Runtime Routing by Additional Spend

## Goal contract

**Outcome:** The routing objective formerly called `Cost` minimizes the
customer's additional provider spend: healthy capable local and included-plan
runtimes precede metered APIs, while the UI explains base fallback priority,
resulting execution order, exclusions, and unsaved changes.

**Constraints:** Do not invent a token-equivalent value for subscription plans,
treat unknown as free, conceal customer-owned compute, or infer local/private
economics merely from an arbitrary compatible endpoint. Provider pricing and
plan facts are date-stamped and sourced from first-party documentation.

**Executable verification:** Pure routing tests cover local, included-plan,
metered, and unknown classes; stable ties; metered price order; profile and
task-name precedence; fallback behavior; and strict-default behavior.
Component tests cover the renamed objective/mode, causal ordering, evidence
labels, exclusions, and pending-versus-active copy. Browser checks cover wide
and narrow responsive layouts.

**Operator gates:** None for the conservative accounting model. Any hard-coded
subscription-to-API value conversion would require authoritative evidence and
separate product approval.

**Stop/rescue:** If a provider cannot be classified from verified runtime type
and selected auth method, keep it `Unknown economics` after known local,
included-plan, and metered candidates; never guess.

## Accounting model

| Class | Customer-facing evidence | Additional-spend rank |
|---|---|---|
| `local_compute` | `$0 provider charge · uses your compute` | 0 |
| `included_plan` | `Included in plan · usage limits apply` | 0 |
| `metered_api` | dated combined configured-model API price | 1, ordered by price |
| `unknown` | `Economics unknown` | 2 |

Local and included-plan ties preserve the customer's editable eligible-runtime
priority. Health, configuration, profile compatibility, required capabilities,
explicit task runtime, and current plan capacity continue to filter or override
economic ranking before execution.

## Product language

- `Cost` becomes `Additional spend`.
- `Manual` becomes `Strict default`.
- The editable list is `Eligible runtimes and fallback priority`.
- The derived list is `Resulting order for a general task`.
- A dirty preview is labeled `Unsaved preview`; the persisted state is
  `Active policy`.

## Authoritative snapshot — 2026-07-24

- Anthropic documents Claude Code as included in Pro/Max subscriptions, with
  $20, $100, and $200 monthly tiers and workload-dependent usage limits.
- OpenAI documents Codex as included with ChatGPT plans and subject to
  plan/shared agentic usage limits; additional credits may be purchased.
- Ollama documents unlimited local execution on customer hardware while its
  cloud service has separate plan/usage economics.
- LM Studio documents free local inference and a separate pay-as-you-go cloud
  path.

Relay therefore models marginal provider charge and capacity class, not a
fictional cross-provider token exchange rate. The operator-supplied
`$200 ≈ $8,000 API spend` example remains an unverified hypothesis and is not
used.

## Vertical slices

1. Replace the nullable metered-only number with typed economic evidence.
2. Use the same ordering function in the server router and client preview.
3. Recompose routing UI so the base pool causes the derived preview, with
   compact per-runtime annotations.
4. Add date/source metadata and regressions.

## References

- https://support.anthropic.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan
- https://support.anthropic.com/en/articles/11049762-choosing-a-claude-ai-plan
- https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- https://ollama.com/pricing
- https://docs.ollama.com/faq
- https://lmstudio.ai/pricing
- https://www.lmstudio.ai/docs/app/offline

## Verification record — 2026-07-24

- Server routing, suggestion API, execution-target resolution, and the client
  preview now use the same typed additional-spend comparator.
- Browser evidence showed **Additional spend**, **Strict default**,
  **Eligible runtimes and fallback priority**, and a visibly distinct
  resulting general-task order.
- The focused 224-test Settings/auth/runtime set and full 4,010-test regression
  suite passed (one intentional skip), alongside TypeScript and the
  deterministic task/workflow/chat runtime graph.
