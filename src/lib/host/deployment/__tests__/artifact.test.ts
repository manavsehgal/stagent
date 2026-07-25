import { describe, expect, it, vi } from "vitest";
import { currentRelayCellRelease } from "../artifact";

// Cell images are published before their digest can be bound into the matching
// npm release. Keep this unit fixture on the last accepted authority; the npm
// workflow owns the fail-closed package-version parity guard.
vi.mock("@/lib/config/version", () => ({ relayProductVersion: () => "0.46.4" }));

describe("Relay Cell release authority", () => {
  it("binds the current Relay version to the accepted immutable public digest", () => {
    expect(currentRelayCellRelease()).toEqual({
      schema: "orionfold.relay-cell-release/v1",
      relayVersion: "0.46.4",
      imageRepository: "ghcr.io/orionfold/relay-cell",
      imageDigest: "sha256:1bdec82cc2e1e8dc174eb15bdb696dc117687bd2a72ee1a98e41305b2d4c3189",
      publishedAt: "2026-07-25T13:39:27Z",
      sourceTag: "cell-v0.46.4",
    });
  });
});
