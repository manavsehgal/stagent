export type RuntimeCostClass =
  | "local_compute"
  | "included_plan"
  | "metered_api"
  | "unknown";

export interface RuntimeCostEvidence {
  kind: RuntimeCostClass;
  label: string;
  comparableCostPerMillionMicros: number | null;
  sourceAsOf: string | null;
}

export interface RuntimeCostCandidate {
  comparableCostPerMillionMicros: number | null;
  costEvidence?: RuntimeCostEvidence;
}

const COST_CLASS_RANK: Record<RuntimeCostClass, number> = {
  local_compute: 0,
  included_plan: 0,
  metered_api: 1,
  unknown: 2,
};

export function normalizedCostEvidence(
  candidate: RuntimeCostCandidate,
): RuntimeCostEvidence {
  if (candidate.costEvidence) return candidate.costEvidence;
  if (candidate.comparableCostPerMillionMicros !== null) {
    return {
      kind: "metered_api",
      label: "Metered API",
      comparableCostPerMillionMicros:
        candidate.comparableCostPerMillionMicros,
      sourceAsOf: null,
    };
  }
  return {
    kind: "unknown",
    label: "Economics unknown",
    comparableCostPerMillionMicros: null,
    sourceAsOf: null,
  };
}

export function compareRuntimeAdditionalSpend(
  left: RuntimeCostCandidate,
  right: RuntimeCostCandidate,
): number {
  const leftEvidence = normalizedCostEvidence(left);
  const rightEvidence = normalizedCostEvidence(right);
  const classDifference =
    COST_CLASS_RANK[leftEvidence.kind] - COST_CLASS_RANK[rightEvidence.kind];
  if (classDifference !== 0) return classDifference;

  if (
    leftEvidence.kind === "metered_api" &&
    rightEvidence.kind === "metered_api"
  ) {
    const leftCost = leftEvidence.comparableCostPerMillionMicros;
    const rightCost = rightEvidence.comparableCostPerMillionMicros;
    if (leftCost !== null && rightCost !== null) return leftCost - rightCost;
    if (leftCost !== rightCost) return leftCost === null ? 1 : -1;
  }
  return 0;
}
