import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import { ChannelsSection } from "@/components/settings/channels-section";
import { ProviderSetupCard } from "@/components/settings/provider-setup-card";
import { ProviderInventoryGrid } from "@/components/settings/providers-runtimes-section";
import { Card } from "@/components/ui/card";

const channels = [
  {
    id: "slack-channel-with-a-long-stable-identifier",
    channelType: "slack",
    name: "Slack operations",
    config: "{}",
    status: "active",
    testStatus: "ok",
    direction: "bidirectional",
    createdAt: "2026-07-24T12:00:00.000Z",
    updatedAt: "2026-07-24T12:00:00.000Z",
  },
  {
    id: "telegram-channel-with-a-long-stable-identifier",
    channelType: "telegram",
    name: "Telegram alerts",
    config: "{}",
    status: "active",
    testStatus: "failed",
    direction: "bidirectional",
    createdAt: "2026-07-24T12:00:00.000Z",
    updatedAt: "2026-07-24T12:00:00.000Z",
  },
  {
    id: "webhook-channel-with-a-long-stable-identifier",
    channelType: "webhook",
    name: "Customer webhook",
    config: "{}",
    status: "disabled",
    testStatus: "untested",
    direction: "outbound",
    createdAt: "2026-07-24T12:00:00.000Z",
    updatedAt: "2026-07-24T12:00:00.000Z",
  },
];

let channelResponse = channels;

function providerSettings(runtimeId: string) {
  return {
    runtimeId,
    configured: true,
    baseUrl:
      runtimeId === "ollama"
        ? "http://localhost:11434"
        : runtimeId === "lmstudio"
          ? "http://localhost:1234/v1"
          : "http://localhost:4000/v1",
    defaultModel: "",
    allowInsecureRemote: false,
    hasApiKey: false,
    apiKeySource: "unknown",
    readiness: {
      phase: "unreachable",
      ready: false,
      checkedAt: "2026-07-24T12:00:00.000Z",
      credentialSource: "unknown",
      endpointReachable: false,
      reason: "Server unreachable",
    },
  };
}

let root: Root | null = null;

beforeEach(() => {
  channelResponse = channels;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/channels") {
        return { ok: true, json: async () => channelResponse };
      }
      const runtimeId = url.endsWith("/ollama")
        ? "ollama"
        : url.endsWith("/lmstudio")
          ? "lmstudio"
          : url.endsWith("/litellm")
            ? "litellm"
            : null;
      if (runtimeId) {
        return { ok: true, json: async () => providerSettings(runtimeId) };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }),
  );
});

afterEach(() => {
  root?.unmount();
  root = null;
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

function mount(children: React.ReactNode) {
  const host = document.createElement("div");
  host.className = "mx-auto w-[315px]";
  host.dataset.testid = "mobile-settings-boundary";
  document.body.append(host);
  root = createRoot(host);
  root.render(children);
  return host;
}

describe("Settings mobile overflow", () => {
  it("keeps populated delivery-channel rows and every action inside 315px", async () => {
    await page.viewport(390, 844);
    const host = mount(<ChannelsSection />);

    await expect.element(page.getByText("Slack operations")).toBeVisible();
    await expect.element(page.getByText("Telegram alerts")).toBeVisible();
    await expect.element(page.getByText("Customer webhook")).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Test" }).first()).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Delete Slack operations" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Delete Telegram alerts" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Delete Customer webhook" })).toBeVisible();
    await expect.element(page.getByLabelText("Inbound URL for Slack operations")).toBeVisible();
    await expect.element(page.getByLabelText("Inbound URL for Telegram alerts")).toBeVisible();

    expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth);
    for (const row of host.querySelectorAll<HTMLElement>("[data-channel-row]")) {
      expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
    }

    const inboundUrl = host.querySelector<HTMLElement>("[data-channel-inbound-url]");
    expect(inboundUrl).not.toBeNull();
    expect(inboundUrl!.scrollWidth).toBeGreaterThan(inboundUrl!.clientWidth);
    expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth);
  });

  it("keeps the empty delivery-channel state and Add Channel usable", async () => {
    channelResponse = [];
    await page.viewport(390, 844);
    const host = mount(<ChannelsSection />);

    await expect.element(page.getByText("No delivery channels configured.")).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Add Channel" })).toBeVisible();
    expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth);
  });

  it("keeps compact provider cards contained while collapsed and expanded", async () => {
    await page.viewport(390, 844);
    const host = mount(
      <Card>
        <ProviderInventoryGrid>
          <ProviderSetupCard runtimeId="ollama" compact />
          <ProviderSetupCard runtimeId="lmstudio" compact />
          <ProviderSetupCard runtimeId="litellm" compact />
        </ProviderInventoryGrid>
      </Card>,
    );

    expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth);

    for (const name of ["Ollama", "LM Studio", "LiteLLM"]) {
      const provider = page.getByRole("button", { name: new RegExp(name) });
      await expect.element(provider).toBeVisible();
      await provider.click();
      expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth);
    }
    await expect.element(page.getByLabelText("Server base URL").first()).toBeVisible();
  });
});
