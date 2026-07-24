import { describe, expect, it } from "vitest";
import { getWorkflowExecutionInfo } from "../execution-status";

describe("getWorkflowExecutionInfo", () => {
  it("treats active workflows with live tasks as running", () => {
    expect(
      getWorkflowExecutionInfo({ status: "active", liveTaskCount: 1 })
    ).toMatchObject({
      status: "running",
      canRun: false,
      canStop: true,
    });
  });

  it("treats active workflows waiting on approval as not live", () => {
    expect(
      getWorkflowExecutionInfo({
        status: "active",
        liveTaskCount: 0,
        stepStates: [{ status: "waiting_approval" }],
      })
    ).toMatchObject({
      status: "waiting",
      canRun: true,
      canStop: false,
    });
  });

  it("treats active workflows with no live task or waiting step as stalled", () => {
    expect(
      getWorkflowExecutionInfo({ status: "active", liveTaskCount: 0 })
    ).toMatchObject({
      status: "stalled",
      canRun: true,
      canStop: false,
    });
  });

  it("treats a durable paused claim with a live task as running", () => {
    expect(
      getWorkflowExecutionInfo({
        status: "paused",
        liveTaskCount: 1,
        stepStates: [{ status: "running" }],
      })
    ).toMatchObject({
      status: "running",
      canRun: false,
      canStop: true,
    });
  });

  it("keeps a genuinely waiting paused workflow non-live", () => {
    expect(
      getWorkflowExecutionInfo({
        status: "paused",
        liveTaskCount: 0,
        stepStates: [{ status: "waiting_approval" }],
      })
    ).toMatchObject({
      status: "paused",
      canRun: true,
      canStop: false,
    });
  });
});
