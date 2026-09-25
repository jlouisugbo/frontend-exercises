import { describe, expect, it } from "vitest";
import {
  buildNotificationRows,
  type NotificationRow,
  type RawNotification,
} from "./starter";

// -----------------------------------------------------------------------------
// This helper is expected to change as you refactor. Update it to match your
// new boundary and public API. Tests below should retain the same behavior.
const buildRows = (
  notifications: RawNotification[],
  nowIso = "2026-09-22T12:00:00.000Z",
): NotificationRow[] => buildNotificationRows(notifications, nowIso);

const base = (overrides: Partial<RawNotification> = {}): RawNotification => ({
  id: "notification-1",
  kind: "system",
  title: "Scheduled maintenance",
  createdAt: "2026-09-22T10:00:00.000Z",
  read: false,
  ...overrides,
});
// -----------------------------------------------------------------------------

describe("buildNotificationRows", () => {
  it("formats a message and links to its conversation", () => {
    const [row] = buildRows([
      base({
        kind: "message",
        senderName: "Maya",
        conversationId: "conversation-42",
        title: "Can you review this?",
      }),
    ]);

    expect(row).toMatchObject({
      label: "Maya: Can you review this?",
      destination: "/messages/conversation-42",
    });
  });

  it("formats a mention and uses its resource URL", () => {
    const [row] = buildRows([
      base({
        kind: "mention",
        senderName: "Andre",
        resourceUrl: "/projects/7/comments/3",
        title: "Notification API",
      }),
    ]);

    expect(row).toMatchObject({
      label: "Andre mentioned you: Notification API",
      destination: "/projects/7/comments/3",
    });
  });

  it("keeps a mention without a resource URL non-navigable", () => {
    const [row] = buildRows([base({ kind: "mention", senderName: "Andre" })]);

    expect(row.destination).toBeNull();
  });

  it("marks urgent system notifications", () => {
    const [row] = buildRows([base({ kind: "system", urgent: true })]);

    expect(row.isUrgent).toBe(true);
  });

  it("leaves ordinary system notifications non-urgent", () => {
    const [row] = buildRows([base({ kind: "system", urgent: false })]);

    expect(row.isUrgent).toBe(false);
  });

  it("adds a promotion action label and destination", () => {
    const [row] = buildRows([
      base({
        kind: "promotion",
        title: "Annual plan sale",
        actionLabel: "Save 20%",
        actionUrl: "/billing",
        expiresAt: "2026-09-23T00:00:00.000Z",
      }),
    ]);

    expect(row).toMatchObject({
      label: "Annual plan sale — Save 20%",
      destination: "/billing",
    });
  });

  it("keeps a promotion without an action non-navigable", () => {
    const [row] = buildRows([
      base({ kind: "promotion", title: "Welcome offer" }),
    ]);

    expect(row).toMatchObject({
      label: "Welcome offer",
      destination: null,
    });
  });

  it("removes expired promotions", () => {
    const rows = buildRows([
      base({
        kind: "promotion",
        expiresAt: "2026-09-22T11:59:59.000Z",
      }),
    ]);

    expect(rows).toHaveLength(0);
  });

  it("keeps promotions whose expiration is in the future", () => {
    const rows = buildRows([
      base({
        kind: "promotion",
        expiresAt: "2026-09-22T12:00:01.000Z",
      }),
    ]);

    expect(rows).toHaveLength(1);
  });

  it("maps read state to unread presentation state", () => {
    const [row] = buildRows([base({ read: true })]);

    expect(row.isUnread).toBe(false);
  });

  it("sorts urgent rows before newer non-urgent rows", () => {
    const rows = buildRows([
      base({ id: "newer", createdAt: "2026-09-22T11:00:00.000Z" }),
      base({
        id: "urgent",
        urgent: true,
        createdAt: "2026-09-22T09:00:00.000Z",
      }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["urgent", "newer"]);
  });

  it("sorts rows of equal urgency newest first", () => {
    const rows = buildRows([
      base({ id: "older", createdAt: "2026-09-22T09:00:00.000Z" }),
      base({ id: "newer", createdAt: "2026-09-22T11:00:00.000Z" }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["newer", "older"]);
  });

  it("rejects unknown notification kinds", () => {
    expect(() => buildRows([base({ kind: "mystery" })])).toThrow(
      "Unsupported notification kind: mystery",
    );
  });
});
