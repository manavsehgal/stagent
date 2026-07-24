import type {
  StepState,
  WorkflowDefinition,
  WorkflowState,
} from "./types";

export interface StepRecoveryEligibility {
  eligible: boolean;
  reason: string;
}

/**
 * Prove that retrying a failed sequence step can execute only its unfinished
 * suffix. Unknown patterns and steps without an explicit replay-safety
 * contract fail closed.
 */
export function getSequenceStepRecoveryEligibility(input: {
  definition: WorkflowDefinition;
  state: WorkflowState;
  stepIndex: number;
}): StepRecoveryEligibility {
  const { definition, state, stepIndex } = input;
  if (definition.pattern !== "sequence") {
    return {
      eligible: false,
      reason: `Resume from a failed step is not supported for ${definition.pattern} workflows.`,
    };
  }
  const step = definition.steps[stepIndex];
  const stepState = state.stepStates[stepIndex];
  if (
    !step ||
    !stepState ||
    (stepState.status !== "failed" &&
      stepState.status !== "blocked_runtime")
  ) {
    return {
      eligible: false,
      reason: "Only a failed or runtime-blocked sequence step can be resumed.",
    };
  }
  if (step.replaySafe !== true || step.postAction) {
    return {
      eligible: false,
      reason:
        "Relay cannot prove this step is idempotent or read-only, so it will not replay it automatically.",
    };
  }
  const incompletePrefix = state.stepStates
    .slice(0, stepIndex)
    .find((item) => item.status !== "completed");
  if (incompletePrefix) {
    return {
      eligible: false,
      reason:
        "A prior step is not complete, so Relay cannot prove the completed prefix is safe.",
    };
  }
  const touchedSuffix = state.stepStates
    .slice(stepIndex + 1)
    .find((item) => item.status !== "pending");
  if (touchedSuffix) {
    return {
      eligible: false,
      reason:
        "A later step has already started, so Relay cannot safely resume this suffix.",
    };
  }
  return {
    eligible: true,
    reason:
      "This step is declared replay-safe; completed earlier steps will not run again.",
  };
}

export function withRecoveryEligibility(
  definition: WorkflowDefinition,
  state: WorkflowState | null,
  stepIndex: number,
  stepState: StepState
): StepState {
  if (
    !state ||
    (stepState.status !== "failed" &&
      stepState.status !== "blocked_runtime")
  ) {
    return stepState;
  }
  return {
    ...stepState,
    recoveryEligibility: getSequenceStepRecoveryEligibility({
      definition,
      state,
      stepIndex,
    }),
  };
}
