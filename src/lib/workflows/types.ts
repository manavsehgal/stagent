export type WorkflowPattern =
  | "sequence"
  | "planner-executor"
  | "checkpoint"
  | "loop"
  | "parallel"
  | "swarm";

export interface WorkflowStep {
  id: string;
  name: string;
  prompt: string;
  requiresApproval?: boolean;
  dependsOn?: string[];
  assignedAgent?: string;
  agentProfile?: string;
  /** Document IDs from the project pool to inject as context for this step */
  documentIds?: string[];
  /** Per-step budget override in USD — takes precedence over workflow and global settings */
  budgetUsd?: number;
  /** Per-step runtime override — takes precedence over workflow.runtimeId and global settings */
  runtimeId?: string;
  /**
   * Explicit author assertion that retrying this step is idempotent/read-only.
   * Relay fails closed for exact-step recovery unless this is true.
   */
  replaySafe?: boolean;
  /**
   * If set, this step is a pure time delay (not a task). Format: Nm|Nh|Nd|Nw
   * (1 minute to 30 days). When the engine reaches a delay step, the workflow
   * is marked paused with resume_at = now + delayDuration. The scheduler tick
   * resumes the workflow when resume_at is reached. Delay steps must NOT have
   * a prompt/profile/runtime. See features/workflow-step-delays.md.
   */
  delayDuration?: string;
  /**
   * If set, the checkpoint engine pauses BEFORE running this step's agent and
   * asks the user a question (via the existing `AskUserQuestion` notification +
   * `/api/tasks/[id]/respond` answer loop). The typed answer is injected into
   * the step's context prompt so the agent has the missing data. The run holds
   * in workflow status `paused` indefinitely — no deadline, no auto-fail — until
   * the user responds from the Inbox. Use `inputPrompt` to override the question
   * text; when omitted, the step's own `prompt` is used as the question.
   * See features/fix-workflow-hitl-ask-user.md (BUG-3).
   */
  requiresInput?: boolean;
  /** Question text shown to the user when `requiresInput` is set. Falls back to `prompt`. */
  inputPrompt?: string;
  /**
   * Optional declarative side-effect to apply after the step's task completes
   * successfully. Used by bulk row enrichment to write the agent's result back
   * into a user table cell. Discriminated union — `type` selects the variant.
   * See features/bulk-row-enrichment.md.
   */
  postAction?: StepPostAction;
}

/**
 * Declarative post-step side effect. Currently only `update_row` is supported;
 * adding new variants is purely additive (extend the union, add a dispatcher
 * branch). The `tableId` is informational/audit-only — `updateRow` finds the
 * row by `rowId`. The `rowId` field may contain `{{itemVariable.field}}`
 * placeholders that are resolved against the current loop iteration's row.
 */
export type StepPostAction = {
  type: "update_row";
  tableId: string;
  rowId: string;
  column: string;
};

/** Selector for auto-discovering documents from the project pool */
export interface DocumentSelector {
  fromWorkflowId?: string;
  fromWorkflowName?: string;
  category?: string;
  direction?: "input" | "output";
  mimeType?: string;
  namePattern?: string;
  /** Take only the N most recent matching documents */
  latest?: number;
}

export interface LoopConfig {
  maxIterations: number;
  timeBudgetMs?: number;
  assignedAgent?: string;
  agentProfile?: string;
  completionSignals?: string[];
  /**
   * Row-driven loop: when set, the loop iterates once per item instead of
   * looping autonomously until completionSignals fire. Each item is bound
   * into the prompt template under the name in `itemVariable` (default
   * "item"). Used by bulk row enrichment workflows. Iteration count is
   * still capped by `maxIterations`. See features/bulk-row-enrichment.md.
   */
  items?: unknown[];
  /** Variable name the current item is bound to (default "item"). */
  itemVariable?: string;
}

export interface SwarmConfig {
  workerConcurrencyLimit?: number;
}

export interface WorkflowDefinition {
  pattern: WorkflowPattern;
  steps: WorkflowStep[];
  loopConfig?: LoopConfig;
  swarmConfig?: SwarmConfig;
  metadata?: WorkflowMetadata;
  /** Parent task ID — set when workflow is created from AI assist, used to propagate document context */
  sourceTaskId?: string;
}

export interface WorkflowMetadata {
  enrichment?: WorkflowEnrichmentMetadata;
}

export interface WorkflowEnrichmentTargetContract {
  columnName: string;
  columnLabel: string;
  dataType: "text" | "number" | "boolean" | "select" | "url" | "email";
  allowedOptions?: string[];
}

export interface WorkflowEnrichmentMetadata {
  tableId: string;
  tableName: string;
  targetColumn: string;
  targetColumnLabel: string;
  promptMode: "auto" | "custom";
  strategy:
    | "single-pass-lookup"
    | "single-pass-classify"
    | "research-and-synthesize";
  agentProfile: string;
  eligibleRowCount: number;
  targetContract: WorkflowEnrichmentTargetContract;
}

export type LoopStopReason =
  | "max_iterations"
  | "time_budget"
  | "agent_signaled"
  | "human_cancel"
  | "human_pause"
  | "error";

export interface IterationState {
  iteration: number;
  taskId: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface LoopState {
  currentIteration: number;
  iterations: IterationState[];
  status: "running" | "completed" | "paused" | "failed";
  stopReason?: LoopStopReason;
  startedAt: string;
  completedAt?: string;
  totalDurationMs?: number;
}

export function createInitialLoopState(): LoopState {
  return {
    currentIteration: 0,
    iterations: [],
    status: "running",
    startedAt: new Date().toISOString(),
  };
}

export type WorkflowStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "waiting_approval"
  | "waiting_dependencies"
  /** Runtime became transiently unavailable; explicit step-scoped resume is required. */
  | "blocked_runtime"
  /** Step is a time delay and the workflow is paused waiting for resume_at. */
  | "delayed";

export interface StepRuntimeRecovery {
  kind: "runtime_transient";
  reason: "timeout" | "rate_limited" | "runtime_unavailable";
  attempts: number;
  maxAttempts: number;
  blockedAt: string;
  lastHealthCheck: "available" | "unavailable";
  lastHealthMessage?: string;
}

export interface StepState {
  stepId: string;
  status: WorkflowStepStatus;
  taskId?: string;
  result?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  recovery?: StepRuntimeRecovery;
  /** Computed status-API guidance; not persisted by the workflow engine. */
  recoveryEligibility?: {
    eligible: boolean;
    reason: string;
  };
}

export interface WorkflowState {
  /** Immutable run identity captured when execution begins. */
  executionRunNumber?: number;
  currentStepIndex: number;
  stepStates: StepState[];
  status: "running" | "completed" | "failed" | "paused";
  startedAt: string;
  completedAt?: string;
  /** Pre-flight cost estimate — advisory, populated before execution */
  costEstimate?: unknown;
  /** Durable correlation for a checkpoint input that survives process re-entry. */
  pendingInteraction?:
    | {
        kind: "input";
        stepIndex: number;
        notificationId: string;
        /** Process-scoped durable claim; a new process may reclaim this gate. */
        resumeClaim?: {
          ownerId: string;
          claimedAt: string;
          /** Preallocated child attempt, persisted before its task row exists. */
          taskId?: string;
        };
      }
    | {
        kind: "approval";
        stepIndex: number;
        notificationId: string;
        /** Process-scoped durable claim; a new process may reclaim this gate. */
        resumeClaim?: {
          ownerId: string;
          claimedAt: string;
          /** Preallocated child attempt, persisted before its task row exists. */
          taskId?: string;
        };
      };
}

export function createInitialState(definition: WorkflowDefinition): WorkflowState {
  return {
    currentStepIndex: 0,
    stepStates: definition.steps.map((step) => ({
      stepId: step.id ?? crypto.randomUUID(),
      status: "pending",
    })),
    status: "running",
    startedAt: new Date().toISOString(),
  };
}

/**
 * Document reference returned by the workflow status API alongside each step
 * (output) or parent task (input). The shape matches what the API route
 * actually selects from the documents table.
 */
export interface WorkflowStatusDocument {
  id: string;
  originalName: string;
  mimeType: string;
  storagePath: string;
  direction: string;
}

/**
 * Step with computed state — the shape returned by the status API for every
 * non-loop pattern (sequence, parallel, swarm, planner-executor, checkpoint).
 * `state` is always present because the route synthesizes a pending placeholder
 * when the real stepState hasn't been created yet.
 */
export interface StepWithState extends WorkflowStep {
  state: StepState;
}

/**
 * Run-history summary row returned alongside every status response — counts
 * of tasks per workflow run number.
 */
export interface WorkflowRunAuditTask {
  id: string;
  title: string;
  status: string;
  effectiveRuntimeId: string | null;
  failureReason: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  documents: Array<{ id: string; originalName: string }>;
  events: Array<{
    event: string;
    timestamp: Date | string;
  }>;
}

export interface WorkflowRunAuditApproval {
  id: string;
  title: string;
  toolName: string | null;
  decision: "allow" | "deny" | "pending" | "invalid";
  createdAt: Date | string;
  respondedAt: Date | string | null;
}

export interface WorkflowRunAuditEvent {
  event: string;
  timestamp: Date | string;
}

export interface WorkflowRunHistoryEntry {
  runNumber: number;
  startedAt: Date | string;
  finishedAt: Date | string | null;
  terminalStatus: "completed" | "failed" | null;
  taskCount: number;
  completedCount: number;
  failedCount: number;
  tasks: WorkflowRunAuditTask[];
  approvals: WorkflowRunAuditApproval[];
  events: WorkflowRunAuditEvent[];
  receiptIds: string[];
  /** Explicit disclosure when a per-run evidence bound omitted records. */
  omissions: string[];
  currentStepStates?: StepState[];
}

export interface WorkflowOperationsReceipt {
  id: string;
  sourceKey: string;
  ownerType: "schedule" | "workflow";
  scheduleId: string | null;
  workflowId: string | null;
  taskId: string | null;
  workflowRunNumber: number | null;
  verdict: "passed" | "at_risk" | "failed";
  criteriaSnapshot: unknown[];
  evidence: Array<{
    criterionId?: string;
    label?: string;
    level?: "required" | "advisory";
    check?: string;
    expected?: string | number;
    actual?: string | number | null;
    status?: "passed" | "failed" | "missing";
    detail?: string;
  }>;
  summary: string;
  nextAction: string;
  startedAt: Date | null;
  finishedAt: Date;
  createdAt: Date;
}

/**
 * All non-loop workflow patterns share one response shape. Alias exists so
 * the union arm and the new-pattern checklist (TDR-031) can both reference
 * it — when a new pattern is added to WorkflowPattern, it automatically
 * joins this arm unless the author explicitly adds a new arm with different
 * fields.
 */
export type NonLoopPattern = Exclude<WorkflowPattern, "loop">;

/**
 * Discriminated union shape for `GET /api/workflows/[id]/status` responses.
 * Consumers MUST narrow on `pattern` before reading pattern-specific fields.
 * See TDR-031: Workflow status API is a pattern-discriminated union.
 *
 *   - Loop arm: raw step definitions (no `.state`), plus `loopState` carrying
 *     the real iteration progress in `loopState.iterations[]`. Consumers that
 *     need completed outputs for a loop workflow should read from
 *     `loopState.iterations[].result`, not `steps[].state.result` (which does
 *     not exist on this arm — it's a compile error).
 *
 *   - Non-loop arm: each step wrapped with `.state` synthesized from
 *     `workflowState.stepStates[i]`, plus `resumeAt` for delay pauses. The
 *     non-loop arm covers sequence, parallel, swarm, planner-executor, and
 *     checkpoint patterns — they all share the step-state rendering path.
 */
export type WorkflowStatusResponse =
  | {
      pattern: "loop";
      id: string;
      name: string;
      status: string;
      projectId?: string | null;
      projectName: string | null;
      definition?: string;
      loopConfig?: LoopConfig;
      loopState: LoopState | null;
      liveTaskCount?: number;
      swarmConfig?: SwarmConfig;
      /** Raw step definitions — no `.state` on this arm. Reading from the
       *  iteration stream (`loopState.iterations[]`) is the correct path. */
      steps: WorkflowStep[];
      stepDocuments?: Record<string, WorkflowStatusDocument[]>;
      parentDocuments?: WorkflowStatusDocument[];
      runNumber?: number;
      runHistory?: WorkflowRunHistoryEntry[];
      receipts?: WorkflowOperationsReceipt[];
      receiptReconciliationErrors?: string[];
    }
  | {
      pattern: NonLoopPattern;
      id: string;
      name: string;
      status: string;
      /** Epoch ms for a paused (delay-step) workflow's scheduled resume. */
      resumeAt: number | null;
      projectId?: string | null;
      projectName: string | null;
      definition?: string;
      swarmConfig?: SwarmConfig;
      /** Each step wrapped with `.state` — always present on this arm. */
      steps: StepWithState[];
      workflowState: WorkflowState | null;
      liveTaskCount?: number;
      stepDocuments?: Record<string, WorkflowStatusDocument[]>;
      parentDocuments?: WorkflowStatusDocument[];
      runNumber?: number;
      runHistory?: WorkflowRunHistoryEntry[];
      receipts?: WorkflowOperationsReceipt[];
      receiptReconciliationErrors?: string[];
    };
