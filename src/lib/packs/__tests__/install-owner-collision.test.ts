import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";

/**
 * G-014 — installed cross-pack ownership, through the REAL install path.
 *
 * The reconciliation itself is unit-tested in installed-owner.test.ts. These
 * drive `installPack` against a real temp data dir and the real database, so
 * they prove the gate is actually wired in, refuses BEFORE any write, and does
 * not false-refuse the legitimate re-list pattern. Nothing here is mocked: a
 * mocked install path could not catch the gate being unwired.
 */

let dataDir: string;
let appsDir: string;
let profilesDir: string;
let blueprintsDir: string;
let packDir: string;

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "relay-owner-collision-"));
  appsDir = path.join(dataDir, "apps");
  profilesDir = path.join(dataDir, "profiles");
  blueprintsDir = path.join(dataDir, "blueprints");
  packDir = fs.mkdtempSync(path.join(os.tmpdir(), "relay-owner-pack-"));
  vi.resetModules();
  vi.stubEnv("RELAY_DATA_DIR", dataDir);
});

afterEach(() => {
  vi.unstubAllEnvs();
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.rmSync(packDir, { recursive: true, force: true });
});

function installOpts() {
  return { appsDir, profilesDir, blueprintsDir };
}

/**
 * Write a minimal single-table pack into its own dir and return that dir, so
 * two packs can exist at once (the whole point of a side-by-side test).
 */
function writePack(
  id: string,
  table: { id: string; columns: string[] }
): string {
  const dir = path.join(packDir, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "pack.yaml"),
    yaml.dump({
      id,
      version: "0.1.0",
      name: id,
      author: "Orionfold",
      description: `Ownership fixture ${id}.`,
      customers: [],
    })
  );
  const baseDir = path.join(dir, "base");
  fs.mkdirSync(baseDir, { recursive: true });
  fs.writeFileSync(
    path.join(baseDir, "manifest.yaml"),
    yaml.dump({
      id,
      version: "0.1.0",
      name: id,
      description: `Ownership fixture ${id}.`,
      profiles: [],
      blueprints: [],
      tables: [table],
      schedules: [],
    })
  );
  return dir;
}

async function loadInstaller() {
  const { installPack } = await import("../install");
  const { InstalledOwnerCollisionError } = await import("../format");
  const tables = await import("@/lib/data/tables");
  return { installPack, InstalledOwnerCollisionError, tables };
}

const SPINE = { id: "clients", columns: ["name", "tier", "health"] };

describe("installPack — installed cross-pack ownership (G-014)", () => {
  it("refuses a pack that redefines an installed pack's table", async () => {
    const { installPack, InstalledOwnerCollisionError } = await loadInstaller();
    await installPack(writePack("owner-pack", SPINE), installOpts());

    // Same logical id, DIFFERENT columns — a divergent second owner.
    const intruder = writePack("intruder-pack", {
      id: "clients",
      columns: ["name", "region"],
    });

    await expect(installPack(intruder, installOpts())).rejects.toThrow(
      InstalledOwnerCollisionError
    );
  });

  it("names both packs, the id and the column diff in the refusal", async () => {
    const { installPack } = await loadInstaller();
    await installPack(writePack("owner-pack", SPINE), installOpts());
    const intruder = writePack("intruder-pack", {
      id: "clients",
      columns: ["name", "region"],
    });

    const error = await installPack(intruder, installOpts()).catch(
      (e: Error) => e
    );

    expect(error.message).toContain("owner-pack");
    expect(error.message).toContain("intruder-pack");
    expect(error.message).toContain("clients");
    expect(error.message).toContain("added [region]");
    expect(error.message).toContain("missing [tier, health]");
  });

  it("allows a re-list: same id, identical columns (the Pro -> spine pattern)", async () => {
    const { installPack, tables } = await loadInstaller();
    await installPack(writePack("owner-pack", SPINE), installOpts());

    // Byte-identical columns — this is composition, not a collision.
    const peer = writePack("peer-pack", { ...SPINE });
    await expect(
      installPack(peer, installOpts())
    ).resolves.toMatchObject({ packId: "peer-pack" });

    const peerTables = await tables.listTables({ projectId: "peer-pack" });
    expect(peerTables).toHaveLength(1);
  });

  it("writes NOTHING when it refuses — no project, no table, no app dir", async () => {
    const { installPack, tables } = await loadInstaller();
    await installPack(writePack("owner-pack", SPINE), installOpts());

    const intruder = writePack("intruder-pack", {
      id: "clients",
      columns: ["name", "region"],
    });
    await installPack(intruder, installOpts()).catch(() => {});

    // The atomic assertion: a refused install leaves no trace at all.
    expect(await tables.listTables({ projectId: "intruder-pack" })).toEqual([]);
    expect(fs.existsSync(path.join(appsDir, "intruder-pack"))).toBe(false);

    // ...and the installed owner is untouched.
    const ownerTables = await tables.listTables({ projectId: "owner-pack" });
    expect(ownerTables).toHaveLength(1);
  });

  it("stays idempotent: re-installing the same pack is never a collision", async () => {
    const { installPack, tables } = await loadInstaller();
    const dir = writePack("owner-pack", SPINE);
    await installPack(dir, installOpts());

    await expect(installPack(dir, installOpts())).resolves.toBeDefined();

    // Re-install reuses the existing table rather than minting a second one.
    expect(await tables.listTables({ projectId: "owner-pack" })).toHaveLength(1);
  });

  it("allows a distinct logical id alongside an installed pack", async () => {
    const { installPack } = await loadInstaller();
    await installPack(writePack("owner-pack", SPINE), installOpts());

    const distinct = writePack("other-pack", {
      id: "prospects",
      columns: ["name", "region"],
    });
    await expect(installPack(distinct, installOpts())).resolves.toBeDefined();
  });

  it("installs cleanly into an empty instance (no installed owners yet)", async () => {
    const { installPack } = await loadInstaller();
    await expect(
      installPack(writePack("first-pack", SPINE), installOpts())
    ).resolves.toMatchObject({ packId: "first-pack" });
  });
});
