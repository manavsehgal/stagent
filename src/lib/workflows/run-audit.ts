import { and, count, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agentLogs,
  documents,
  notifications,
  operationsReceipts,
  tasks,
  workflowReceiptRuns,
} from "@/lib/db/schema";
import type {
  StepState,
  WorkflowRunAuditApproval,
  WorkflowRunAuditTask,
  WorkflowRunHistoryEntry,
} from "./types";

const RUN_LIMIT = 20;
const TASK_LIMIT_PER_RUN = 200;
const LOG_LIMIT_PER_RUN = 400;
const DOCUMENT_LIMIT_PER_RUN = 400;
const APPROVAL_LIMIT_PER_RUN = 200;
const RECEIPT_LIMIT_PER_RUN = 50;

function approvalDecision(
  response: string | null
): WorkflowRunAuditApproval["decision"] {
  if (!response) return "pending";
  try {
    const parsed = JSON.parse(response) as { behavior?: unknown };
    return parsed.behavior === "allow" || parsed.behavior === "deny"
      ? parsed.behavior
      : "invalid";
  } catch {
    return "invalid";
  }
}

function keepBounded<T>(
  rows: T[],
  limit: number,
  label: string,
  omissions: string[]
): T[] {
  if (rows.length > limit) {
    omissions.push(`${label}: showing newest ${limit}; additional records omitted`);
  }
  return rows.slice(0, limit);
}

/**
 * Reconcile a bounded, run-scoped audit from explicit indexed identities.
 *
 * Log payloads and task results are deliberately excluded: their user/model
 * content may contain credentials or customer data. Event names, terminal
 * classifiers, timestamps, document identities, approvals, and receipts are
 * enough to audit orchestration without copying content into this surface.
 *
 * Every bound is applied per run, newest-first. If any category exceeds its
 * bound, the response carries an explicit `omissions` warning rendered by the
 * workflow UI; a bounded view is never presented as complete.
 */
export async function listWorkflowRunAudit(input: {
  workflowId: string;
  currentRunNumber: number;
  currentStepStates?: StepState[];
}): Promise<WorkflowRunHistoryEntry[]> {
  const receiptRunsPage = await db
    .select()
    .from(workflowReceiptRuns)
    .where(eq(workflowReceiptRuns.workflowId, input.workflowId))
    .orderBy(desc(workflowReceiptRuns.runNumber))
    .limit(RUN_LIMIT + 1);
  const hasEarlierRuns = receiptRunsPage.length > RUN_LIMIT;
  const receiptRuns = receiptRunsPage.slice(0, RUN_LIMIT);

  return Promise.all(
    receiptRuns.map(async (run) => {
      const omissions: string[] = [];
      if (
        hasEarlierRuns &&
        run.runNumber === receiptRuns.at(-1)?.runNumber
      ) {
        omissions.push(
          `Earlier runs: showing newest ${RUN_LIMIT}; additional runs omitted`
        );
      }
      const taskCondition = and(
        eq(tasks.workflowId, input.workflowId),
        eq(tasks.workflowRunNumber, run.runNumber)
      );
      const [[taskTotalRow], [completedTotalRow], [failedTotalRow]] =
        await Promise.all([
          db.select({ value: count() }).from(tasks).where(taskCondition),
          db
            .select({ value: count() })
            .from(tasks)
            .where(and(taskCondition, eq(tasks.status, "completed"))),
          db
            .select({ value: count() })
            .from(tasks)
            .where(and(taskCondition, eq(tasks.status, "failed"))),
        ]);
      const newestTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          effectiveRuntimeId: tasks.effectiveRuntimeId,
          failureReason: tasks.failureReason,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(taskCondition)
        .orderBy(desc(tasks.createdAt))
        .limit(TASK_LIMIT_PER_RUN + 1);
      const runTasks = keepBounded(
        newestTasks,
        TASK_LIMIT_PER_RUN,
        "Attempts",
        omissions
      );
      const taskIds = runTasks.map((task) => task.id);

      const approvalCondition =
        taskIds.length > 0
          ? or(
              and(
                eq(notifications.workflowId, input.workflowId),
                eq(notifications.workflowRunNumber, run.runNumber)
              ),
              inArray(notifications.taskId, taskIds)
            )
          : and(
              eq(notifications.workflowId, input.workflowId),
              eq(notifications.workflowRunNumber, run.runNumber)
            );

      const [taskLogsRaw, workflowLogsRaw, documentsRaw, approvalsRaw, receiptsRaw] =
        await Promise.all([
          taskIds.length > 0
            ? db
                .select({
                  taskId: agentLogs.taskId,
                  event: agentLogs.event,
                  timestamp: agentLogs.timestamp,
                })
                .from(agentLogs)
                .where(inArray(agentLogs.taskId, taskIds))
                .orderBy(desc(agentLogs.timestamp))
                .limit(LOG_LIMIT_PER_RUN + 1)
            : Promise.resolve([]),
          db
            .select({
              event: agentLogs.event,
              timestamp: agentLogs.timestamp,
            })
            .from(agentLogs)
            .where(
              and(
                eq(agentLogs.workflowId, input.workflowId),
                eq(agentLogs.workflowRunNumber, run.runNumber)
              )
            )
            .orderBy(desc(agentLogs.timestamp))
            .limit(LOG_LIMIT_PER_RUN + 1),
          taskIds.length > 0
            ? db
                .select({
                  id: documents.id,
                  taskId: documents.taskId,
                  originalName: documents.originalName,
                })
                .from(documents)
                .where(
                  and(
                    inArray(documents.taskId, taskIds),
                    eq(documents.direction, "output")
                  )
                )
                .orderBy(desc(documents.createdAt))
                .limit(DOCUMENT_LIMIT_PER_RUN + 1)
            : Promise.resolve([]),
          db
            .select({
              id: notifications.id,
              taskId: notifications.taskId,
              title: notifications.title,
              toolName: notifications.toolName,
              response: notifications.response,
              createdAt: notifications.createdAt,
              respondedAt: notifications.respondedAt,
            })
            .from(notifications)
            .where(approvalCondition)
            .orderBy(desc(notifications.createdAt))
            .limit(APPROVAL_LIMIT_PER_RUN + 1),
          db
            .select({ id: operationsReceipts.id })
            .from(operationsReceipts)
            .where(
              and(
                eq(operationsReceipts.workflowId, input.workflowId),
                eq(operationsReceipts.workflowRunNumber, run.runNumber)
              )
            )
            .orderBy(desc(operationsReceipts.createdAt))
            .limit(RECEIPT_LIMIT_PER_RUN + 1),
        ]);

      const taskLogs = keepBounded(
        taskLogsRaw,
        LOG_LIMIT_PER_RUN,
        "Task events",
        omissions
      );
      const workflowLogs = keepBounded(
        workflowLogsRaw,
        LOG_LIMIT_PER_RUN,
        "Workflow events",
        omissions
      );
      const taskDocuments = keepBounded(
        documentsRaw,
        DOCUMENT_LIMIT_PER_RUN,
        "Generated documents",
        omissions
      );
      const runApprovals = keepBounded(
        approvalsRaw,
        APPROVAL_LIMIT_PER_RUN,
        "Decisions",
        omissions
      );
      const runReceipts = keepBounded(
        receiptsRaw,
        RECEIPT_LIMIT_PER_RUN,
        "Operations Receipts",
        omissions
      );

      const logsByTask = new Map<string, WorkflowRunAuditTask["events"]>();
      for (const log of taskLogs) {
        if (!log.taskId) continue;
        const events = logsByTask.get(log.taskId) ?? [];
        events.push({ event: log.event, timestamp: log.timestamp });
        logsByTask.set(log.taskId, events);
      }
      const documentsByTask = new Map<
        string,
        WorkflowRunAuditTask["documents"]
      >();
      for (const document of taskDocuments) {
        if (!document.taskId) continue;
        const items = documentsByTask.get(document.taskId) ?? [];
        items.push({ id: document.id, originalName: document.originalName });
        documentsByTask.set(document.taskId, items);
      }

      const auditTasks: WorkflowRunAuditTask[] = runTasks
        .sort(
          (left, right) =>
            new Date(left.createdAt).valueOf() -
            new Date(right.createdAt).valueOf()
        )
        .map((task) => ({
          ...task,
          documents: documentsByTask.get(task.id) ?? [],
          events: (logsByTask.get(task.id) ?? []).sort(
            (left, right) =>
              new Date(left.timestamp).valueOf() -
              new Date(right.timestamp).valueOf()
          ),
        }));
      const taskCount = taskTotalRow?.value ?? 0;

      return {
        runNumber: run.runNumber,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        terminalStatus: run.terminalStatus,
        taskCount,
        completedCount: completedTotalRow?.value ?? 0,
        failedCount: failedTotalRow?.value ?? 0,
        tasks: auditTasks,
        approvals: runApprovals.map((approval) => ({
          id: approval.id,
          title: approval.title,
          toolName: approval.toolName,
          decision: approvalDecision(approval.response),
          createdAt: approval.createdAt,
          respondedAt: approval.respondedAt,
        })),
        events: workflowLogs
          .sort(
            (left, right) =>
              new Date(left.timestamp).valueOf() -
              new Date(right.timestamp).valueOf()
          )
          .map(({ event, timestamp }) => ({ event, timestamp })),
        receiptIds: runReceipts.map((receipt) => receipt.id),
        omissions,
        ...(run.runNumber === input.currentRunNumber &&
        input.currentStepStates
          ? {
              // Strip result/error fields: the audit surface intentionally
              // exposes state transitions, not raw model/customer content.
              currentStepStates: input.currentStepStates.map((step) => ({
                stepId: step.stepId,
                status: step.status,
                taskId: step.taskId,
                startedAt: step.startedAt,
                completedAt: step.completedAt,
                recoveryEligibility: step.recoveryEligibility,
              })),
            }
          : {}),
      };
    })
  );
}
