/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  getRoutingSettings,
  getRuntimeRoutingStatuses,
} = vi.hoisted(() => ({
  getRoutingSettings: vi.fn(),
  getRuntimeRoutingStatuses: vi.fn(),
}));

vi.mock("@/lib/settings/routing", () => ({ getRoutingSettings }));
vi.mock("@/lib/settings/runtime-routing-status", () => ({
  getRuntimeRoutingStatuses,
}));
vi.mock("@/lib/agents/task-dispatch", () => ({
  startTaskExecution: vi.fn(),
  resumeTaskExecution: vi.fn(),
}));

import { POST } from "../route";

function request(body: unknown) {
  return new NextRequest("http://relay.test/api/runtimes/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function policy(overrides?: Record<string, unknown>) {
  return {
    preference: "cost",
    policy: {
      version: 1,
      eligibleRuntimeIds: ["ollama", "openai-direct", "lmstudio"],
      manualDefaultRuntimeId: "claude-code",
      automaticFallback: true,
    },
    source: "stored",
    needsPersistence: false,
    repairReason: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getRoutingSettings.mockResolvedValue(policy());
  getRuntimeRoutingStatuses.mockResolvedValue([
    {
      runtimeId: "ollama",
      ready: true,
      comparableCostPerMillionMicros: null,
      costEvidence: {
        kind: "local_compute",
        label: "$0 provider charge · uses your compute",
        comparableCostPerMillionMicros: null,
        sourceAsOf: "2026-07-24",
      },
    },
    {
      runtimeId: "openai-direct",
      ready: true,
      comparableCostPerMillionMicros: 2_000_000,
      costEvidence: {
        kind: "metered_api",
        label: "Metered API",
        comparableCostPerMillionMicros: 2_000_000,
        sourceAsOf: "2026-07-24",
      },
    },
    { runtimeId: "anthropic-direct", ready: true },
    { runtimeId: "lmstudio", ready: false },
  ]);
});

describe("POST /api/runtimes/suggest", () => {
  it("ranks only configured members of the saved pool", async () => {
    const response = await POST(request({ title: "Summarize this report" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      runtimeId: "ollama",
      orderedRuntimeIds: ["ollama", "openai-direct"],
      evidence: "known-cost",
      advisory: true,
    });
  });

  it("uses the strict Manual default without consulting the automatic pool", async () => {
    getRoutingSettings.mockResolvedValue(
      policy({
        preference: "manual",
        policy: {
          version: 1,
          eligibleRuntimeIds: [],
          manualDefaultRuntimeId: "lmstudio",
          automaticFallback: true,
        },
      }),
    );
    const response = await POST(request({ title: "Manual task" }));
    expect(await response.json()).toMatchObject({
      runtimeId: "lmstudio",
      orderedRuntimeIds: ["lmstudio"],
      advisory: true,
    });
    expect(getRuntimeRoutingStatuses).not.toHaveBeenCalled();
  });

  it("fails visibly when no configured runtime is eligible", async () => {
    getRuntimeRoutingStatuses.mockResolvedValue([
      { runtimeId: "anthropic-direct", ready: true },
    ]);
    const response = await POST(request({ title: "No candidate" }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "No verified runtime is currently eligible for automatic routing",
    });
  });

  it("rejects malformed and empty requests", async () => {
    expect((await POST(request("{"))).status).toBe(400);
    expect((await POST(request({ title: "   " }))).status).toBe(400);
    expect(
      (await POST(request({ title: "Task", unexpected: true }))).status,
    ).toBe(400);
  });
});
