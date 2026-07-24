"use client";

import { Key, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthMethod } from "@/lib/constants/settings";

interface AuthMethodOption {
  id: AuthMethod;
  icon: typeof Key;
  title: string;
  description: string;
  status?: string;
  action?: {
    label: string;
    pendingLabel: string;
    pending: boolean;
    onClick: () => void;
  };
}

interface AuthMethodSelectorProps {
  value: AuthMethod;
  onChange: (method: AuthMethod) => void;
  recommendedMethod?: AuthMethod | null;
  label?: string;
  options?: AuthMethodOption[];
}

const defaultMethods = [
  {
    id: "api_key" as const,
    icon: Key,
    title: "API Key",
    description: "Use an Anthropic API key for authentication",
  },
  {
    id: "oauth" as const,
    icon: Shield,
    title: "OAuth",
    description: "Claude Max or Pro subscription",
  },
];

export function AuthMethodSelector({
  value,
  onChange,
  recommendedMethod,
  label = "Authentication Method",
  options = defaultMethods,
}: AuthMethodSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((method) => {
          const Icon = method.icon;
          const isSelected = value === method.id;
          return (
            <div
              key={method.id}
              className={cn(
                "min-w-0 rounded-lg border-2 text-center transition-colors",
                "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border/40 bg-card/30"
              )}
            >
              <button
                type="button"
                onClick={() => onChange(method.id)}
                className="flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left"
                aria-pressed={isSelected}
              >
                <Icon className={cn(
                  "h-4 w-4 shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="min-w-0 flex-1">
                  <span className={cn(
                    "block truncate text-sm font-medium",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {method.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {method.description}
                  </span>
                  {method.status && (
                    <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-status-warning">
                      {method.status}
                    </span>
                  )}
                  {recommendedMethod === method.id && !isSelected && (
                    <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-primary/70">
                      Recommended
                    </span>
                  )}
                </span>
              </button>
              {method.action && (
                <div className="border-t border-border px-3 py-2 text-left">
                  <button
                    type="button"
                    onClick={method.action.onClick}
                    disabled={method.action.pending}
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline disabled:text-muted-foreground"
                  >
                    {method.action.pending
                      ? method.action.pendingLabel
                      : method.action.label}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
