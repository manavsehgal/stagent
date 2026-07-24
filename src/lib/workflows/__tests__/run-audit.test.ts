/** @vitest-environment node */

import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  agentLogs,
  documents,
  notifications,
  operationsReceipts,
  tasks,
  workflowReceiptRuns,
  workflows,
} from "@/lib/db/schema";
import { listWorkflowRunAudit } from "../run-audit";

beforeEach(() => {
  db.delete(operationsReceipts).run();
  db.delete(documents).run();
  db.delete(agentLogs).run();
  db.delete(notifications).run();
  db.delete(tasks).run();
  db.delete(workflowReceiptRuns).run();
  db.delete(workflows).run();
});

describe("listWorkflowRunAudit", () => {
  it("keeps separate bounded evidence for prior and current runs without log payloads", async () => {
    const workflowId = randomUUID();
    const now = new Date();
    db.insert(workflows)
      .values({
        id: workflowId,
        name: "Audit workflow",
        definition: JSON.stringify({ pattern: "sequence", steps: [] }),
        status: "failed",
        runNumber: 2,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    db.insert(workflowReceiptRuns)
      .values([
        {
          id: randomUUID(),
          workflowId,
          runNumber: 1,
          criteriaSnapshot: "[]",
          terminalStatus: "completed",
          startedAt: new Date(now.getTime() - 10_000),
          finishedAt: new Date(now.getTime() - 8_000),
        },
        {
          id: randomUUID(),
          workflowId,
          runNumber: 2,
          criteriaSnapshot: "[]",
          terminalStatus: "failed",
          startedAt: new Date(now.getTime() - 4_000),
          finishedAt: now,
        },
      ])
      .run();
    const taskOne = randomUUID();
    const taskTwo = randomUUID();
    db.insert(tasks)
      .values([
        {
          id: taskOne,
          workflowId,
          workflowRunNumber: 1,
          title: "First run",
          status: "completed",
          sourceType: "workflow",
          createdAt: new Date(now.getTime() - 10_000),
          updatedAt: new Date(now.getTime() - 8_000),
        },
        {
          id: taskTwo,
          workflowId,
          workflowRunNumber: 2,
          title: "Second run",
          status: "failed",
          sourceType: "workflow",
          failureReason: "sdk_error",
          createdAt: new Date(now.getTime() - 4_000),
          updatedAt: now,
        },
      ])
      .run();
    db.insert(agentLogs)
      .values({
        id: randomUUID(),
        taskId: taskTwo,
        agentType: "runtime",
        event: "task_failed",
        payload: JSON.stringify({ apiKey: "must-not-leave-the-log-row" }),
        timestamp: now,
      })
      .run();
    db.insert(agentLogs)
      .values({
        id: randomUUID(),
        taskId: null,
        workflowId,
        workflowRunNumber: 2,
        agentType: "workflow-engine",
        event: "workflow_step_retry_started",
        payload: JSON.stringify({ token: "must-not-leave-the-log-row" }),
        timestamp: now,
      })
      .run();
    db.insert(notifications)
      .values({
        id: randomUUID(),
        workflowId,
        workflowRunNumber: 2,
        type: "permission_required",
        title: "Workflow checkpoint: Publish",
        toolName: "WorkflowCheckpoint",
        response: JSON.stringify({ behavior: "deny" }),
        respondedAt: now,
        createdAt: new Date(now.getTime() - 1_000),
      })
      .run();

    const audit = await listWorkflowRunAudit({
      workflowId,
      currentRunNumber: 2,
      currentStepStates: [
        { stepId: "publish", status: "failed", error: "denied" },
      ],
    });

    expect(audit.map((run) => run.runNumber)).toEqual([2, 1]);
    expect(audit[0]).toMatchObject({
      taskCount: 1,
      failedCount: 1,
      terminalStatus: "failed",
      approvals: [{ decision: "deny" }],
      events: [{ event: "workflow_step_retry_started" }],
      currentStepStates: [{ stepId: "publish", status: "failed" }],
      omissions: [],
    });
    expect(audit[1]).toMatchObject({
      taskCount: 1,
      completedCount: 1,
      terminalStatus: "completed",
    });
    expect(JSON.stringify(audit)).not.toContain("must-not-leave-the-log-row");
    expect(JSON.stringify(audit)).not.toContain("denied");
  });

  it("keeps the newest attempts and discloses a per-run boundary", async () => {
    const workflowId = randomUUID();
    const now = new Date();
    db.insert(workflows)
      .values({
        id: workflowId,
        name: "High-volume audit",
        definition: JSON.stringify({ pattern: "sequence", steps: [] }),
        status: "failed",
        runNumber: 1,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    db.insert(workflowReceiptRuns)
      .values({
        id: randomUUID(),
        workflowId,
        runNumber: 1,
        criteriaSnapshot: "[]",
        terminalStatus: "failed",
        startedAt: new Date(now.getTime() - 300_000),
        finishedAt: now,
      })
      .run();
    db.insert(tasks)
      .values(
        Array.from({ length: 201 }, (_, index) => ({
          id: randomUUID(),
          workflowId,
          workflowRunNumber: 1,
          title: `Attempt ${index}`,
          status: index === 200 ? "failed" : "completed",
          sourceType: "workflow" as const,
          createdAt: new Date(now.getTime() - (201 - index) * 1_000),
          updatedAt: now,
        }))
      )
      .run();

    const [run] = await listWorkflowRunAudit({
      workflowId,
      currentRunNumber: 1,
    });

    expect(run.taskCount).toBe(201);
    expect(run.completedCount).toBe(200);
    expect(run.failedCount).toBe(1);
    expect(run.tasks).toHaveLength(200);
    expect(run.tasks.at(-1)?.title).toBe("Attempt 200");
    expect(run.tasks.some((task) => task.title === "Attempt 0")).toBe(false);
    expect(run.omissions).toEqual([
      "Attempts: showing newest 200; additional records omitted",
    ]);
  });

  it("discloses when earlier runs fall outside the retained history page", async () => {
    const workflowId = randomUUID();
    const now = new Date();
    db.insert(workflows)
      .values({
        id: workflowId,
        name: "Many runs",
        definition: JSON.stringify({ pattern: "sequence", steps: [] }),
        status: "completed",
        runNumber: 21,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    db.insert(workflowReceiptRuns)
      .values(
        Array.from({ length: 21 }, (_, index) => ({
          id: randomUUID(),
          workflowId,
          runNumber: index + 1,
          criteriaSnapshot: "[]",
          terminalStatus: "completed" as const,
          startedAt: new Date(now.getTime() - (21 - index) * 1_000),
          finishedAt: now,
        }))
      )
      .run();

    const audit = await listWorkflowRunAudit({
      workflowId,
      currentRunNumber: 21,
    });

    expect(audit).toHaveLength(20);
    expect(audit[0].runNumber).toBe(21);
    expect(audit.at(-1)?.runNumber).toBe(2);
    expect(audit.at(-1)?.omissions).toContain(
      "Earlier runs: showing newest 20; additional runs omitted"
    );
  });
});
