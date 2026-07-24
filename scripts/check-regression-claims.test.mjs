import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  checkRegressionClaims,
  completedGoalIdsFromChangelog,
  evaluateRegressionClaims,
} from "./check-regression-claims.mjs";

const window = { start: "2026-07-21", end: "2026-07-24" };

function changelog(annotation = "G-101") {
  return [
    "# Feature Changelog",
    "",
    "## 2026-07-24",
    "",
    "### Groomed",
    "",
    "- `ignored` (G-999) — not completed.",
    "",
    "### Completed",
    "",
    `- \`fixture\` (${annotation}) — accepted.`,
    "",
    "## 2026-07-20",
    "",
    "### Completed",
    "",
    "- `outside` (G-001) — outside window.",
    "",
  ].join("\n");
}

function fixtureClaim(overrides = {}) {
  return {
    id: "fixture-claim",
    goals: ["G-101"],
    family: "fixture",
    claim: "A completed customer behavior has one executable protecting guard.",
    boundary: "node",
    guards: [
      {
        path: "src/lib/example/__tests__/behavior.test.ts",
        project: "node",
        marker: "rejects the regressed behavior",
      },
    ],
    command: "test",
    lane: "default-coverage",
    failureProof: {
      mode: "red-green",
      evidence: "The fixture deliberately recreates and rejects the regressed behavior.",
    },
    ...overrides,
  };
}

function withFixture(run) {
  const root = mkdtempSync(join(tmpdir(), "relay-regression-claims-"));
  const guard = join(root, "src/lib/example/__tests__/behavior.test.ts");
  mkdirSync(dirname(guard), { recursive: true });
  writeFileSync(
    guard,
    'import { it } from "vitest"; it("rejects the regressed behavior", () => {});\n',
  );
  try {
    return run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function evaluate(root, claims, source = changelog()) {
  return evaluateRegressionClaims({
    claims,
    changelogSource: source,
    packageJson: { scripts: { test: "vitest run" } },
    root,
    qualityLanes: ["default-coverage"],
    window,
  });
}

test("completed-goal parser expands ranges and ignores non-completed/out-of-window goals", () => {
  const source = changelog("G-101–G-103");
  assert.deepEqual(completedGoalIdsFromChangelog(source, window), [
    "G-101",
    "G-102",
    "G-103",
  ]);
});

test("accepts one complete claim mapped to a real guard, command, lane, and failure proof", () =>
  withFixture((root) => {
    const report = evaluate(root, [fixtureClaim()]);
    assert.equal(report.ok, true);
    assert.deepEqual(report.coveredGoals, ["G-101"]);
    assert.equal(report.guardCount, 1);
  }));

test("fails closed when completed goal coverage is missing, extra, or duplicated", () =>
  withFixture((root) => {
    assert.match(
      evaluate(root, []).failures.join("\n"),
      /missing completed goals: G-101/,
    );
    assert.match(
      evaluate(root, [
        fixtureClaim({ goals: ["G-101", "G-102"] }),
      ]).failures.join("\n"),
      /manifest goals outside the completed window: G-102/,
    );
    assert.match(
      evaluate(root, [
        fixtureClaim(),
        fixtureClaim({ id: "second-claim" }),
      ]).failures.join("\n"),
      /duplicate goal ownership: G-101/,
    );
  }));

test("fails closed on a missing file, stale marker, project mismatch, command, lane, or proof", () =>
  withFixture((root) => {
    const cases = [
      [
        fixtureClaim({
          guards: [
            {
              path: "src/lib/example/__tests__/missing.test.ts",
              project: "node",
              marker: "rejects the regressed behavior",
            },
          ],
        }),
        /guard file is missing/,
      ],
      [
        fixtureClaim({
          guards: [
            {
              path: "src/lib/example/__tests__/behavior.test.ts",
              project: "node",
              marker: "marker that does not exist",
            },
          ],
        }),
        /guard marker is stale/,
      ],
      [
        fixtureClaim({
          guards: [
            {
              path: "src/lib/example/__tests__/behavior.test.ts",
              project: "jsdom",
              marker: "rejects the regressed behavior",
            },
          ],
        }),
        /declares jsdom but belongs to node/,
      ],
      [fixtureClaim({ command: "unknown" }), /unknown package command/],
      [fixtureClaim({ lane: "unknown" }), /unknown quality lane/],
      [fixtureClaim({ failureProof: null }), /failure proof/],
    ];
    for (const [claim, pattern] of cases) {
      assert.match(evaluate(root, [claim]).failures.join("\n"), pattern);
    }
  }));

test("the repository manifest covers every completed goal in the fixed audit window", () => {
  const report = checkRegressionClaims();
  assert.equal(report.ok, true);
  assert.equal(report.expectedGoals.length, report.coveredGoals.length);
});
