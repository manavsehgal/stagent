#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ALWAYS_LANES,
  CONDITIONAL_LANES,
  RELEASE_ONLY_LANES,
} from "./quality-policy.mjs";
import {
  REGRESSION_CLAIMS,
  REGRESSION_CLAIM_WINDOW,
} from "./regression-claim-manifest.mjs";
import { classifyTestFile } from "./test-projects.mjs";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

const SUPPORTED_BOUNDARIES = new Set([
  "browser",
  "document",
  "jsdom",
  "node",
  "node-test",
  "runtime-smoke",
  "sqlite",
  "staging",
]);
const SUPPORTED_PROJECTS = new Set([
  "browser",
  "config",
  "document",
  "e2e",
  "jsdom",
  "node",
  "node-test",
  "script",
  "staging-receipt",
]);
const SUPPORTED_FAILURE_PROOFS = new Set([
  "customer-staging",
  "deferred-promise",
  "fault-fixture",
  "fresh-install",
  "geometry-fixture",
  "real-runtime",
  "red-green",
  "source-reconciliation",
]);

export class RegressionClaimError extends Error {
  constructor(message, failures = []) {
    super(message);
    this.name = "RegressionClaimError";
    this.failures = failures;
  }
}

function canonicalGoal(number) {
  return `G-${String(number).padStart(3, "0")}`;
}

function dateInside(date, window) {
  return date >= window.start && date <= window.end;
}

function goalIdsFromAnnotation(line) {
  const match = line.match(/\(G-(\d{1,3})(?:[–-]G-(\d{1,3}))?/);
  if (!match) return [];
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : start;
  if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) {
    return [];
  }
  return Array.from({ length: end - start + 1 }, (_, index) =>
    canonicalGoal(start + index),
  );
}

export function completedGoalIdsFromChangelog(
  source,
  window = REGRESSION_CLAIM_WINDOW,
) {
  const goals = [];
  let date = null;
  let section = null;
  for (const line of source.split(/\r?\n/)) {
    const dateHeading = line.match(/^## (\d{4}-\d{2}-\d{2})\s*$/);
    if (dateHeading) {
      date = dateHeading[1];
      section = null;
      continue;
    }
    const sectionHeading = line.match(/^### (.+?)\s*$/);
    if (sectionHeading) {
      section = sectionHeading[1];
      continue;
    }
    if (
      date &&
      dateInside(date, window) &&
      section === "Completed" &&
      line.startsWith("- ")
    ) {
      goals.push(...goalIdsFromAnnotation(line));
    }
  }
  return [...new Set(goals)].sort();
}

function safeRelativePath(candidate) {
  return (
    typeof candidate === "string" &&
    candidate.length > 0 &&
    !candidate.startsWith("/") &&
    !candidate.startsWith("./") &&
    !candidate.includes("\0") &&
    !candidate.split("/").some((part) => part === ".." || part === "")
  );
}

function actualProject(path) {
  const vitestProject = classifyTestFile(path);
  if (vitestProject) return vitestProject;
  if (/^scripts\/.*\.test\.mjs$/.test(path)) return "node-test";
  if (path.startsWith("features/") && path.endsWith(".md")) return "document";
  if (path.startsWith("output/staging/") && path.endsWith(".md")) {
    return "staging-receipt";
  }
  if (path.startsWith("scripts/") && path.endsWith(".mjs")) return "script";
  if (path.startsWith("config/")) return "config";
  return null;
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

export function evaluateRegressionClaims({
  claims,
  changelogSource,
  packageJson,
  root = repoRoot,
  qualityLanes = [
    ...ALWAYS_LANES,
    ...CONDITIONAL_LANES,
    ...RELEASE_ONLY_LANES,
  ],
  window = REGRESSION_CLAIM_WINDOW,
}) {
  const failures = [];
  const expectedGoals = completedGoalIdsFromChangelog(changelogSource, window);
  const coveredGoals = claims.flatMap((entry) => entry.goals ?? []);
  const duplicateGoals = coveredGoals.filter(
    (goal, index) => coveredGoals.indexOf(goal) !== index,
  );
  const missingGoals = expectedGoals.filter(
    (goal) => !coveredGoals.includes(goal),
  );
  const extraGoals = sortedUnique(coveredGoals).filter(
    (goal) => !expectedGoals.includes(goal),
  );

  if (missingGoals.length > 0) {
    failures.push(`missing completed goals: ${missingGoals.join(", ")}`);
  }
  if (extraGoals.length > 0) {
    failures.push(`manifest goals outside the completed window: ${extraGoals.join(", ")}`);
  }
  if (duplicateGoals.length > 0) {
    failures.push(`duplicate goal ownership: ${sortedUnique(duplicateGoals).join(", ")}`);
  }

  const ids = claims.map((entry) => entry.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    failures.push(`duplicate claim ids: ${sortedUnique(duplicateIds).join(", ")}`);
  }

  let guardCount = 0;
  for (const entry of claims) {
    const label =
      typeof entry.id === "string" && entry.id ? entry.id : "<missing-id>";
    if (
      typeof entry.id !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)
    ) {
      failures.push(`${label}: id must be stable lowercase kebab-case`);
    }
    if (!Array.isArray(entry.goals) || entry.goals.length === 0) {
      failures.push(`${label}: at least one goal is required`);
    } else if (entry.goals.some((goal) => !/^G-\d{3}$/.test(goal))) {
      failures.push(`${label}: goals must use canonical G-000 form`);
    }
    if (typeof entry.family !== "string" || !entry.family.trim()) {
      failures.push(`${label}: behavior family is required`);
    }
    if (typeof entry.claim !== "string" || entry.claim.trim().length < 20) {
      failures.push(`${label}: customer-observable claim is missing or too vague`);
    }
    if (!SUPPORTED_BOUNDARIES.has(entry.boundary)) {
      failures.push(`${label}: unsupported boundary ${JSON.stringify(entry.boundary)}`);
    }
    if (
      !entry.failureProof ||
      !SUPPORTED_FAILURE_PROOFS.has(entry.failureProof.mode) ||
      typeof entry.failureProof.evidence !== "string" ||
      entry.failureProof.evidence.trim().length < 20
    ) {
      failures.push(`${label}: named failure proof and evidence are required`);
    }
    if (
      typeof entry.command !== "string" ||
      typeof packageJson.scripts?.[entry.command] !== "string"
    ) {
      failures.push(`${label}: unknown package command ${JSON.stringify(entry.command)}`);
    }
    if (!qualityLanes.includes(entry.lane)) {
      failures.push(`${label}: unknown quality lane ${JSON.stringify(entry.lane)}`);
    }
    if (!Array.isArray(entry.guards) || entry.guards.length === 0) {
      failures.push(`${label}: at least one guard is required`);
      continue;
    }
    for (const guard of entry.guards) {
      guardCount += 1;
      if (!safeRelativePath(guard.path)) {
        failures.push(`${label}: unsafe guard path ${JSON.stringify(guard.path)}`);
        continue;
      }
      if (!SUPPORTED_PROJECTS.has(guard.project)) {
        failures.push(`${label}: unsupported guard project ${JSON.stringify(guard.project)}`);
      }
      const detectedProject = actualProject(guard.path);
      if (detectedProject !== guard.project) {
        failures.push(
          `${label}: ${guard.path} declares ${guard.project} but belongs to ${detectedProject ?? "no known project"}`,
        );
      }
      const absolute = resolve(root, guard.path);
      if (!existsSync(absolute)) {
        failures.push(`${label}: guard file is missing: ${guard.path}`);
        continue;
      }
      if (typeof guard.marker !== "string" || guard.marker.length < 4) {
        failures.push(`${label}: ${guard.path} needs a discriminating assertion marker`);
        continue;
      }
      const source = readFileSync(absolute, "utf8");
      if (!source.includes(guard.marker)) {
        failures.push(
          `${label}: guard marker is stale in ${guard.path}: ${JSON.stringify(guard.marker)}`,
        );
      }
    }
  }

  return {
    ok: failures.length === 0,
    schemaVersion: 1,
    window,
    expectedGoals,
    coveredGoals: sortedUnique(coveredGoals),
    claimCount: claims.length,
    guardCount,
    failures,
  };
}

export function checkRegressionClaims({
  root = repoRoot,
  claims = REGRESSION_CLAIMS,
  window = REGRESSION_CLAIM_WINDOW,
} = {}) {
  const changelogSource = readFileSync(
    resolve(root, "features/changelog.md"),
    "utf8",
  );
  const packageJson = JSON.parse(
    readFileSync(resolve(root, "package.json"), "utf8"),
  );
  const report = evaluateRegressionClaims({
    claims,
    changelogSource,
    packageJson,
    root,
    window,
  });
  if (!report.ok) {
    throw new RegressionClaimError(
      `Regression claims failed (${report.failures.length} findings)`,
      report.failures,
    );
  }
  return report;
}

function isMainModule() {
  return (
    process.argv[1] &&
    resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}

if (isMainModule()) {
  try {
    const report = checkRegressionClaims();
    console.log(
      `[regression-claims] OK goals=${report.coveredGoals.length} claims=${report.claimCount} guards=${report.guardCount}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[regression-claims] FAIL ${message}`);
    if (error instanceof RegressionClaimError) {
      for (const failure of error.failures) console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  }
}
