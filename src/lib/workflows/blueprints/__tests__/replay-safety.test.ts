import { describe, expect, it, vi } from "vitest";

vi.mock("../registry", () => ({
  getBlueprint: () => ({
    id: "replay-safe-test",
    name: "Replay-safe test",
    description: "Contract fixture",
    version: "1.0.0",
    domain: "work",
    tags: [],
    pattern: "sequence",
    variables: [],
    steps: [
      {
        name: "Read-only lookup",
        profileId: "researcher",
        promptTemplate: "Read without writing",
        requiresApproval: false,
        replaySafe: true,
      },
    ],
  }),
}));

import { prepareBlueprintInstantiation } from "../instantiator";

describe("blueprint replay-safety contract", () => {
  it("carries an explicit replay-safe assertion into the workflow step", () => {
    const prepared = prepareBlueprintInstantiation(
      "replay-safe-test",
      {},
      undefined,
      undefined,
      "workflow-1"
    );
    const definition = JSON.parse(prepared.definition);

    expect(definition.steps[0]).toMatchObject({
      id: "workflow-1:step:0",
      replaySafe: true,
    });
  });
});
