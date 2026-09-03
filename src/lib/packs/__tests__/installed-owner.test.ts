import { describe, expect, it } from "vitest";
import { InstalledOwnerCollisionError } from "../format";
import {
  assertNoInstalledOwnerCollisions,
  displayNameForTable,
  findInstalledOwnerCollisions,
  type DeclaredTable,
  type InstalledTable,
} from "../installed-owner";

/**
 * G-014 — side-by-side install must refuse a pack that REDEFINES a logical
 * table an installed pack owns, while still allowing one that references it.
 *
 * The reconciliation is pure, so these build the installed state in memory.
 * The install-path wiring is covered in install.test.ts.
 */

const SPINE_INTAKE_COLUMNS = ["client", "service", "source", "status", "notes"];

function installed(
  projectId: string,
  name: string,
  columns: string[]
): InstalledTable {
  return { projectId, name, columns };
}

function declared(
  id: string,
  columns: string[],
  name?: string
): DeclaredTable {
  return { id, name: name ?? displayNameForTable({ id }), columns };
}

describe("displayNameForTable", () => {
  it("title-cases a logical id the way install derives a table name", () => {
    expect(displayNameForTable({ id: "clients" })).toBe("Clients");
    expect(displayNameForTable({ id: "lead_research" })).toBe("Lead Research");
    expect(displayNameForTable({ id: "ad-initiatives" })).toBe("Ad Initiatives");
  });

  it("prefers an explicit name over the derived one", () => {
    expect(displayNameForTable({ id: "clients", name: "Client Book" })).toBe(
      "Client Book"
    );
  });

  it("ignores an empty name rather than producing an empty table name", () => {
    expect(displayNameForTable({ id: "clients", name: "" })).toBe("Clients");
  });
});

describe("findInstalledOwnerCollisions", () => {
  it("allows a re-list: same logical id, identical columns", () => {
    // The real relay-agency-pro -> relay-agency pattern. Verified against a
    // live install: both carry exactly [client, service, source, status, notes].
    const findings = findInstalledOwnerCollisions(
      "relay-agency-pro",
      [declared("intake", SPINE_INTAKE_COLUMNS)],
      [installed("relay-agency", "Intake", SPINE_INTAKE_COLUMNS)]
    );
    expect(findings).toEqual([]);
  });

  it("refuses a redefinition: same logical id, different columns", () => {
    const findings = findInstalledOwnerCollisions(
      "acme-intake",
      [declared("intake", ["client", "urgency"])],
      [installed("relay-agency", "Intake", SPINE_INTAKE_COLUMNS)]
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('table "intake"');
    expect(findings[0]).toContain("relay-agency");
    expect(findings[0]).toContain("acme-intake");
  });

  it("names the exact column difference so the author can fix it", () => {
    const [finding] = findInstalledOwnerCollisions(
      "acme",
      [declared("clients", ["name", "tier", "region"])],
      [installed("relay-agency", "Clients", ["name", "tier", "health"])]
    );
    expect(finding).toContain("added [region]");
    expect(finding).toContain("missing [health]");
  });

  it("treats a reordering as a collision — column order is part of the contract", () => {
    const findings = findInstalledOwnerCollisions(
      "acme",
      [declared("clients", ["tier", "name"])],
      [installed("relay-agency", "Clients", ["name", "tier"])]
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain("reordered");
  });

  it("never collides a pack with its own installed tables (re-install stays idempotent)", () => {
    // Even with drifted columns: re-installing the SAME pack is an upgrade
    // path, not a cross-pack ownership conflict.
    const findings = findInstalledOwnerCollisions(
      "relay-agency",
      [declared("clients", ["name", "tier", "new_column"])],
      [installed("relay-agency", "Clients", ["name", "tier"])]
    );
    expect(findings).toEqual([]);
  });

  it("ignores installed tables whose names the incoming pack never declares", () => {
    const findings = findInstalledOwnerCollisions(
      "acme",
      [declared("widgets", ["a"])],
      [installed("relay-agency", "Clients", ["name"])]
    );
    expect(findings).toEqual([]);
  });

  it("reports every colliding owner, not just the first", () => {
    const findings = findInstalledOwnerCollisions(
      "acme",
      [declared("clients", ["a"]), declared("intake", ["b"])],
      [
        installed("relay-agency", "Clients", ["name"]),
        installed("relay-crm", "Intake", SPINE_INTAKE_COLUMNS),
      ]
    );
    expect(findings).toHaveLength(2);
  });

  it("allows a distinct logical id even when another pack owns a similar one", () => {
    const findings = findInstalledOwnerCollisions(
      "acme",
      [declared("acme_clients", ["name"])],
      [installed("relay-agency", "Clients", ["name", "tier"])]
    );
    expect(findings).toEqual([]);
  });

  it("collides on the explicit display name, which is what install writes", () => {
    // Two different logical ids that both render to "Clients" would land on the
    // same table name, so the name is the comparison key, not the raw id.
    const findings = findInstalledOwnerCollisions(
      "acme",
      [declared("book", ["name"], "Clients")],
      [installed("relay-agency", "Clients", ["name", "tier"])]
    );
    expect(findings).toHaveLength(1);
  });
});

describe("assertNoInstalledOwnerCollisions", () => {
  it("passes silently when nothing collides", () => {
    expect(() =>
      assertNoInstalledOwnerCollisions(
        "relay-agency-pro",
        [declared("intake", SPINE_INTAKE_COLUMNS)],
        [installed("relay-agency", "Intake", SPINE_INTAKE_COLUMNS)]
      )
    ).not.toThrow();
  });

  it("throws a named error listing every collision at once", () => {
    let caught: unknown;
    try {
      assertNoInstalledOwnerCollisions(
        "acme",
        [declared("clients", ["a"]), declared("intake", ["b"])],
        [
          installed("relay-agency", "Clients", ["name"]),
          installed("relay-crm", "Intake", SPINE_INTAKE_COLUMNS),
        ]
      );
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(InstalledOwnerCollisionError);
    const message = (caught as Error).message;
    expect(message).toContain("2 primitives");
    expect(message).toContain("clients");
    expect(message).toContain("intake");
  });

  it("uses singular phrasing for a single collision", () => {
    expect(() =>
      assertNoInstalledOwnerCollisions(
        "acme",
        [declared("clients", ["a"])],
        [installed("relay-agency", "Clients", ["name"])]
      )
    ).toThrow(/a primitive/);
  });
});
