---
title: Better SQLite 13 Native Upgrade
status: completed
priority: P2
milestone: post-mvp
source: output/staging/2026-07-23-operator-walkthrough/FINDINGS-live.md BUG-1
dependencies:
  - npm-customer-install-integrity
  - npm-install-warning-hygiene-plan
---

# Better SQLite 13 Native Upgrade

## Description

G-115 deliberately retained `better-sqlite3@12.11.1` and its deprecated
`prebuild-install@7.1.3` path while Relay supported Node 20. The accepted exit
trigger was a Node 22 minimum plus native platform, migration, and recovery
proof. Relay now declares Node 22, so the trigger has fired.

G-138 evaluates and, if verified, adopts the warning-free
`better-sqlite3` 13 line. The goal is native-database continuity, not cosmetic
warning suppression.

## User story

As a customer installing Relay through npm, I want the supported native SQLite
dependency to install cleanly on every claimed platform so that first launch is
quiet without risking my local database.

## Technical approach

- Upgrade only after confirming the exact supported Node/platform prebuilt
  artifact matrix and source-build fallback.
- Prove existing Relay databases open and migrate without transformation loss.
- Exercise backup, restore, export, recovery, concurrent access, and shutdown.
- Re-run npm 11/12 customer-install and native-binding recovery paths against
  the packed artifact.
- Update the exact dependency-debt allowlist so removal of
  `prebuild-install@7.1.3` is enforced and any new deprecated path fails CI.

## Acceptance criteria

- [x] The release workflow requires `better-sqlite3` 13 to load and execute
      from the packed Relay artifact on the default hosted-runner architectures
      for macOS, Windows, and Linux under the supported Node 22/npm 11 and
      Node 24/npm 12 lanes. Local Darwin arm64 execution has passed; the
      unpushed hosted lanes are a post-push release gate, not completed evidence.
      Upstream archive presence is verified separately and is not described as
      cross-architecture execution proof.
- [x] Existing customer database fixtures open, migrate, read, write, back up,
      restore, export, and recover without data loss.
- [x] Fresh `npx` install emits no accepted production deprecation warning.
- [x] npm native-binding preflight/recovery remains truthful when the binding is
      absent or unusable.
- [x] `config/install-dependency-debt.json` removes the obsolete allowance and
      rejects its return.
- [x] Full database, Host, packaging, CLI, production-build, and
      customer-identical smoke gates pass.

## Completion receipt

Accepted locally on 2026-07-23 with `better-sqlite3@13.0.1`. The production
closure no longer contains `prebuild-install`, no lifecycle-script approval is
needed, and publish verification executes a real in-memory query rather than
checking the retired `build/Release` path. A packed npm 11 install and an
official Node 24.15/npm 12.0.1 first-run smoke loaded the packaged native
prebuild without repair claims.

Database bootstrap/migration/snapshot/recovery/native-binding/CLI suites (29
tests), Relay Host tests (136 tests plus 20 artifact contracts), install-debt,
CLI build, npm pack, production build, and a direct native query passed on
Darwin arm64. The release preflight now requires six exact Node/npm lanes across
the default architectures supplied by GitHub's macOS, Windows, and Linux
runners; those newly configured lanes have not run against this unpushed
source and remain mandatory post-push release evidence. Relay Cell separately
proves its Linux amd64/arm64 OCI artifacts.
Upstream `13.0.1` archive inspection confirms prebuild files for Darwin
x64/arm64, Windows x64/arm64, Linux x64/arm64, and Linux-musl x64/arm64; that
archive inspection is availability evidence, not execution proof on every
architecture.

## Scope boundaries

Included:

- `better-sqlite3` major upgrade and direct compatibility work.
- Native installation and database lifecycle proof.
- Dependency-debt guard update.

Excluded:

- Replacing SQLite or Drizzle.
- Lowering the Node minimum.
- Suppressing npm warnings.
- Unrelated dependency-major upgrades.
- Cross-architecture native execution beyond the hosted-runner and Relay Cell
  matrices. A future support claim for another npm architecture needs a real
  runner/device smoke, not archive inspection alone.

## Rescue and rollback

If a claimed platform lacks a reliable binary or source-build path, retain
v12 and update the debt record with the exact missing platform/upstream trigger.
Do not publish a partial platform regression merely to remove the warning.

## References

- `features/npm-install-warning-hygiene-plan.md`
- `features/npm-customer-install-integrity.md`
- `features/chore-deprecated-transitive-deps.md`
- `config/install-dependency-debt.json`
