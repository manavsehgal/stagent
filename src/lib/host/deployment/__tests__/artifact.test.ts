import { describe, expect, it, vi } from "vitest";
import cellRelease from "../relay-cell-release.json";
import { currentRelayCellRelease } from "../artifact";

// The Cell manifest is the single source of truth for the version this test
// must pretend to be: a candidate Cell is published BEFORE its digest is bound
// into the npm release, so during that window the manifest deliberately lags
// package.json and a hardcoded literal here goes stale every release. Read it.
vi.mock("@/lib/config/version", () => ({
  relayProductVersion: () => cellRelease.relayVersion,
}));

describe("Relay Cell release authority", () => {
  it("binds the current Relay version to the accepted immutable public digest", () => {
    // Compare against the manifest itself, not a copy of its values: this
    // asserts the loader parses and returns the accepted authority, and the
    // shape checks below pin what "accepted" has to mean.
    expect(currentRelayCellRelease()).toEqual(cellRelease);

    expect(cellRelease.schema).toBe("orionfold.relay-cell-release/v1");
    expect(cellRelease.imageRepository).toBe("ghcr.io/orionfold/relay-cell");
    // An immutable digest, never a mutable tag.
    expect(cellRelease.imageDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    // The Cell tag line is disjoint from the npm one and must stay that way.
    expect(cellRelease.sourceTag).toBe(`cell-v${cellRelease.relayVersion}`);
  });
});
