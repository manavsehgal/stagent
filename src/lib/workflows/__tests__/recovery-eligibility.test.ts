import { describe, expect, it } from "vitest";
import { getSequenceStepRecoveryEligibility } from "../recovery-eligibility";
import type { WorkflowDefinition, WorkflowState } from "../types";

function eligibility(
  stateOverrides: Partial<WorkflowState> = {},
  stepOverrides: Partial<WorkflowDefinition["steps"][number]> = {
    replaySafe: true,
  }
) {
  const definition: WorkflowDefinition = {
    pattern: "sequence",
    steps: [
      { id: "one", name: "One", prompt: "one" },
      { id: "two", name: "Two", prompt: "two", ...stepOverrides },
      { id: "three", name: "Three", prompt: "three" },
    ],
  };
  const state: WorkflowState = {
    currentStepIndex: 1,
    status: "failed",
    startedAt: new Date().toISOString(),
    stepStates: [
      { stepId: "one", status: "completed" },
      { stepId: "two", status: "failed" },
      { stepId: "three", status: "pending" },
    ],
    ...stateOverrides,
  };
  return getSequenceStepRecoveryEligibility({
    definition,
    state,
    stepIndex: 1,
  });
}

describe("sequence step recovery eligibility", () => {
  it("allows a failed step with a completed prefix and untouched suffix", () => {
    expect(eligibility()).toEqual({
      eligible: true,
      reason:
        "This step is declared replay-safe; completed earlier steps will not run again.",
    });
  });

  it("fails closed when a tool-capable step has no explicit replay contract", () => {
    expect(
      eligibility(
        {},
        {
          assignedAgent: "claude-code",
          agentProfile: "implementation",
        }
      )
    ).toMatchObject({
      eligible: false,
      reason: expect.stringContaining("cannot prove"),
    });
  });

  it("fails closed for an unreceipted external write", () => {
    expect(
      eligibility({}, {
        replaySafe: true,
        postAction: {
          type: "update_row",
          tableId: "table-1",
          rowId: "row-1",
          column: "status",
        },
      })
    ).toMatchObject({ eligible: false });
  });

  it("fails closed when a later step has already started", () => {
    expect(
      eligibility({
        stepStates: [
          { stepId: "one", status: "completed" },
          { stepId: "two", status: "failed" },
          { stepId: "three", status: "running" },
        ],
      })
    ).toMatchObject({ eligible: false });
  });
});
