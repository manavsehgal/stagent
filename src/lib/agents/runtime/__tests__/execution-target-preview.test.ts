import { describe, expect, it } from "vitest";
import { InvalidRelayCellIdError } from "@/lib/config/env";
import { classifyExecutionTargetError } from "../execution-target-preview";
import { NoEligibleRuntimeError } from "../execution-target";

describe("classifyExecutionTargetError", () => {
  it("preserves the named managed Cell identity failure", () => {
    expect(classifyExecutionTargetError(new InvalidRelayCellIdError())).toEqual({
      code: "cell_identity_invalid",
      message: "RELAY_CELL_ID must be a lowercase DNS label of at most 63 characters.",
    });
  });

  it("preserves explicit setup actions when no runtime is eligible", () => {
    expect(
      classifyExecutionTargetError(
        new NoEligibleRuntimeError("No eligible runtime", [
          {
            runtimeId: "openai-codex-app-server",
            reason: "Codex is detected but not connected to Relay.",
            actionHref: "/settings#settings-providers-runtimes",
            actionLabel: "Import Codex session in Settings",
          },
        ])
      )
    ).toEqual({
      code: "no_eligible_runtime",
      message: "No eligible runtime",
      actions: [
        {
          href: "/settings#settings-providers-runtimes",
          label: "Import Codex session in Settings",
        },
      ],
    });
  });
});
