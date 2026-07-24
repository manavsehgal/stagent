import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ExecutionTargetPreview } from "../execution-target-preview";

describe("ExecutionTargetPreview", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the effective runtime, model, and Manual routing explanation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          kind: "task",
          ready: true,
          error: null,
          context: {
            cell: {
              vocabularyVersion: "relay-host-cell-v1",
              instanceId: "cell-123456789",
              dataDirectory: "/tmp/cell-a",
              databasePath: "/tmp/cell-a/relay.db",
              launchWorkingDirectory: "/tmp/relay",
              dataDirectorySource: "override",
            },
            projectId: "project-1",
            projectName: "Acme report",
            workingDirectory: "/tmp/acme-report",
            workingDirectorySource: "project",
          },
          targets: [
            {
              key: "task-1",
              label: "Draft report",
              profileId: "document-writer",
              requestedRuntimeId: null,
              requestedRuntimeLabel: null,
              effectiveRuntimeId: "claude-code",
              effectiveRuntimeLabel: "Claude Code",
              requestedModelId: null,
              effectiveModelId: "sonnet",
              selectionMode: "manual-default",
              selectionReason:
                "Manual routing — auto-routing is off; using the default runtime",
              routingPreference: "manual",
              automaticFallbackEnabled: false,
              consideredRuntimeIds: ["claude-code"],
              skippedRuntimes: [],
            },
          ],
        }),
      })
    );

    render(<ExecutionTargetPreview kind="task" id="task-1" />);

    expect(await screen.findByText("Execution target")).toBeInTheDocument();
    expect(screen.getByText("Claude Code")).toBeInTheDocument();
    expect(screen.getByText("sonnet")).toBeInTheDocument();
    expect(screen.getByText(/Manual routing — auto-routing is off/)).toBeInTheDocument();
    expect(screen.getByText("cell-123…")).toBeInTheDocument();
    expect(screen.getByText(/\/tmp\/acme-report/)).toBeInTheDocument();
    expect(screen.getByText(/do not create a separate customer data/)).toBeInTheDocument();
  });

  it("shows why automatic candidates were skipped", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          kind: "task",
          ready: true,
          error: null,
          context: null,
          targets: [
            {
              key: "task-2",
              label: "Summarize",
              profileId: "general",
              requestedRuntimeId: null,
              requestedRuntimeLabel: null,
              effectiveRuntimeId: "anthropic-direct",
              effectiveRuntimeLabel: "Anthropic Direct API",
              requestedModelId: null,
              effectiveModelId: "claude-haiku-4-5",
              selectionMode: "automatic",
              selectionReason: "Lowest comparable configured-model token price",
              routingPreference: "cost",
              automaticFallbackEnabled: true,
              consideredRuntimeIds: ["anthropic-direct", "ollama"],
              skippedRuntimes: [
                {
                  runtimeId: "openai-codex-app-server",
                  reason:
                    "Codex is signed in on this computer, but not connected to Relay.",
                  actionHref: "/settings#settings-providers",
                  actionLabel: "Import Codex session in Settings",
                },
              ],
            },
          ],
        }),
      }),
    );
    render(<ExecutionTargetPreview kind="task" id="task-2" />);
    expect(await screen.findByText("1 runtime skipped")).toBeInTheDocument();
    expect(
      screen.getByText(/Codex is signed in on this computer/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Import Codex session in Settings" })
    ).toHaveAttribute("href", "/settings#settings-providers");
  });

  it("renders a named blocking state without inventing an alternative", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          kind: "workflow",
          ready: false,
          targets: [],
          context: null,
          error: {
            code: "no_eligible_runtime",
            message:
              "Codex is signed in on this computer, but not connected to Relay.",
            actions: [
              {
                href: "/settings#settings-providers",
                label: "Import Codex session in Settings",
              },
            ],
          },
        }),
      })
    );

    render(<ExecutionTargetPreview kind="workflow" id="workflow-1" />);

    expect(
      await screen.findByText("Execution target needs attention")
    ).toBeInTheDocument();
    expect(screen.getByText(/not connected to Relay/)).toBeInTheDocument();
    expect(screen.getByText("Edit the target before running.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Import Codex session in Settings" })
    ).toHaveAttribute("href", "/settings#settings-providers");
    expect(screen.queryByText("Open provider setup")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Runs on")).not.toBeInTheDocument());
  });
});
