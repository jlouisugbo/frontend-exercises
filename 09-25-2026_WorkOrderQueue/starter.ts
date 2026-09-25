export type Viewer = { id: string; role: "agent" | "manager" };
export type QueueOptions = { query?: string; includeClosed?: boolean };

export type DashboardRow = {
  id: string;
  heading: string;
  priorityLabel: string;
  updatedAt: string;
};

export type ExportRow = {
  orderId: string;
  title: string;
  state: "open" | "closed";
  priority: number;
  assignee: string;
};

type WorkOrder = {
  id: string;
  title: string;
  state: "open" | "closed";
  priority: 1 | 2 | 3;
  assigneeId: string | null;
  updatedAt: string;
};

// The API adapter delivers untrusted records; callers must not cast them to WorkOrder.
function readOrder(input: unknown): WorkOrder | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
  const value: Record<string, unknown> = { ...input };
  const { id, title, state, priority, assigneeId, updatedAt } = value;
  if (
    typeof id !== "string" ||
    typeof title !== "string" ||
    (state !== "open" && state !== "closed") ||
    (priority !== 1 && priority !== 2 && priority !== 3) ||
    (assigneeId !== null && typeof assigneeId !== "string") ||
    typeof updatedAt !== "string"
  ) return null;
  return { id, title, state, priority, assigneeId, updatedAt };
}

export function dashboardOrders(
  payload: readonly unknown[],
  viewer: Viewer,
  options: QueueOptions = {},
): DashboardRow[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  const rows: WorkOrder[] = [];

  for (const input of payload) {
    const order = readOrder(input);
    if (order === null) continue;
    if (viewer.role === "agent" && order.assigneeId !== viewer.id && order.assigneeId !== null) continue;
    if (!options.includeClosed && order.state === "closed") continue;
    if (query && !`${order.id} ${order.title}`.toLowerCase().includes(query)) continue;
    rows.push(order);
  }

  rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  return rows.map((order) => ({
    id: order.id,
    heading: `${order.id} · ${order.title}`,
    priorityLabel: `P${order.priority}`,
    updatedAt: order.updatedAt,
  }));
}

export function exportOrders(
  payload: readonly unknown[],
  viewer: Viewer,
  options: QueueOptions = {},
): ExportRow[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  const rows: WorkOrder[] = [];

  for (const input of payload) {
    const order = readOrder(input);
    if (order === null) continue;
    if (order.assigneeId !== null && viewer.role !== "manager" && order.assigneeId !== viewer.id) continue;
    if (order.state === "closed" && !options.includeClosed) continue;
    if (query !== "" && !order.title.toLowerCase().includes(query) && !order.id.toLowerCase().includes(query)) continue;
    rows.push(order);
  }

  rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  return rows.map((order) => ({
    orderId: order.id,
    title: order.title,
    state: order.state,
    priority: order.priority,
    assignee: order.assigneeId ?? "Unassigned",
  }));
}
