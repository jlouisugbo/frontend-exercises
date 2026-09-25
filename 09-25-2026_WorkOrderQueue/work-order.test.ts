import { describe, expect, it } from "vitest";
import {
  dashboardOrders,
  exportOrders,
  type QueueOptions,
  type Viewer,
} from "./starter";

// ---- Public API seam: adapt calls here if you change function signatures. ----
const agent: Viewer = { id: "agent-1", role: "agent" };
const manager: Viewer = { id: "manager-1", role: "manager" };

function order(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "WO-1", title: "Replace battery", state: "open", priority: 2,
    assigneeId: "agent-1", updatedAt: "2026-09-25T10:00:00.000Z", ...overrides,
  };
}

function ids(payload: readonly unknown[], viewer: Viewer, options?: QueueOptions) {
  return {
    dashboard: dashboardOrders(payload, viewer, options).map((row) => row.id),
    export: exportOrders(payload, viewer, options).map((row) => row.orderId),
  };
}
// -----------------------------------------------------------------------------

describe("work order views", () => {
  it("shows an agent their assigned order in both views", () => {
    expect(ids([order()], agent)).toEqual({ dashboard: ["WO-1"], export: ["WO-1"] });
  });

  it("hides another agent's assigned order from both views", () => {
    expect(ids([order({ assigneeId: "agent-2" })], agent)).toEqual({ dashboard: [], export: [] });
  });

  it("lets an agent see unassigned orders", () => {
    expect(ids([order({ assigneeId: null })], agent)).toEqual({ dashboard: ["WO-1"], export: ["WO-1"] });
  });

  it("lets a manager see another agent's orders", () => {
    expect(ids([order({ assigneeId: "agent-2" })], manager)).toEqual({ dashboard: ["WO-1"], export: ["WO-1"] });
  });

  it("excludes closed orders by default", () => {
    expect(ids([order({ state: "closed" })], manager)).toEqual({ dashboard: [], export: [] });
  });

  it("includes closed orders when requested", () => {
    expect(ids([order({ state: "closed" })], agent, { includeClosed: true })).toEqual({ dashboard: ["WO-1"], export: ["WO-1"] });
  });

  it("normalizes the search query and matches a title", () => {
    expect(ids([order()], agent, { query: "  BATTERY  " })).toEqual({ dashboard: ["WO-1"], export: ["WO-1"] });
  });

  it("matches an order ID even when its title does not match", () => {
    expect(ids([order()], agent, { query: "wo-1" })).toEqual({ dashboard: ["WO-1"], export: ["WO-1"] });
  });

  it("orders most recently updated first", () => {
    const records = [order({ id: "older", updatedAt: "2026-09-24T10:00:00.000Z" }), order({ id: "newer" })];
    expect(ids(records, agent)).toEqual({ dashboard: ["newer", "older"], export: ["newer", "older"] });
  });

  it("breaks timestamp ties by ID", () => {
    expect(ids([order({ id: "B" }), order({ id: "A" })], agent)).toEqual({ dashboard: ["A", "B"], export: ["A", "B"] });
  });

  it("skips malformed records without hiding valid ones", () => {
    const records: unknown[] = [null, order({ priority: "high" }), order({ assigneeId: 10 }), order()];
    expect(ids(records, agent)).toEqual({ dashboard: ["WO-1"], export: ["WO-1"] });
  });

  it("does not mutate the API array while ordering results", () => {
    const records = Object.freeze([order({ id: "old", updatedAt: "2026-09-24T10:00:00.000Z" }), order({ id: "new" })]);
    ids(records, manager);
    expect(records.map((record) => record.id)).toEqual(["old", "new"]);
  });

  it("formats dashboard rows for display", () => {
    expect(dashboardOrders([order()], agent)).toEqual([{
      id: "WO-1", heading: "WO-1 · Replace battery", priorityLabel: "P2",
      updatedAt: "2026-09-25T10:00:00.000Z",
    }]);
  });

  it("formats export rows for downstream CSV writing", () => {
    expect(exportOrders([order({ assigneeId: null })], agent)).toEqual([{
      orderId: "WO-1", title: "Replace battery", state: "open", priority: 2,
      assignee: "Unassigned",
    }]);
  });
});
