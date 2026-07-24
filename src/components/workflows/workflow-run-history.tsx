"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  FileText,
  History,
  ShieldQuestion,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkflowRunHistoryEntry } from "@/lib/workflows/types";

function eventLabel(event: string) {
  return event.replaceAll("_", " ");
}

function formatWhen(value: Date | string | null) {
  return value ? new Date(value).toLocaleString() : "In progress";
}

export function WorkflowRunHistory({
  runs,
}: {
  runs: WorkflowRunHistoryEntry[];
}) {
  const searchParams = useSearchParams();
  const selectedRun = Number(searchParams.get("run"));

  useEffect(() => {
    if (!Number.isInteger(selectedRun)) return;
    const element = document.getElementById(
      `workflow-run-${selectedRun}`
    ) as HTMLDetailsElement | null;
    if (!element) return;
    element.open = true;
    element.focus({ preventScroll: true });
    element.scrollIntoView?.({ block: "center" });
  }, [selectedRun]);

  return (
    <Card data-testid="workflow-run-history">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <History className="h-4 w-4" />
          Run audit ({runs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No workflow runs yet.
          </p>
        ) : (
          <ol className="space-y-2" aria-label="Workflow run audit">
            {runs.map((run, index) => {
              const isSelected = run.runNumber === selectedRun;
              const status =
                run.terminalStatus ??
                (run.finishedAt ? "finished" : "in progress");
              const StatusIcon =
                status === "completed"
                  ? CheckCircle2
                  : status === "failed"
                    ? XCircle
                    : Clock3;
              return (
                <li key={run.runNumber}>
                  <details
                    id={`workflow-run-${run.runNumber}`}
                    tabIndex={-1}
                    open={isSelected || index === 0 ? true : undefined}
                    className="surface-card-muted rounded-lg border p-3 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <summary className="flex items-center gap-2 rounded-sm text-sm focus-visible:ring-2 focus-visible:ring-ring">
                      <StatusIcon
                        className={
                          status === "completed"
                            ? "h-4 w-4 text-status-completed"
                            : status === "failed"
                              ? "h-4 w-4 text-destructive"
                              : "h-4 w-4 text-status-running"
                        }
                      />
                      <span className="font-medium">Run {run.runNumber}</span>
                      <Badge variant="outline">{status}</Badge>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {run.taskCount} task{run.taskCount === 1 ? "" : "s"}
                      </span>
                    </summary>

                    <div className="mt-3 space-y-3 border-t pt-3">
                      {(run.omissions?.length ?? 0) > 0 && (
                        <div
                          role="status"
                          className="rounded-md border border-status-warning/40 bg-status-warning/10 p-2 text-xs text-foreground"
                        >
                          Partial audit: {run.omissions.join("; ")}.
                        </div>
                      )}
                      <dl className="grid gap-1 text-xs sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground">Started</dt>
                          <dd>{formatWhen(run.startedAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Finished</dt>
                          <dd>{formatWhen(run.finishedAt)}</dd>
                        </div>
                      </dl>

                      {run.events.length > 0 && (
                        <section>
                          <h4 className="text-xs font-medium">Workflow events</h4>
                          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                            {run.events.map((event, eventIndex) => (
                              <li key={`${event.event}-${eventIndex}`}>
                                {formatWhen(event.timestamp)} ·{" "}
                                {eventLabel(event.event)}
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}

                      {run.approvals.length > 0 && (
                        <section>
                          <h4 className="flex items-center gap-1.5 text-xs font-medium">
                            <ShieldQuestion className="h-3.5 w-3.5" />
                            Decisions
                          </h4>
                          <ul className="mt-1 space-y-1 text-xs">
                            {run.approvals.map((approval) => (
                              <li key={approval.id}>
                                {approval.title} ·{" "}
                                <span className="text-muted-foreground">
                                  {approval.decision}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}

                      {run.tasks.length > 0 && (
                        <section>
                          <h4 className="text-xs font-medium">Attempts</h4>
                          <ol className="mt-1 space-y-2">
                            {run.tasks.map((task) => (
                              <li
                                key={task.id}
                                className="rounded-md border border-border/60 p-2 text-xs"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={`/tasks/${task.id}`}
                                    className="font-medium text-primary hover:underline"
                                  >
                                    {task.title}
                                  </Link>
                                  <Badge variant="secondary">{task.status}</Badge>
                                  {task.effectiveRuntimeId && (
                                    <span className="text-muted-foreground">
                                      {task.effectiveRuntimeId}
                                    </span>
                                  )}
                                </div>
                                {task.failureReason && (
                                  <p className="mt-1 text-destructive">
                                    {eventLabel(task.failureReason)}
                                  </p>
                                )}
                                {task.events.length > 0 && (
                                  <p className="mt-1 text-muted-foreground">
                                    {task.events
                                      .map((event) => eventLabel(event.event))
                                      .join(" → ")}
                                  </p>
                                )}
                                {task.documents.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {task.documents.map((document) => (
                                      <Link
                                        key={document.id}
                                        href={`/documents/${document.id}`}
                                        className="inline-flex items-center gap-1 text-primary hover:underline"
                                      >
                                        <FileText className="h-3 w-3" />
                                        {document.originalName}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ol>
                        </section>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
