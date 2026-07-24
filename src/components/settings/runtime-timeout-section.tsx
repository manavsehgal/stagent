"use client";

import { useEffect, useState, useCallback } from "react";
import { Timer, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { FormSectionCard } from "@/components/shared/form-section-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DEFAULT_TIMEOUT = 60;
const DEFAULT_MAX_TURNS = 30;

export function RuntimeTimeoutSection() {
  const [timeout, setTimeout_] = useState(DEFAULT_TIMEOUT);
  const [maxTurns, setMaxTurns] = useState(DEFAULT_MAX_TURNS);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/runtime");
      if (res.ok) {
        const data = await res.json();
        if (data.sdkTimeoutSeconds) setTimeout_(parseInt(data.sdkTimeoutSeconds, 10));
        if (data.maxTurns) setMaxTurns(parseInt(data.maxTurns, 10));
      }
    } catch {
      // Use defaults
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (field: "sdkTimeoutSeconds" | "maxTurns", value: number) => {
    setSaving(true);
    try {
      await fetch("/api/settings/runtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: String(value) }),
      });
      toast.success(field === "sdkTimeoutSeconds" ? "Timeout updated" : "Max turns updated");
    } catch {
      toast.error("Failed to save setting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Runtime</CardTitle>
        <CardDescription>
          Bound how long and how far agent operations may run.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
            <FormSectionCard
              icon={Timer}
              title="SDK timeout"
              hint="Maximum wait for one AI response."
              className="min-w-0 p-3"
            >
              <div className="w-full max-w-xl space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">10s</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-medium tabular-nums">
                        {timeout} seconds
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      Lower values may cut off complex reasoning; higher values
                      wait longer.
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-muted-foreground">300s</span>
                </div>
                <div className="relative">
                  <div
                    className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary/10"
                    style={{
                      left: `${((30 - 10) / (300 - 10)) * 100}%`,
                      width: `${((120 - 30) / (300 - 10)) * 100}%`,
                    }}
                  />
                  <Slider
                    value={[timeout]}
                    min={10}
                    max={300}
                    step={5}
                    disabled={saving}
                    onValueChange={(value) => setTimeout_(value[0])}
                    onValueCommit={(value) =>
                      handleSave("sdkTimeoutSeconds", value[0])
                    }
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Recommended 30–120s
                </p>
              </div>
            </FormSectionCard>

            <FormSectionCard
              icon={RotateCcw}
              title="Maximum turns"
              hint="Maximum agent turns in one task."
              className="min-w-0 p-3"
            >
              <div className="w-full max-w-xl space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">1</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-medium tabular-nums">
                        {maxTurns} turns
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      Fewer turns bound simple work; more turns permit longer
                      multi-step execution.
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-muted-foreground">50</span>
                </div>
                <div className="relative">
                  <div
                    className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary/10"
                    style={{
                      left: `${((15 - 1) / (50 - 1)) * 100}%`,
                      width: `${((40 - 15) / (50 - 1)) * 100}%`,
                    }}
                  />
                  <Slider
                    value={[maxTurns]}
                    min={1}
                    max={50}
                    step={1}
                    disabled={saving}
                    onValueChange={(value) => setMaxTurns(value[0])}
                    onValueCommit={(value) =>
                      handleSave("maxTurns", value[0])
                    }
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Recommended 15–40 turns
                </p>
              </div>
            </FormSectionCard>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
