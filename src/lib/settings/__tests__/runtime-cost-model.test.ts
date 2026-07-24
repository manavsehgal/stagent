import { describe, expect, it } from "vitest";
import {
  compareRuntimeAdditionalSpend,
  normalizedCostEvidence,
  type RuntimeCostCandidate,
  type RuntimeCostEvidence,
} from "../runtime-cost-model";

function candidate(
  kind: RuntimeCostEvidence["kind"],
  comparableCostPerMillionMicros: number | null = null,
): RuntimeCostCandidate {
  return {
    comparableCostPerMillionMicros,
    costEvidence: {
      kind,
      label: kind,
      comparableCostPerMillionMicros,
      sourceAsOf: "2026-07-24",
    },
  };
}

describe("runtime additional-spend comparison", () => {
  it("ranks local compute and included plans ahead of metered APIs", () => {
    const runtimes = [
      candidate("metered_api", 2_000_000),
      candidate("included_plan"),
      candidate("local_compute"),
    ];

    runtimes.sort(compareRuntimeAdditionalSpend);

    expect(runtimes.map((runtime) => runtime.costEvidence?.kind)).toEqual([
      "included_plan",
      "local_compute",
      "metered_api",
    ]);
  });

  it("orders known metered prices and leaves equal-cost classes stable", () => {
    const expensive = candidate("metered_api", 20_000_000);
    const inexpensive = candidate("metered_api", 4_000_000);
    const included = candidate("included_plan");
    const local = candidate("local_compute");

    expect(compareRuntimeAdditionalSpend(inexpensive, expensive)).toBeLessThan(0);
    expect(compareRuntimeAdditionalSpend(included, local)).toBe(0);
  });

  it("keeps unknown economics behind known zero-marginal and metered choices", () => {
    const unknown = candidate("unknown");

    expect(
      compareRuntimeAdditionalSpend(unknown, candidate("metered_api", 1)),
    ).toBeGreaterThan(0);
    expect(
      compareRuntimeAdditionalSpend(unknown, candidate("local_compute")),
    ).toBeGreaterThan(0);
  });

  it("adapts legacy comparable prices without pretending null is free", () => {
    expect(
      normalizedCostEvidence({
        comparableCostPerMillionMicros: 7_000_000,
      }),
    ).toMatchObject({
      kind: "metered_api",
      comparableCostPerMillionMicros: 7_000_000,
    });
    expect(
      normalizedCostEvidence({
        comparableCostPerMillionMicros: null,
      }).kind,
    ).toBe("unknown");
  });
});
