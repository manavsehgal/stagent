---
title: Refuse installed cross-pack ownership collisions
status: shipped
priority: P1
goal: G-014
source: _IDEAS/packs-robustify.md R2
relates: [pack-taxonomy, pack-taxonomy-codified, pack-bundle-model, app-package-format]
---

# G-014 — Refuse installed cross-pack ownership collisions

## Outcome

A side-by-side pack install refuses a pack that **redefines** a logical primitive
already owned by an installed pack, while still allowing a pack that
**references** it. The refusal happens before any write.

## The gap this closes

Two ownership gates exist today. Neither covers this case.

| Gate | Where | Covers | Misses |
|---|---|---|---|
| `checkTaxonomy` (`scripts/check-pack-taxonomy.mjs`) | build-time CI | bundled packs in `templates/` | anything installed at runtime — it is never called from `src/` |
| `BundleCollisionError` (`src/lib/packs/bundle.ts`) | install, bundle flatten | children merged into ONE app | two packs installed **side by side** as separate apps |

So a third-party pack acquired through `pack add <url>` can redefine
`clients` with different columns and install clean. `install.ts` mints a fresh
UUID per table, so the result is a silent divergent second table — exactly the
failure `pack-taxonomy.md` exists to prevent, but at install time rather than
author time.

## Why the installed manifest cannot be the source of truth

`rewriteTableRefs` (`install.ts:876`) rewrites every table id to its real UUID
before the manifest is dropped. Verified against all nine installed apps in a
live `~/.relay`: every `tables[].id` is a UUID and `name` is absent. **The
logical id is not recoverable from an installed manifest.**

The logical id IS recoverable from the database. `install.ts` creates each table
as `name = tableRef.name ?? titleCase(logicalId)` scoped to
`projectId = pack.meta.id`. That derivation round-trips: checked all 18 registry
table ids against a live DB, and every installed one matched its owner project
by name.

So the ownership source of truth at install time is
`user_tables (project_id, name)` + `user_table_columns`, which — unlike the
static registry — also covers community packs that were never registered.

## The rule (identical to the author-time gate)

For each table the incoming manifest **declares**:

1. Derive its display name the same way `install.ts` does.
2. Find installed tables with that name under a **different** `projectId`.
3. Compare the declared columns against the installed table's columns.
   - **Same columns, same order → allow.** This is a reference/re-list, the
     legitimate `relay-agency-pro` → `relay-agency` pattern.
   - **Different columns → refuse** with a named error identifying both packs,
     the logical id, and the column diff.

Verified this rule does not false-refuse real composition: in a live install,
`relay-agency/Intake` and `relay-agency-pro/Intake` both carry exactly
`[client, service, source, status, notes]`. Every multi-pack table observed
(`Leads`, `Creatives`, `Campaigns`, `Web Sections`, …) is a column-identical
re-list.

A reference that never appears under `tables:` is not checked at all — the
manifest walk excludes it by construction, matching `declaredPrimitives`.

## Scope fences

- Only tables. Schedules install as pack-scoped composite ids
  (`app:<pack>:<id>`), so two packs cannot collide on one; the author-time gate
  keeps covering schedule declarations.
- Re-installing the SAME pack is never a collision — the owner comparison is
  strictly `projectId !== pack.meta.id`, preserving existing idempotency.
- Bundle flatten is untouched: `mergeBundle` still raises
  `BundleCollisionError` for intra-bundle collisions before this gate runs.
- Namespaced community artifacts (profile dirs, blueprint filenames) are
  unaffected — they are already `<pack-id>--name` and cannot collide.

## Placement

A new validation phase `2e` in `installPack`, after `2d`
(`assertRowTriggerVarsFillable`) and strictly before step 3, whose first write
is `ensureAppProject`. The DB read uses the existing dynamic-import seam
(`@/lib/data/tables`) to stay outside the
`@/lib/agents/runtime/catalog.ts` module-load-cycle blast radius (TDR-032).

## Error

`InstalledOwnerCollisionError`, in `src/lib/packs/format.ts` beside
`BundleCollisionError`. Message names the logical id, the installed owner, the
incoming pack, and the column diff, and states the fix (reference the id, or
choose a distinct one).

## Verification

- installed-owner collision fixture → refuses, names both packs
- reference-allowed fixture (identical columns) → installs
- same-pack re-install → still idempotent, no false collision
- atomic no-write assertion: on refusal, no project, table, or manifest is
  created
- real install smoke against a live data dir

## Completion receipt — 2026-09-03

- `src/lib/packs/installed-owner.ts` — pure reconciliation + refusal.
- `InstalledOwnerCollisionError` in `src/lib/packs/format.ts`.
- Phase `2e` in `installPack`, after `2d` and before the step-3 write boundary.
- `installed-owner.test.ts` 15/15; `install-owner-collision.test.ts` 7/7 through
  the real install path against a real DB (nothing mocked).
- Mutation-verified: with the gate disabled, exactly the 3 collision tests fail
  (including the no-write assertion) and the 4 allow-path tests still pass.
- Full suite 555 files / 4050 tests green; pack suite 30/30 (295 tests);
  `npm run check:pack-taxonomy` OK; `tsc --noEmit` clean.
- Real-install smoke via the built CLI against an isolated `RELAY_DATA_DIR`:
  owner installs; the divergent redefinition is refused with exit code 1 and
  leaves no app dir, no table and no project row; a column-identical peer
  installs successfully.

## Out of scope

Retroactively auditing already-installed collisions, and any migration or repair
of a divergence that predates this gate.
