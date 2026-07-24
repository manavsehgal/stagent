import {
  getRuntimeCatalogEntry,
  type AgentRuntimeId,
} from "@/lib/agents/runtime/catalog";
import { SETTINGS_KEYS } from "@/lib/constants/settings";
import type { RuntimeSetupState } from "./runtime-setup";
import type { RuntimeCostEvidence } from "./runtime-cost-model";
import { getSetting } from "./helpers";

const ECONOMICS_SOURCE_AS_OF = "2026-07-24";

/**
 * Return a comparable combined input + output price in micros per million
 * tokens. Only explicit per-token model rows qualify. Subscription prices and
 * provider fallback rows are not comparable task prices, and unknown endpoint
 * economics remain null.
 */
export async function getComparableRuntimeCost(input: {
  runtimeId: AgentRuntimeId;
  modelId?: string | null;
}): Promise<number | null> {
  const isAnthropic =
    input.runtimeId === "anthropic-direct" ||
    input.runtimeId === "claude-code";
  const isOpenAI =
    input.runtimeId === "openai-direct" ||
    input.runtimeId === "openai-codex-app-server";
  if (!isAnthropic && !isOpenAI) {
    return null;
  }
  const providerId = isAnthropic ? "anthropic" : "openai";
  const configuredModel = await getSetting(
    isAnthropic
      ? SETTINGS_KEYS.ANTHROPIC_DIRECT_MODEL
      : SETTINGS_KEYS.OPENAI_DIRECT_MODEL,
  );
  const modelId =
    input.modelId ??
    configuredModel ??
    getRuntimeCatalogEntry(input.runtimeId).models.default;
  const { getPricingRegistry } = await import("@/lib/usage/pricing-registry");
  const registry = await getPricingRegistry();
  const row = registry.providers[providerId].rows.find(
    (candidate) =>
      candidate.kind === "api_model" &&
      candidate.key !== `${providerId}-fallback` &&
      candidate.matchPrefixes.some((prefix) => modelId.startsWith(prefix)),
  );
  if (
    row?.inputCostPerMillionMicros == null ||
    row.outputCostPerMillionMicros == null
  ) {
    return null;
  }
  return row.inputCostPerMillionMicros + row.outputCostPerMillionMicros;
}

export async function getRuntimeCostEvidence(input: {
  runtimeId: AgentRuntimeId;
  modelId?: string | null;
  setup?: Pick<RuntimeSetupState, "billingMode"> | null;
}): Promise<RuntimeCostEvidence> {
  if (input.setup?.billingMode === "subscription") {
    return {
      kind: "included_plan",
      label: "Included in plan · usage limits apply",
      comparableCostPerMillionMicros: null,
      sourceAsOf: ECONOMICS_SOURCE_AS_OF,
    };
  }

  if (input.runtimeId === "ollama") {
    const modelId = input.modelId ?? "";
    if (modelId.endsWith(":cloud")) {
      return {
        kind: "unknown",
        label: "Ollama Cloud plan economics",
        comparableCostPerMillionMicros: null,
        sourceAsOf: ECONOMICS_SOURCE_AS_OF,
      };
    }
    return {
      kind: "local_compute",
      label: "$0 provider charge · uses your compute",
      comparableCostPerMillionMicros: null,
      sourceAsOf: ECONOMICS_SOURCE_AS_OF,
    };
  }

  if (input.runtimeId === "lmstudio") {
    return {
      kind: "local_compute",
      label: "$0 provider charge · uses your compute",
      comparableCostPerMillionMicros: null,
      sourceAsOf: ECONOMICS_SOURCE_AS_OF,
    };
  }

  if (input.runtimeId === "litellm") {
    return {
      kind: "unknown",
      label: "Gateway economics unknown",
      comparableCostPerMillionMicros: null,
      sourceAsOf: null,
    };
  }

  const comparableCostPerMillionMicros = await getComparableRuntimeCost(input);
  return {
    kind:
      comparableCostPerMillionMicros === null ? "unknown" : "metered_api",
    label:
      comparableCostPerMillionMicros === null
        ? "Metered API price unavailable"
        : "Metered API",
    comparableCostPerMillionMicros,
    sourceAsOf:
      comparableCostPerMillionMicros === null
        ? null
        : ECONOMICS_SOURCE_AS_OF,
  };
}
