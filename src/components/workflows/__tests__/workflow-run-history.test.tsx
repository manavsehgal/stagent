import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkflowRunHistory } from "../workflow-run-history";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("run=2"),
}));

describe("WorkflowRunHistory", () => {
  it("renders exact-run tasks, decisions, events, and outputs", () => {
    render(
      <WorkflowRunHistory
        runs={[
          {
            runNumber: 2,
            startedAt: "2026-07-23T12:00:00.000Z",
            finishedAt: null,
            terminalStatus: null,
            taskCount: 1,
            completedCount: 0,
            failedCount: 1,
          events: [
              {
                event: "workflow_step_retry_started",
                timestamp: "2026-07-23T12:02:00.000Z",
              },
            ],
            approvals: [
              {
                id: "approval-1",
                title: "Workflow checkpoint: Publish",
                toolName: "WorkflowCheckpoint",
                decision: "allow",
                createdAt: "2026-07-23T12:01:00.000Z",
                respondedAt: "2026-07-23T12:01:30.000Z",
              },
          ],
          omissions: [],
          receiptIds: ["receipt-2"],
            tasks: [
              {
                id: "task-2",
                title: "Publish",
                status: "failed",
                effectiveRuntimeId: "claude-code",
                failureReason: "sdk_error",
                createdAt: "2026-07-23T12:00:00.000Z",
                updatedAt: "2026-07-23T12:02:00.000Z",
                events: [
                  {
                    event: "task_failed",
                    timestamp: "2026-07-23T12:02:00.000Z",
                  },
                ],
                documents: [
                  { id: "document-1", originalName: "launch-plan.md" },
                ],
              },
            ],
          },
        ]}
      />
    );

    expect(screen.getByText("Run 2")).toBeInTheDocument();
    expect(screen.getByText(/workflow step retry started/i)).toBeInTheDocument();
    expect(screen.getByText(/workflow checkpoint: publish/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Publish" })).toHaveAttribute(
      "href",
      "/tasks/task-2"
    );
    expect(screen.getByRole("link", { name: /launch-plan.md/i })).toHaveAttribute(
      "href",
      "/documents/document-1"
    );
  });
});
