export const REGRESSION_CLAIM_WINDOW = {
  start: "2026-07-21",
  end: "2026-07-24",
};

export const REGRESSION_CLAIMS = [
  {
    id: "portable-host-direction",
    goals: ["G-107"],
    family: "host-portability",
    claim: "Relay selected a provider-neutral compatible-Linux-VM playbook before named-provider branches.",
    boundary: "document",
    guards: [
      {
        path: "features/cross-cloud-relay-host-portability.md",
        project: "document",
        marker: "provider-neutral compatible-Linux-VM playbook",
      },
    ],
    command: "test:doc-links",
    lane: "doc-link-tests",
    failureProof: {
      mode: "source-reconciliation",
      evidence: "Dated official-source matrix and TDR decision fail closed on unsupported provider claims.",
    },
  },
  {
    id: "portable-host-playbook",
    goals: ["G-108"],
    family: "host-portability",
    claim: "The npm playbook pins same-version public inputs and rejects secret-bearing or incomplete bootstrap inputs.",
    boundary: "node-test",
    guards: [
      {
        path: "scripts/relay-host-linux-vm.test.mjs",
        project: "node-test",
        marker: "cloud-init input refuses secret-like values",
      },
    ],
    command: "test:portable-host",
    lane: "portable-host-tests",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Secret-like, checksum, manifest, render-token, and bootstrap-receipt fixtures are rejected.",
    },
  },
  {
    id: "npm-versioned-build-integrity",
    goals: ["G-114"],
    family: "npm-install",
    claim: "A returning npx install cannot reuse stale production bytes from another Relay version.",
    boundary: "node",
    guards: [
      {
        path: "src/lib/desktop/__tests__/prebuilt-download.test.ts",
        project: "node",
        marker: "promotes N+1 over N in one effective npx root",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Mismatched version/build/checksum and poisoned-cache fixtures fail before promotion.",
    },
  },
  {
    id: "entitlement-aware-orientation",
    goals: ["G-116"],
    family: "onboarding-entitlement",
    claim: "Community, Packs, Host, combined, lapsed, invalid, and read-error customers receive distinct truthful orientation.",
    boundary: "node",
    guards: [
      {
        path: "src/lib/onboarding/__tests__/orientation.test.ts",
        project: "node",
        marker: "summarizes combined entitlements without treating them as one generic license",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Invalid signatures, missing Packs, registry failure, lapse, and Host-authority absence remain distinct.",
    },
  },
  {
    id: "premium-pack-one-offer",
    goals: ["G-117"],
    family: "onboarding-packs",
    claim: "One catalog offer selects and activates premium Packs with overlap-safe retry rather than per-Pack purchases.",
    boundary: "jsdom",
    guards: [
      {
        path: "src/components/packs/__tests__/premium-pack-selector.test.tsx",
        project: "jsdom",
        marker: "keeps only failed installs selected and retries without replaying successes",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Bundle overlap, partial failure, double click, stale entitlement, and unavailable offer are exercised.",
    },
  },
  {
    id: "agency-sample-provenance",
    goals: ["G-118"],
    family: "onboarding-data",
    claim: "Agency sample data is disclosed and removable without deleting edited or customer-created records.",
    boundary: "node",
    guards: [
      {
        path: "src/lib/packs/__tests__/sample-data.test.ts",
        project: "node",
        marker: "keeps current-month samples meaningful across year boundaries",
      },
      {
        path: "src/app/api/apps/[id]/sample-data/__tests__/route.test.ts",
        project: "node",
        marker: "expires the app runtime snapshot after deleting untouched samples",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Edited/customer-created rows and referenced customers survive deletion and retry.",
    },
  },
  {
    id: "provider-readiness-truth",
    goals: ["G-119"],
    family: "provider-readiness",
    claim: "Saved setup is not Connected until verified, and auth/network/model/response failures remain distinct.",
    boundary: "node",
    guards: [
      {
        path: "src/lib/settings/__tests__/runtime-readiness.test.ts",
        project: "node",
        marker: "does not equate a saved credential with a verified connection",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Rejected auth, network outage, missing generation model, and malformed response fixtures are distinct.",
    },
  },
  {
    id: "provider-first-settings",
    goals: ["G-120"],
    family: "provider-settings",
    claim: "Provider setup precedes routing and provider changes refresh the shared readiness inventory.",
    boundary: "jsdom",
    guards: [
      {
        path: "src/components/settings/__tests__/providers-runtimes-section.test.tsx",
        project: "jsdom",
        marker: "puts provider setup before task routing in keyboard and reading order",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "red-green",
      evidence: "Semantic document-order assertion fails when routing is rendered before provider setup.",
    },
  },
  {
    id: "cross-runtime-workflow-context",
    goals: ["G-124"],
    family: "workflow-runtime",
    claim: "Workflow profile context follows the selected compatible runtime and preserves machine-readable failure classes.",
    boundary: "runtime-smoke",
    guards: [
      {
        path: "src/lib/workflows/__tests__/runtime-recovery.test.ts",
        project: "node",
        marker: "Provider unavailable",
      },
      {
        path: "scripts/runtime-module-graph-smoke.mjs",
        project: "script",
        marker: "taskLogs",
      },
    ],
    command: "test:runtime-graph",
    lane: "runtime-graph",
    failureProof: {
      mode: "real-runtime",
      evidence: "Deterministic real task/workflow execution must emit a completed runtime receipt.",
    },
  },
  {
    id: "customer-identical-onboarding",
    goals: ["G-025"],
    family: "customer-staging",
    claim: "The isolated npx journey preserves data boundaries across Community, license, Pack, workflow, recovery, restart, and removal.",
    boundary: "staging",
    guards: [
      {
        path: "scripts/staging-environment.test.mjs",
        project: "node-test",
        marker: "staging binds app and Host state inside one disposable root",
      },
      {
        path: "output/staging/2026-07-23/README.md",
        project: "staging-receipt",
        marker: "customer-identical",
      },
    ],
    command: "test:regression-claims",
    lane: "regression-claims",
    failureProof: {
      mode: "customer-staging",
      evidence: "Disposable-root guard plus dated browser/CLI/server bundle distinguish default-data or state leakage.",
    },
  },
  {
    id: "workflow-receipt-reconciliation",
    goals: ["G-125"],
    family: "workflow-receipts",
    claim: "A successful exact-step retry updates the same Operations Receipt instead of retaining a false failed verdict.",
    boundary: "sqlite",
    guards: [
      {
        path: "src/lib/operations/__tests__/receipts.integration.test.ts",
        project: "node",
        marker: "refreshes a same-run receipt after a failed source is retried successfully",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "fault-fixture",
      evidence: "One real-SQLite run contains both failed and successful attempts for the same receipt identity.",
    },
  },
  {
    id: "license-mutation-reconciliation",
    goals: ["G-126"],
    family: "onboarding-entitlement",
    claim: "A slower pre-mutation response cannot restore stale entitlement state after activation or removal.",
    boundary: "jsdom",
    guards: [
      {
        path: "src/components/shell/__tests__/use-settings-glance.test.tsx",
        project: "jsdom",
        marker: "ignores a pre-mutation response that resolves after the refresh",
      },
      {
        path: "src/components/shell/__tests__/use-instance-identity.test.tsx",
        project: "jsdom",
        marker: "ignores an older identity response after a mutation refresh",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Deferred old response resolves after mutation and must be ignored by both consumers.",
    },
  },
  {
    id: "packed-knowledge-root",
    goals: ["G-127"],
    family: "knowledge-bundle",
    claim: "Grounded help resolves from the installed versioned runtime root and rejects stale, tampered, malformed, or oversized bundles.",
    boundary: "node",
    guards: [
      {
        path: "src/lib/knowledge/__tests__/chat-retrieval.test.ts",
        project: "node",
        marker: "uses the installed Relay runtime root when the launch workspace has no version",
      },
    ],
    command: "test:knowledge",
    lane: "knowledge-tests",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Missing, stale-version, tampered-index, schema, source-family, and size fixtures fail closed.",
    },
  },
  {
    id: "provider-neutral-shell-status",
    goals: ["G-128"],
    family: "provider-readiness",
    claim: "Shell readiness names a healthy local runtime and never falls back to generic API Disconnected language.",
    boundary: "jsdom",
    guards: [
      {
        path: "src/components/shell/__tests__/runtime-readiness-status.test.tsx",
        project: "jsdom",
        marker: "shows a named healthy local runtime and links to provider settings",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "red-green",
      evidence: "Ollama-only healthy fixture rejects generic API Connected/Disconnected copy.",
    },
  },
  {
    id: "provider-cli-auth-truth",
    goals: ["G-129"],
    family: "provider-auth",
    claim: "Relay uses documented CLI auth status, skips broken shims, and never equates detected global Codex state with Relay connection.",
    boundary: "node",
    guards: [
      {
        path: "src/lib/utils/__tests__/provider-cli-discovery.test.ts",
        project: "node",
        marker: "skips a broken first Codex candidate and selects a healthy official binary",
      },
      {
        path: "src/lib/settings/__tests__/runtime-setup.test.ts",
        project: "node",
        marker: "keeps detected but unadopted global Codex auth out of configured runtimes",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Broken PATH shim, keyring-only state, malformed file, logout, and unavailable CLI remain distinct.",
    },
  },
  {
    id: "sample-dashboard-cache-reconciliation",
    goals: ["G-130"],
    family: "onboarding-data",
    claim: "Removing untouched Agency sample data invalidates the app model before refresh so dashboard KPIs clear immediately.",
    boundary: "node",
    guards: [
      {
        path: "src/app/api/apps/[id]/sample-data/__tests__/route.test.ts",
        project: "node",
        marker: "does not report success when cache invalidation fails",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "red-green",
      evidence: "The mutation response must call the cache invalidator before returning success.",
    },
  },
  {
    id: "exact-sha-release-train",
    goals: ["G-131"],
    family: "release",
    claim: "Cell and Host candidates require fresh exact-SHA receipts and refuse immutable tag reuse or stale evidence.",
    boundary: "node-test",
    guards: [
      {
        path: "scripts/release-preflight.test.mjs",
        project: "node-test",
        marker: "refuses an already-created immutable tag",
      },
      {
        path: "scripts/quality-gate.test.mjs",
        project: "node-test",
        marker: "release plans run every conditional and release-only lane",
      },
    ],
    command: "test:release-preflight",
    lane: "release-preflight-tests",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Dirty, stale, mismatched SHA/tree/version/scope/policy and existing-tag fixtures fail closed.",
    },
  },
  {
    id: "blueprint-start-progress",
    goals: ["G-132"],
    family: "workflow-supervision",
    claim: "Blueprint Start keeps entered values and a prominent live pending status while the request is unresolved.",
    boundary: "jsdom",
    guards: [
      {
        path: "src/components/apps/__tests__/run-now-sheet.test.tsx",
        project: "jsdom",
        marker: "keeps a prominent live pending status visible while the start request is unresolved",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "deferred-promise",
      evidence: "A deliberately unresolved start request keeps the in-panel live state visible.",
    },
  },
  {
    id: "approval-remains-pending",
    goals: ["G-133"],
    family: "workflow-supervision",
    claim: "Silence never becomes an approval denial; only explicit allow or deny changes the workflow.",
    boundary: "sqlite",
    guards: [
      {
        path: "src/lib/workflows/__tests__/recovery-contract.test.ts",
        project: "node",
        marker: "keeps checkpoint approval pending until an explicit allow and resumes once",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Process re-entry with no decision remains waiting; explicit denial and allow take separate paths.",
    },
  },
  {
    id: "workflow-safe-suffix-resume",
    goals: ["G-134"],
    family: "workflow-recovery",
    claim: "Only trusted replay-safe blueprint steps can resume an exact failed suffix without prefix replay.",
    boundary: "sqlite",
    guards: [
      {
        path: "src/lib/workflows/__tests__/recovery-contract.test.ts",
        project: "node",
        marker: "resumes an eligible failed sequence suffix without replaying the completed prefix",
      },
      {
        path: "src/lib/workflows/blueprints/__tests__/replay-safety.test.ts",
        project: "node",
        marker: "carries an explicit replay-safe assertion into the workflow step",
      },
    ],
    command: "test:runtime-graph",
    lane: "runtime-graph",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Non-replay-safe/chat-created definitions are refused and completed prefix task identity remains singular.",
    },
  },
  {
    id: "workflow-run-audit",
    goals: ["G-135"],
    family: "workflow-audit",
    claim: "Workflow details preserve bounded per-run tasks, decisions, events, outputs, partial-history disclosure, and receipt diagnostics.",
    boundary: "jsdom",
    guards: [
      {
        path: "src/components/workflows/__tests__/workflow-run-history.test.tsx",
        project: "jsdom",
        marker: "renders exact-run tasks, decisions, events, and outputs",
      },
      {
        path: "src/lib/workflows/__tests__/run-audit.test.ts",
        project: "node",
        marker: "omissions",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Run identity, bounded history, missing rows, and partial retention are rendered explicitly.",
    },
  },
  {
    id: "detected-codex-guidance",
    goals: ["G-136"],
    family: "provider-auth",
    claim: "Execution targeting explains detected-but-unadopted Codex without treating it as eligible.",
    boundary: "jsdom",
    guards: [
      {
        path: "src/components/shared/__tests__/execution-target-preview.test.tsx",
        project: "jsdom",
        marker: "Codex is signed in on this computer",
      },
      {
        path: "src/lib/agents/runtime/__tests__/execution-target-preview.test.ts",
        project: "node",
        marker: "Import Codex session in Settings",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Detected global auth yields an activation action while remaining outside the eligible pool.",
    },
  },
  {
    id: "measured-shell-rail-geometry",
    goals: ["G-137"],
    family: "shell-layout",
    claim: "Telemetry publishes measured border-box height so the Settings/glance rail begins without a visible seam.",
    boundary: "jsdom",
    guards: [
      {
        path: "src/components/shell/__tests__/telemetry-rail.test.tsx",
        project: "jsdom",
        marker: "publishes its rendered border-box height as the next rail's authority",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "geometry-fixture",
      evidence: "Mocked ResizeObserver border-box changes update the shared chrome-height authority.",
    },
  },
  {
    id: "sqlite-native-upgrade",
    goals: ["G-138"],
    family: "npm-install",
    claim: "Node 22+ installs and boots better-sqlite3 13 without the retired prebuild-install dependency.",
    boundary: "sqlite",
    guards: [
      {
        path: "src/lib/db/__tests__/bootstrap.test.ts",
        project: "node",
        marker: "bootstraps Operations Receipt storage and success-criteria columns idempotently",
      },
      {
        path: "config/install-dependency-debt.json",
        project: "config",
        marker: "\"disposition\"",
      },
    ],
    command: "check:install-debt",
    lane: "install-debt",
    failureProof: {
      mode: "fresh-install",
      evidence: "Supported Node/npm matrix performs an actual SQLite query and exact dependency-warning audit.",
    },
  },
  {
    id: "provider-auth-adoption-clarity",
    goals: ["G-139"],
    family: "provider-auth",
    claim: "Provider UI distinguishes API key, this device account, and Relay-isolated account; Codex adoption verifies without forced rotation.",
    boundary: "node",
    guards: [
      {
        path: "src/lib/settings/__tests__/codex-session-adoption.test.ts",
        project: "node",
        marker: "copies and verifies a usable global session without changing the source",
      },
      {
        path: "src/components/settings/__tests__/providers-runtimes-section.test.tsx",
        project: "jsdom",
        marker: "offers explicit isolated adoption for an existing Codex sign-in",
      },
    ],
    command: "test:runtime-graph",
    lane: "runtime-graph",
    failureProof: {
      mode: "red-green",
      evidence: "Adoption asserts normal account read rather than forced refresh; failures remove only the isolated copy.",
    },
  },
  {
    id: "runtime-routing-additional-spend",
    goals: ["G-140"],
    family: "runtime-routing",
    claim: "Additional-spend ordering prefers healthy included plans and customer compute before metered APIs.",
    boundary: "jsdom",
    guards: [
      {
        path: "src/components/settings/__tests__/runtime-routing-control.test.tsx",
        project: "jsdom",
        marker: "orders included-plan and local capacity before metered APIs",
      },
      {
        path: "src/lib/settings/__tests__/runtime-cost-model.test.ts",
        project: "node",
        marker: "included",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "fault-fixture",
      evidence: "Included, local, metered-known, gateway-unknown, and unavailable states are ordered explicitly.",
    },
  },
  {
    id: "settings-compact-progressive-layout",
    goals: ["G-141"],
    family: "settings-layout",
    claim: "Settings uses progressive responsive composition without sacrificing usable navigation or provider hierarchy.",
    boundary: "browser",
    guards: [
      {
        path: "src/components/shell/__tests__/app-bar.browser.test.tsx",
        project: "browser",
        marker: "keeps primary navigation usable at 390px",
      },
      {
        path: "src/components/settings/__tests__/providers-runtimes-section.test.tsx",
        project: "jsdom",
        marker: "renders one provider inventory before a separate task-routing section",
      },
    ],
    command: "test:browser",
    lane: "browser-regressions",
    failureProof: {
      mode: "red-green",
      evidence: "390px geometry fails on the former 17px tablist; semantic inventory assertion fails on implementation buckets.",
    },
  },
  {
    id: "recent-regression-lineage-guard",
    goals: ["G-142"],
    family: "release-confidence",
    claim: "Every completed goal in the fixed audit window remains mapped to a real guard, project, lane, and semantic receipt.",
    boundary: "node-test",
    guards: [
      {
        path: "scripts/check-regression-claims.test.mjs",
        project: "node-test",
        marker: "fails closed on a missing file, stale marker, project mismatch, command, lane, or proof",
      },
      {
        path: "src/components/settings/__tests__/settings-hash-focus.test.tsx",
        project: "jsdom",
        marker: "keeps the deep-linked section stable while async content changes height",
      },
      {
        path: "src/components/shell/__tests__/app-bar.browser.test.tsx",
        project: "browser",
        marker: "keeps primary navigation usable at 390px",
      },
    ],
    command: "test:regression-claims",
    lane: "regression-claims",
    failureProof: {
      mode: "red-green",
      evidence: "The real lane failed on missing completion ownership and on zero-exit output without its semantic receipt.",
    },
  },
];
