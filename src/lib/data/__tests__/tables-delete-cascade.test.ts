import { describe, it, expect, beforeEach } from "vitest";
import { eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  documents,
  scheduleTableInputs,
  schedules,
  tableDocumentInputs,
  taskTableInputs,
  tasks,
  userTableColumns,
  userTableImports,
  userTableRelationships,
  userTableRowHistory,
  userTableRows,
  userTableTriggers,
  userTableViews,
  userTables,
  workflowTableInputs,
  workflows,
} from "@/lib/db/schema";
import { deleteTable } from "@/lib/data/tables";

/**
 * Regression: deleting a table failed once it had any child other than rows or
 * columns.
 *
 * `deleteTable` cleared only `user_table_rows` and `user_table_columns`, so a
 * table that had ever been given a saved chart, a workflow trigger, an import
 * record, row history, a relationship, or a link to a task/workflow/schedule/
 * document could not be deleted at all: SQLite rejected the parent delete with
 * "FOREIGN KEY constraint failed", the request returned 500, and the table
 * stayed exactly where it was.
 *
 * A saved chart is enough to trigger it, which makes it easy to hit and hard to
 * explain — the table looks ordinary and simply refuses to go.
 *
 * This builds a table with one child of EVERY kind that references it, then
 * deletes it, so a future child table added without a matching delete fails
 * here rather than in a user's hands.
 */
describe("deleteTable FK cascade", () => {
  const ID = "test-delete-cascade-table";
  const OTHER = "test-delete-cascade-other";
  const now = new Date();

  const column = (id: string, tableId: string) => ({
    id,
    tableId,
    name: "title",
    displayName: "Title",
    dataType: "text" as const,
    position: 0,
    required: false,
    createdAt: now,
    updatedAt: now,
  });

  const table = (id: string) => ({
    id,
    name: id,
    columnSchema: "[]",
    rowCount: 0,
    source: "manual" as const,
    createdAt: now,
    updatedAt: now,
  });

  beforeEach(async () => {
    // Children first, so a failed previous run cannot block the reset.
    for (const id of [ID, OTHER]) {
      await db.delete(userTableRowHistory).where(eq(userTableRowHistory.tableId, id));
      await db.delete(userTableTriggers).where(eq(userTableTriggers.tableId, id));
      await db.delete(userTableImports).where(eq(userTableImports.tableId, id));
      await db.delete(userTableViews).where(eq(userTableViews.tableId, id));
      await db
        .delete(userTableRelationships)
        .where(or(eq(userTableRelationships.fromTableId, id), eq(userTableRelationships.toTableId, id)));
      await db.delete(tableDocumentInputs).where(eq(tableDocumentInputs.tableId, id));
      await db.delete(taskTableInputs).where(eq(taskTableInputs.tableId, id));
      await db.delete(workflowTableInputs).where(eq(workflowTableInputs.tableId, id));
      await db.delete(scheduleTableInputs).where(eq(scheduleTableInputs.tableId, id));
      await db.delete(userTableRows).where(eq(userTableRows.tableId, id));
      await db.delete(userTableColumns).where(eq(userTableColumns.tableId, id));
      await db.delete(userTables).where(eq(userTables.id, id));
    }
  });

  it("deletes a table that has a saved chart", async () => {
    // The narrowest reproduction, and the one users actually hit.
    await db.insert(userTables).values(table(ID));
    await db.insert(userTableViews).values({
      id: "test-delete-cascade-chart",
      tableId: ID,
      name: "Amounts",
      type: "chart",
      config: "{}",
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });

    await expect(deleteTable(ID)).resolves.toBeUndefined();

    expect(await db.select().from(userTables).where(eq(userTables.id, ID)).all()).toHaveLength(0);
    expect(
      await db.select().from(userTableViews).where(eq(userTableViews.tableId, ID)).all(),
    ).toHaveLength(0);
  });

  it("deletes a table that has one child of every kind", async () => {
    await db.insert(userTables).values(table(ID));
    await db.insert(userTables).values(table(OTHER));
    await db.insert(userTableColumns).values(column("test-delete-cascade-col", ID));
    await db.insert(userTableRows).values({
      id: "test-delete-cascade-row",
      tableId: ID,
      data: JSON.stringify({ title: "a" }),
      position: 0,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(userTableViews).values({
      id: "test-delete-cascade-view",
      tableId: ID,
      name: "Grid",
      type: "grid",
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(userTableTriggers).values({
      id: "test-delete-cascade-trigger",
      tableId: ID,
      name: "on add",
      triggerEvent: "row_added",
      actionType: "create_task",
      actionConfig: "{}",
      status: "active",
      fireCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(userTableRowHistory).values({
      id: "test-delete-cascade-history",
      rowId: "test-delete-cascade-row",
      tableId: ID,
      previousData: "{}",
      changedBy: "user",
      changeType: "update",
      createdAt: now,
    });

    // A relationship pointing AT the table under test, not away from it: this is
    // the direction a `fromTableId`-only cascade misses.
    await db.insert(userTableRelationships).values({
      id: "test-delete-cascade-rel",
      fromTableId: OTHER,
      fromColumn: "title",
      toTableId: ID,
      toColumn: "title",
      relationshipType: "one_to_one",
      createdAt: now,
    });

    await expect(deleteTable(ID)).resolves.toBeUndefined();

    expect(await db.select().from(userTables).where(eq(userTables.id, ID)).all()).toHaveLength(0);
    for (const [label, rows] of [
      ["columns", await db.select().from(userTableColumns).where(eq(userTableColumns.tableId, ID)).all()],
      ["rows", await db.select().from(userTableRows).where(eq(userTableRows.tableId, ID)).all()],
      ["views", await db.select().from(userTableViews).where(eq(userTableViews.tableId, ID)).all()],
      ["triggers", await db.select().from(userTableTriggers).where(eq(userTableTriggers.tableId, ID)).all()],
      ["history", await db.select().from(userTableRowHistory).where(eq(userTableRowHistory.tableId, ID)).all()],
      ["relationships", await db.select().from(userTableRelationships).where(eq(userTableRelationships.toTableId, ID)).all()],
    ] as const) {
      expect(rows, `${label} should be gone`).toHaveLength(0);
    }

    // The unrelated table is untouched — the cascade is scoped, not a wipe.
    expect(await db.select().from(userTables).where(eq(userTables.id, OTHER)).all()).toHaveLength(1);
  });

  it("leaves other tables' children alone", async () => {
    await db.insert(userTables).values(table(ID));
    await db.insert(userTables).values(table(OTHER));
    await db.insert(userTableColumns).values(column("test-delete-cascade-col-a", ID));
    await db.insert(userTableColumns).values(column("test-delete-cascade-col-b", OTHER));

    await deleteTable(ID);

    expect(
      await db.select().from(userTableColumns).where(eq(userTableColumns.tableId, OTHER)).all(),
    ).toHaveLength(1);
  });
});

/**
 * The junction tables are covered separately because each needs a real parent
 * row (a task, workflow, schedule or document) to satisfy its OTHER foreign
 * key, and creating those is noisy enough to obscure the assertion above.
 */
describe("deleteTable FK cascade — junction tables", () => {
  const ID = "test-delete-junction-table";
  const now = new Date();

  it("deletes a table linked to a task, workflow, schedule and document", async () => {
    await db.delete(taskTableInputs).where(eq(taskTableInputs.tableId, ID));
    await db.delete(workflowTableInputs).where(eq(workflowTableInputs.tableId, ID));
    await db.delete(scheduleTableInputs).where(eq(scheduleTableInputs.tableId, ID));
    await db.delete(tableDocumentInputs).where(eq(tableDocumentInputs.tableId, ID));
    await db.delete(userTables).where(eq(userTables.id, ID));

    await db.insert(userTables).values({
      id: ID,
      name: ID,
      columnSchema: "[]",
      rowCount: 0,
      source: "manual",
      createdAt: now,
      updatedAt: now,
    });

    const taskId = "test-delete-junction-task";
    const workflowId = "test-delete-junction-workflow";
    const scheduleId = "test-delete-junction-schedule";
    const documentId = "test-delete-junction-document";

    await db.delete(tasks).where(eq(tasks.id, taskId));
    await db.insert(tasks).values({
      id: taskId, title: "t", status: "queued", createdAt: now, updatedAt: now,
    });
    await db.delete(workflows).where(eq(workflows.id, workflowId));
    await db.insert(workflows).values({
      id: workflowId, name: "w", definition: "{}", status: "draft", createdAt: now, updatedAt: now,
    });
    await db.delete(schedules).where(eq(schedules.id, scheduleId));
    await db.insert(schedules).values({
      id: scheduleId, name: "s", type: "scheduled", prompt: "p", cronExpression: "0 9 * * *",
      status: "active", recurs: true, createdAt: now, updatedAt: now,
    });
    await db.delete(documents).where(eq(documents.id, documentId));
    await db.insert(documents).values({
      id: documentId, filename: "d.txt", originalName: "d.txt", mimeType: "text/plain",
      size: 1, storagePath: "/tmp/d.txt", createdAt: now, updatedAt: now,
    });

    await db.insert(taskTableInputs).values({ id: "test-dj-1", taskId, tableId: ID, createdAt: now });
    await db.insert(workflowTableInputs).values({ id: "test-dj-2", workflowId, tableId: ID, createdAt: now });
    await db.insert(scheduleTableInputs).values({ id: "test-dj-3", scheduleId, tableId: ID, createdAt: now });
    await db.insert(tableDocumentInputs).values({ id: "test-dj-4", tableId: ID, documentId, createdAt: now });

    await expect(deleteTable(ID)).resolves.toBeUndefined();
    expect(await db.select().from(userTables).where(eq(userTables.id, ID)).all()).toHaveLength(0);

    // Cleanup: the parents outlive the table on purpose, so remove them here.
    await db.delete(tasks).where(eq(tasks.id, taskId));
    await db.delete(workflows).where(eq(workflows.id, workflowId));
    await db.delete(schedules).where(eq(schedules.id, scheduleId));
    await db.delete(documents).where(eq(documents.id, documentId));
  });
});
