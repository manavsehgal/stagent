---
title: Move the Relay Cell runtime to Node 24 LTS
status: specified
priority: P2
goal: G-143
relates: [relay-host-artifact, provider-neutral-relay-host-playbook]
---

# G-143 — Move the Relay Cell runtime to Node 24 LTS

## Outcome

The published Relay Cell runs on Node 24 (Krypton) LTS instead of Node 22
(Jod), with the artifact policy, portable manifest and release receipts moved in
lockstep, and a fresh signed Cell digest published through the normal release
path.

## Why this is a release goal, not a version bump

CI runners moved to Node 24 in `2e30fedb`. The Cell did NOT, because the runtime
major is a governed supply-chain contract, not a free variable. A test bump of
both Dockerfile images was attempted and correctly refused by the artifact
policy:

```
RelayHostArtifactPolicyError: Relay Host distroless runtime image must be
pinned by sha256 digest        (ARTIFACT_INPUT_RUNTIME_DIGEST_MISSING)
```

The regex hardcodes the runtime major
(`scripts/lib/relay-host-artifact-policy.mjs:437`), so the image cannot change
without an explicit, reviewed policy change. That is the guard working.

The builder and runtime majors are also coupled: `Dockerfile.relay-host` copies
`node_modules` built in the `dependencies` stage into the runtime image
(lines 24, 44-46), so native modules must be compiled against the runtime's ABI.
NODE_IMAGE and RUNTIME_IMAGE must therefore move together, never separately.

## Affected surfaces (each pins the runtime major or exact patch)

- `Dockerfile.relay-host` — `NODE_IMAGE` + `RUNTIME_IMAGE` (must move together)
- `scripts/lib/relay-host-artifact-policy.mjs:437` — `nodejs22-debian13` regex
- `scripts/lib/relay-host-manifest.mjs:79` — the same regex
- `scripts/relay-host-smoke.mjs` — three pinned base-image digests
- `deploy/relay-host/portable-manifest.json` + `.schema.json` — `nodeVersion`
  (`"const": "22.23.1"`)
- `scripts/lib/cloud-host/portable-contract.mjs:91` — `PORTABLE_NODE_VERSION_INVALID`
- `docs/relay-host-artifact.md:99` — the stated build toolchain
- `scripts/relay-host-artifact-policy.test.mjs`, `scripts/relay-host-manifest.test.mjs`

## Candidate images (verified 2026-09-03)

- Builder: `node:24.20.0-trixie-slim@sha256:50c3b2f6988dfc307b86e5301d69611af31f4789bdf232863b07d3b02fe55ae0`
- Runtime: `gcr.io/distroless/nodejs24-debian13:nonroot@sha256:774b7d020b24214835769e24c3544835526cd0288f0b094eae48e8b2c2429a79`
  — Trivy: **0 HIGH/CRITICAL**

Re-scan both at execution; digests move.

A side benefit: the current builder is `bookworm` (Debian 12) while the runtime
is Debian 13. Moving to `trixie` aligns them, which is also where the
CVE-2026-14456 `libssl3t64` drift came from.

## Verification

- `npm run host:artifact:build` reports status `verified` with vulnerability
  policy `pass` and no unapproved findings
- reproduction/rollback smoke passes against the prior release ref
- the Cell boots and serves a real request on the new runtime
- portable-manifest conformance and release-preflight receipts regenerate clean
- Host contract workflow green on a PR

## Operator gate

Publishing a new Cell digest, and the release that carries it. Do not re-pin on
main without intending that release.

## Out of scope

`engines` stays `>=22.0.0`: Node 22 is supported until 2027-04-30 and the code
runs identically on both, so the npm floor should not exclude Node 22 users.
The CI-runner Node and the shipped-runtime Node are separate decisions.
