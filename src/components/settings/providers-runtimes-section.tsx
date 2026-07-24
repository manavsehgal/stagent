"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Network,
  Zap,
  Crown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AuthMethodSelector } from "./auth-method-selector";
import { ApiKeyForm } from "./api-key-form";
import { AuthStatusBadge } from "./auth-status-badge";
import { ConnectionTestControl } from "./connection-test-control";
import { OpenAIChatGPTAuthControl } from "./openai-chatgpt-auth-control";
import type { AuthMethod, ApiKeySource, RoutingPreference } from "@/lib/constants/settings";
import type { RuntimeSetupState } from "@/lib/settings/runtime-setup";
import type { OpenAIAccountInfo, OpenAIRateLimitInfo } from "@/lib/settings/openai-auth";
import type { OpenAILoginState } from "@/lib/settings/openai-login-manager";
import type { RuntimeRoutingStatus } from "@/lib/settings/runtime-routing-status";
import type { RuntimeReadinessPhase } from "@/lib/settings/runtime-readiness";
import {
  RuntimeRoutingControl,
  type RoutingSettingsView,
} from "./runtime-routing-control";
import {
  ProviderSetupCard,
  type SetupRuntimeId,
} from "./provider-setup-card";

// ── Types ────────────────────────────────────────────────────────────

interface ProviderState {
  configured: boolean;
  readiness: RuntimeReadinessPhase;
  readyRuntimeCount: number;
  authMethod?: AuthMethod;
  hasKey: boolean;
  apiKeySource: ApiKeySource;
  oauthConnected?: boolean;
  existingSessionAvailable?: boolean;
  existingSessionAdoptable?: boolean;
  account?: OpenAIAccountInfo | null;
  rateLimits?: OpenAIRateLimitInfo | null;
  login?: OpenAILoginState;
  dualBilling: boolean;
  directModel?: string | null;
  runtimes: RuntimeSetupState[];
}

interface OllamaState {
  configured: boolean;
  connected: boolean;
  baseUrl: string;
  defaultModel: string;
  hasApiKey: boolean;
  apiKeySource: ApiKeySource;
  allowInsecureRemote: boolean;
}

interface ProvidersPayload {
  providers: {
    anthropic: ProviderState;
    openai: ProviderState;
  };
  ollama?: OllamaState;
  chatDefaultModel?: string | null;
  routingPreference: RoutingPreference;
  routing: RoutingSettingsView;
  runtimeRoutingStatuses: RuntimeRoutingStatus[];
  configuredProviderCount: number;
  readyProviderCount: number;
}

// ── Provider row ─────────────────────────────────────────────────────

const RUNTIME_DESCRIPTIONS: Record<string, string> = {
  "claude-code": "Full tool suite, MCP, file access",
  "anthropic-direct": "Messages API, prompt caching, extended thinking",
  "openai-codex-app-server": "Sandboxed workspace execution",
  "openai-direct": "Responses API, code interpreter, web search",
  ollama: "Operator-configured server or cloud API",
};

const BILLING_LABELS: Record<string, string> = {
  subscription: "Subscription",
  usage: "Pay-as-you-go",
};

function statusIsReady(status: RuntimeRoutingStatus | undefined): boolean {
  return status?.ready ?? status?.health === "healthy";
}

function ProviderRow({
  name,
  oauthLabel,
  provider,
  statuses,
  defaultOpen,
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  name: string;
  oauthLabel?: string;
  provider: ProviderState;
  statuses: RuntimeRoutingStatus[];
  defaultOpen: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const toggle = () => {
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const runtimeStatus = new Map(
    statuses.map((status) => [status.runtimeId, status]),
  );
  const readiness =
    provider.readiness ??
    (provider.runtimes.some(
      (runtime) =>
        runtime.configured &&
        statusIsReady(runtimeStatus.get(runtime.runtimeId)),
    )
      ? "verified"
      : provider.configured
        ? "saved-unverified"
        : "not-configured");
  const activeRuntimes = provider.runtimes.filter(
    (runtime) =>
      runtime.configured &&
      statusIsReady(runtimeStatus.get(runtime.runtimeId)),
  );
  const activeCount = activeRuntimes.length;
  const activeLabels = activeRuntimes.map((r) => r.label).join(", ");
  const openAIOAuthPending = provider.authMethod === "oauth" && provider.oauthConnected === false;
  const openAILoginPending = provider.login?.phase === "pending";

  let statusLine: string;
  if (readiness === "not-configured") {
    statusLine =
      name === "OpenAI" &&
      provider.existingSessionAvailable &&
      !provider.oauthConnected
        ? "Activate ChatGPT or add an API key"
        : provider.authMethod === "oauth"
        ? name === "OpenAI"
          ? "Sign in with ChatGPT to enable Codex App Server"
          : `Verify ${oauthLabel ?? "OAuth"} access to enable Claude Code`
        : "Add an API key to enable runtimes";
  } else if (readiness === "auth-rejected") {
    statusLine = "Saved authentication was rejected. Update it, then test again.";
  } else if (readiness === "unreachable") {
    statusLine = "Setup is saved, but the provider is currently unreachable.";
  } else if (readiness === "model-required") {
    statusLine = "The provider is reachable. Load or select a generation model.";
  } else if (readiness === "invalid-response") {
    statusLine = "The provider responded, but Relay could not use its response.";
  } else if (readiness === "saved-unverified") {
    statusLine = "Setup is saved. Test the connection to make it eligible for work.";
  } else if (openAIOAuthPending && activeCount > 0) {
    statusLine = openAILoginPending
      ? `Waiting for ${oauthLabel ?? "OAuth"} sign-in. ${activeLabels} remains active.`
      : `Codex App Server needs ${oauthLabel ?? "OAuth"} sign-in. ${activeLabels} remains active.`;
  } else if (activeCount === 2) {
    statusLine = `2 runtimes active: ${activeLabels}`;
  } else if (activeCount === 1) {
    statusLine = `1 runtime active: ${activeLabels}`;
  } else {
    statusLine = "Connected";
  }

  return (
    <div className="surface-panel rounded-xl border border-border/60">
      <button
        type="button"
        onClick={toggle}
        data-interactive-surface=""
        data-interactive-outline="preserve"
        className="interactive-list-item flex w-full items-center gap-3 rounded-xl p-3 text-left"
      >
        <div
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            readiness === "verified"
              ? "bg-success"
              : "border-2 border-muted-foreground/40"
          }`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">{name}</span>
            <AuthStatusBadge
              connected={readiness === "verified"}
              readiness={readiness}
              apiKeySource={provider.apiKeySource}
              authMethod={provider.authMethod}
              oauthLabel={oauthLabel}
              oauthConnected={provider.oauthConnected}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{statusLine}</p>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="space-y-3 px-3 pb-3">
          <Separator />
          {children}

          {/* Dual-billing note for Anthropic OAuth + API key */}
          {provider.dualBilling && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Two billing modes active.</span>{" "}
                {name === "Anthropic"
                  ? "Claude Code uses your Max/Pro subscription. Anthropic Direct API uses pay-as-you-go API billing."
                  : "Codex App Server uses your ChatGPT plan. OpenAI Direct uses pay-as-you-go API billing."}{" "}
                Budget guardrails track each separately.
              </p>
            </div>
          )}

          {/* Runtimes enabled */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Runtimes
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {provider.runtimes.map((runtime) => {
                const status = runtimeStatus.get(runtime.runtimeId);
                const isActive = runtime.configured && statusIsReady(status);
                const inactiveDescription = runtime.runtimeId.includes("direct")
                  ? "Requires API key"
                  : runtime.runtimeId === "openai-codex-app-server" &&
                      provider.authMethod === "oauth"
                    ? provider.login?.phase === "pending"
                      ? "Waiting for ChatGPT sign-in"
                      : "Sign in with ChatGPT"
                    : "Requires CLI or API key";
                return (
                  <div
                    key={runtime.runtimeId}
                    className={`rounded-xl border px-3 py-2 ${
                      isActive
                        ? "border-border/60 bg-background/40"
                        : "border-border/30 bg-muted/20 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{runtime.label}</p>
                      {isActive && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {BILLING_LABELS[runtime.billingMode] ?? runtime.billingMode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isActive
                        ? (RUNTIME_DESCRIPTIONS[runtime.runtimeId] ?? "Active")
                        : status?.healthReason ?? inactiveDescription}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main section ─────────────────────────────────────────────────────

export function ProvidersAndRuntimesSection() {
  const [data, setData] = useState<ProvidersPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anthropicOpen, setAnthropicOpen] = useState(false);
  const [openAIOpen, setOpenAIOpen] = useState(false);
  const [openAILoginState, setOpenAILoginState] = useState<OpenAILoginState | null>(null);
  const [adoptingCodex, setAdoptingCodex] = useState(false);
  const [codexAdoptionError, setCodexAdoptionError] = useState<string | null>(null);
  const [openLocalProvider, setOpenLocalProvider] =
    useState<SetupRuntimeId | null>(null);

  const fetchData = useCallback(async (
    refreshRuntimeHealth = false,
  ): Promise<ProvidersPayload | null> => {
    try {
      const res = await fetch(
        refreshRuntimeHealth
          ? "/api/settings/providers?refreshRuntimeHealth=1"
          : "/api/settings/providers",
      );
      if (res.ok) {
        const json = (await res.json()) as ProvidersPayload;
        setData(json);
        setError(null);
        return json;
      }
      // A non-OK response left the section spinning forever (issue #9): the
      // render guard is `loading || !data`, so `data` staying null on error
      // meant a permanent "Loading…" card with no visible failure. Surface it.
      setError(`Failed to load provider configuration (HTTP ${res.status}).`);
      return null;
    } catch (err) {
      setError(
        err instanceof Error
          ? `Failed to load provider configuration: ${err.message}`
          : "Failed to load provider configuration.",
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const refresh = () => {
      void fetchData(true);
    };
    window.addEventListener("relay:runtime-readiness-changed", refresh);
    return () =>
      window.removeEventListener("relay:runtime-readiness-changed", refresh);
  }, [fetchData]);

  // Sync initial open state when data loads
  useEffect(() => {
    if (data) {
      const readyProviderCount =
        data.readyProviderCount ??
        Number(
          data.runtimeRoutingStatuses.some((status) => statusIsReady(status)),
        );
      const none = readyProviderCount === 0;
      if (
        none ||
        (data.providers.anthropic.readiness != null &&
          data.providers.anthropic.readiness !== "verified")
      ) {
        setAnthropicOpen(true);
      }
      const openai = data.providers.openai;
      const openaiNeedsAttention =
        none ||
        (openai.readiness != null && openai.readiness !== "verified") ||
        ((openai.authMethod ?? "api_key") === "oauth" &&
          !(openai.oauthConnected ?? false));
      if (openaiNeedsAttention) {
        setOpenAIOpen(true);
      }
      setOpenAILoginState(openai.login ?? null);
    }
  }, [
    data?.readyProviderCount,
    data?.providers.anthropic.configured,
    data?.providers.openai.configured,
    data?.providers.openai.authMethod,
    data?.providers.openai.oauthConnected,
  ]);

  // ── Anthropic auth handlers ──────────────────────────────────────

  async function handleAnthropicMethodChange(method: AuthMethod) {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    });
    if (res.ok) {
      await fetchData();
    }
  }

  async function handleAnthropicSaveKey(apiKey: string) {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "api_key", apiKey }),
    });
    if (res.ok) {
      await fetchData();
    }
  }

  async function handleAnthropicTest() {
    const res = await fetch("/api/settings/test", { method: "POST" });
    const result = await res.json();
    fetchData();
    return result;
  }

  // ── OpenAI auth handlers ─────────────────────────────────────────

  async function handleOpenAISaveKey(apiKey: string) {
    const res = await fetch("/api/settings/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "api_key", apiKey }),
    });
    if (res.ok) {
      await fetchData();
    }
  }

  async function handleOpenAIMethodChange(method: AuthMethod) {
    setCodexAdoptionError(null);
    const res = await fetch("/api/settings/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    });
    if (res.ok) {
      await fetchData();
    }
  }

  async function handleAdoptExistingCodexSession() {
    setAdoptingCodex(true);
    setCodexAdoptionError(null);
    try {
      const response = await fetch("/api/settings/openai/adopt", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        connected?: boolean;
        error?: string;
      };
      if (!response.ok || payload.connected !== true) {
        throw new Error(
          payload.error ?? "Relay could not use the existing Codex sign-in.",
        );
      }
      setOpenAIOpen(true);
      await fetchData(true);
    } catch (adoptionError) {
      setCodexAdoptionError(
        adoptionError instanceof Error
          ? adoptionError.message
          : "Relay could not use the existing Codex sign-in.",
      );
    } finally {
      setAdoptingCodex(false);
    }
  }

  async function handleOpenAITest() {
    const res = await fetch("/api/settings/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runtime: "openai-codex-app-server" }),
    });
    const result = await res.json();
    fetchData();
    return result;
  }

  async function handleOpenAIDirectTest() {
    const res = await fetch("/api/settings/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runtime: "openai-direct" }),
    });
    const result = await res.json();
    fetchData();
    return result;
  }

  // ── Render ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <Card className="surface-card" data-provider-inventory="">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Connect AI providers
          </CardTitle>
          <CardDescription>Loading provider configuration...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Fetch finished but produced no data (non-OK response or thrown error).
  // Show an actionable error with a retry instead of an endless spinner —
  // the previous `loading || !data` guard silently hung here (issue #9).
  if (!data) {
    return (
      <Card className="surface-card" data-provider-inventory="">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Connect AI providers
          </CardTitle>
          <CardDescription>
            {error ?? "Failed to load provider configuration."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              void fetchData();
            }}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  const { providers, configuredProviderCount } = data;
  const readyProviderCount =
    data.readyProviderCount ??
    [
      ["claude-code", "anthropic-direct"],
      ["openai-codex-app-server", "openai-direct"],
      ["ollama"],
      ["litellm"],
      ["lmstudio"],
    ].filter((runtimeIds) =>
      data.runtimeRoutingStatuses.some(
        (status) =>
          runtimeIds.includes(status.runtimeId) && statusIsReady(status),
      ),
    ).length;
  const openAIProvider: ProviderState = {
    ...providers.openai,
    login: openAILoginState ?? providers.openai.login,
  };
  const noneReady = readyProviderCount === 0;

  return (
    <div className="space-y-4">
      <Card className="surface-card gap-3 py-4" data-provider-inventory="">
        <CardHeader className="px-4 pb-1">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Connect AI providers
          </CardTitle>
          <CardDescription>
            {noneReady
              ? configuredProviderCount > 0
                ? "Setup is saved, but no provider has been verified yet."
                : "Connect and verify at least one provider."
              : `${readyProviderCount} provider${readyProviderCount > 1 ? "s" : ""} ready · ${
                  data.runtimeRoutingStatuses.filter((status) =>
                    statusIsReady(status),
                  ).length
                } verified runtimes`}
          </CardDescription>
        </CardHeader>

        <CardContent className="grid items-start gap-2 px-4 lg:grid-cols-2">
          {(["ollama", "lmstudio", "litellm"] as const).map((runtimeId) => (
            <ProviderSetupCard
              key={runtimeId}
              runtimeId={runtimeId}
              compact
              expanded={openLocalProvider === runtimeId}
              onExpandedChange={(open) =>
                setOpenLocalProvider(open ? runtimeId : null)
              }
            />
          ))}
        {/* Anthropic provider — controlled open state */}
        <ProviderRow
          name="Anthropic"
          oauthLabel="Claude Max/Pro"
          provider={providers.anthropic}
          statuses={data.runtimeRoutingStatuses}
          defaultOpen={false}
          open={anthropicOpen}
          onOpenChange={setAnthropicOpen}
        >
          <AuthMethodSelector
            value={providers.anthropic.authMethod ?? "api_key"}
            onChange={handleAnthropicMethodChange}
            label="Use"
            options={[
              {
                id: "api_key",
                icon: Zap,
                title: "API Key",
                description: "API key · Anthropic Direct API",
              },
              {
                id: "oauth",
                icon: Crown,
                title: "Claude Max/Pro",
                description: "This device's account · Claude Code",
              },
            ]}
          />

          {(providers.anthropic.authMethod ?? "api_key") === "api_key" && (
            <div className="space-y-2">
              <ApiKeyForm
                hasKey={providers.anthropic.hasKey}
                onSave={handleAnthropicSaveKey}
                onTest={handleAnthropicTest}
              />
              {providers.anthropic.apiKeySource === "env" && (
                <p className="text-xs text-muted-foreground">
                  Anthropic Direct API will use the key from{" "}
                  <code>ANTHROPIC_API_KEY</code>.
                </p>
              )}
            </div>
          )}

          {(providers.anthropic.authMethod ?? "api_key") === "oauth" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                OAuth mode uses the Claude Agent SDK&apos;s built-in authentication.
                Requires an active Claude Max or Pro subscription.
              </p>
              <ConnectionTestControl onTest={handleAnthropicTest} />
            </div>
          )}

        </ProviderRow>

        {/* OpenAI provider — controlled open state */}
        <ProviderRow
          name="OpenAI"
          oauthLabel="ChatGPT"
          provider={openAIProvider}
          statuses={data.runtimeRoutingStatuses}
          defaultOpen={
            noneReady ||
            openAIProvider.readiness !== "verified" ||
            ((openAIProvider.authMethod ?? "api_key") === "oauth" &&
              !(openAIProvider.oauthConnected ?? false))
          }
          open={openAIOpen}
          onOpenChange={setOpenAIOpen}
        >
          <AuthMethodSelector
            value={openAIProvider.authMethod ?? "api_key"}
            onChange={handleOpenAIMethodChange}
            label="Use for Codex App Server"
            options={[
              {
                id: "api_key",
                icon: Zap,
                title: "API Key",
                description: "API key · Direct API and Codex App Server",
              },
              {
                id: "oauth",
                icon: Crown,
                title: "ChatGPT",
                description: "This Relay's isolated account",
                status:
                  !openAIProvider.oauthConnected &&
                  openAIProvider.existingSessionAvailable
                    ? "Detected — activation required"
                    : undefined,
                action:
                  !openAIProvider.oauthConnected &&
                  openAIProvider.existingSessionAdoptable
                    ? {
                        label: "Use existing Codex sign-in",
                        pendingLabel: "Verifying existing sign-in…",
                        pending: adoptingCodex,
                        onClick: () =>
                          void handleAdoptExistingCodexSession(),
                      }
                    : undefined,
              },
            ]}
          />

          {codexAdoptionError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <p>{codexAdoptionError}</p>
              <button
                type="button"
                className="mt-2 font-medium underline underline-offset-4"
                onClick={() => void handleOpenAIMethodChange("oauth")}
              >
                Sign in with another ChatGPT account
              </button>
            </div>
          )}

          {(openAIProvider.authMethod ?? "api_key") === "oauth" ? (
            <OpenAIChatGPTAuthControl
              connected={openAIProvider.oauthConnected ?? false}
              existingSessionAvailable={
                openAIProvider.existingSessionAvailable ?? false
              }
              existingSessionAdoptable={
                openAIProvider.existingSessionAdoptable ?? false
              }
              account={openAIProvider.account ?? null}
              rateLimits={openAIProvider.rateLimits ?? null}
              initialLoginState={
                openAIProvider.login ?? {
                  phase: "idle",
                  loginId: null,
                  authUrl: null,
                  account: null,
                  rateLimits: null,
                  error: null,
                  startedAt: null,
                  updatedAt: new Date().toISOString(),
                }
              }
              onChanged={async () => {
                await fetchData();
              }}
              onLoginStateChange={setOpenAILoginState}
              showExistingSessionPrompt={false}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              API key mode authenticates Codex App Server directly and also powers OpenAI Direct.
            </p>
          )}

          <Separator />

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">OpenAI Direct API Key</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Used by the OpenAI Direct runtime. If Codex App Server is in API key mode, it shares this key.
              </p>
            </div>
            <ApiKeyForm
              hasKey={providers.openai.hasKey}
              onSave={handleOpenAISaveKey}
              onTest={handleOpenAIDirectTest}
              keyPrefix="sk-"
              placeholder="sk-..."
              maskedPrefix="sk-••••••"
              envVarName="OPENAI_API_KEY"
              testButtonLabel="Test OpenAI Direct"
            />
          </div>
        </ProviderRow>

        </CardContent>
      </Card>

      <Card id="settings-provider-routing" className="surface-card gap-3 scroll-mt-[calc(var(--chrome-glance-top)+2rem)] py-4">
        <CardHeader className="px-4 pb-1">
          <CardTitle>Task routing</CardTitle>
          <CardDescription>
            Order and constrain the verified runtimes above for Relay work.
            Provider changes refresh this eligible runtime list automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4">
        <RuntimeRoutingControl
          routing={data.routing}
          statuses={data.runtimeRoutingStatuses}
          onSaved={(routing) => {
            setData((current) =>
              current
                ? {
                    ...current,
                    routing,
                    routingPreference: routing.preference,
                  }
                : current,
            );
          }}
          onRefreshHealth={async () => {
            const refreshed = await fetchData(true);
            if (!refreshed) {
              throw new Error("Runtime health refresh failed");
            }
          }}
        />
        </CardContent>
      </Card>
    </div>
  );
}
