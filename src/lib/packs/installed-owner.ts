// Installed cross-pack ownership gate (G-014).
//
// Logical primitive ids (table ids inside a manifest) are NOT namespaced, and
// must not be — sharing a logical id across packs is how composition works
// (`relay-agency-pro` layers a row-insert trigger onto the free spine's
// `intake` table by declaring the same id). So a logical id is a SHARED NAME
// WITH EXACTLY ONE OWNER: a peer may re-list it, but a second pack that
// REDEFINES it with different columns is a bug.
//
// Two gates already cover part of this and neither covers side-by-side install:
//
//   - `scripts/check-pack-taxonomy.mjs` runs at BUILD time over the bundled
//     `templates/` dir. It is never called from `src/`, so a third-party pack
//     acquired through `pack add <url>` never passes through it.
//   - `bundle.ts` raises `BundleCollisionError` when a bundle flatten merges
//     two children into ONE app. Side-by-side installs are separate apps, so
//     that gate never fires for them.
//
// The hole: `install.ts` mints a fresh UUID for every table it creates, so an
// incoming pack that redefines `clients` with different columns installs clean
// and leaves a silent divergent second table.
//
// WHY THE DATABASE, NOT THE INSTALLED MANIFEST. `rewriteTableRefs` rewrites
// every table id to its real UUID before the manifest is dropped, so an
// installed manifest carries no logical ids at all. The logical id survives in
// the DB instead: install creates each table as
// `name = tableRef.name ?? titleCase(logicalId)` under
// `projectId = pack.meta.id`. Reading ownership from live tables also covers
// community packs that were never added to the static taxonomy registry.
//
// PURE BY DESIGN — this module does no I/O. The caller passes already-read
// installed tables in, which keeps the reconciliation unit-testable and keeps
// this module out of the `@/lib/agents/runtime/catalog.ts` module-load-cycle
// blast radius (TDR-032).
import { InstalledOwnerCollisionError } from "./format";

/** One already-installed table, reduced to what ownership needs. */
export interface InstalledTable {
  /** The owning pack id — `user_tables.project_id`. */
  projectId: string;
  /** Display name — `user_tables.name`, derived from the logical id at install. */
  name: string;
  /** Column names in position order. */
  columns: string[];
}

/** One table the incoming manifest DECLARES. */
export interface DeclaredTable {
  /** The logical id as authored, e.g. "clients". */
  id: string;
  /** The display name install will use (`name ?? titleCase(id)`). */
  name: string;
  /** Declared column names in order. */
  columns: string[];
}

/**
 * Title-case a logical id the way `install.ts` does when deriving a table name.
 * Kept in lockstep with the private `titleCase` there; `installed-owner.test.ts`
 * asserts the two agree.
 */
export function displayNameForTable(table: {
  id: string;
  name?: string | null;
}): string {
  if (table.name) return table.name;
  return table.id
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

/** Order-sensitive column equality — the same contract the author-time gate uses. */
function sameColumns(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((c, i) => c === b[i]);
}

/** Human-readable diff of declared vs installed columns. */
function columnDiff(declared: string[], installed: string[]): string {
  const added = declared.filter((c) => !installed.includes(c));
  const missing = installed.filter((c) => !declared.includes(c));
  const parts: string[] = [];
  if (added.length) parts.push(`added [${added.join(", ")}]`);
  if (missing.length) parts.push(`missing [${missing.join(", ")}]`);
  return parts.join(", ") || "reordered";
}

/**
 * Reconcile an incoming pack's declared tables against what is already
 * installed. Returns a finding string per collision; empty means clean.
 *
 * A table collides when another pack has an installed table of the same
 * display name whose columns DIFFER. Identical columns are a legal re-list.
 *
 * Tables installed under the incoming pack's own id are skipped entirely, so
 * re-installing the same pack is never a collision and existing idempotency is
 * preserved.
 */
export function findInstalledOwnerCollisions(
  incomingPackId: string,
  declared: DeclaredTable[],
  installed: InstalledTable[]
): string[] {
  const findings: string[] = [];

  // Index installed tables by display name, excluding the incoming pack's own.
  const byName = new Map<string, InstalledTable[]>();
  for (const table of installed) {
    if (table.projectId === incomingPackId) continue;
    const list = byName.get(table.name);
    if (list) list.push(table);
    else byName.set(table.name, [table]);
  }

  for (const table of declared) {
    for (const owner of byName.get(table.name) ?? []) {
      if (sameColumns(table.columns, owner.columns)) continue; // legal re-list
      findings.push(
        `table "${table.id}" is already owned by installed pack "${owner.projectId}", ` +
          `but "${incomingPackId}" declares it with ` +
          `${columnDiff(table.columns, owner.columns)} vs the installed contract ` +
          `[${owner.columns.join(", ")}]. Reference the id with the same columns ` +
          `instead of redefining it, or give your table a distinct id ` +
          `(pack-taxonomy.md rule 2).`
      );
    }
  }

  return findings;
}

/**
 * Refuse the install when the incoming pack redefines an installed pack's
 * table. Throws `InstalledOwnerCollisionError` listing every collision at once,
 * so a pack with several is fixed in one pass rather than one error per run.
 */
export function assertNoInstalledOwnerCollisions(
  incomingPackId: string,
  declared: DeclaredTable[],
  installed: InstalledTable[]
): void {
  const findings = findInstalledOwnerCollisions(
    incomingPackId,
    declared,
    installed
  );
  if (findings.length === 0) return;
  throw new InstalledOwnerCollisionError(
    `Pack "${incomingPackId}" cannot be installed — it redefines ` +
      `${findings.length === 1 ? "a primitive" : `${findings.length} primitives`} ` +
      `owned by an already-installed pack:\n` +
      findings.map((f) => `  • ${f}`).join("\n")
  );
}
