export type Notification = NotificationBase & (NotificationType | { kind?: never })

type NotificationBase = {
  id: string;
  title: string;
  createdAt: string;
  read: boolean;
}

export type NotificationType = 
  | { kind: "message"; senderName: string; conversationId: string; }
  | { kind: "mention"; senderName: string; resourceUrl: string; }
  | { kind: "system"; urgent?: boolean }
  | { kind: "promotion"; actionLabel: string; actionUrl: string; expiresAt: string; }
  | { kind: "unknown"; [key: string]: unknown; }


export type NotificationRow = {
  id: string;
  label: string;
  destination: string | null;
  isUnread: boolean;
  isUrgent: boolean;
  createdAt: string;
};

export function buildNotificationRows(
  notifications: Notification[],
  nowIso: string,
): NotificationRow[] {
  let notificationRows: Array<NotificationRow> = [];
  for (const notification of notifications) {
    if (notification.kind == "promotion" && handleFilter(notification, nowIso)) continue;
    let notificationRow: NotificationRow;
    notificationRow = buildNotificationRow(notification);
    notificationRows.push(notificationRow)
  }
  return handleSort(notificationRows)

}

function handleFilter(notification: Extract<Notification, {kind: "promotion"}>, nowIso: string): boolean {
  return notification.expiresAt < nowIso
}

function buildNotificationRow(notification: Notification): NotificationRow {
    let label = notification.title;
    let destination: string | null = null;
    let isUrgent = false;

    if (notification.kind === "message") {
      label = `${notification.senderName}: ${notification.title}`;
      destination = `/messages/${notification.conversationId}`;
    } else if (notification.kind === "mention") {
      label = `${notification.senderName} mentioned you: ${notification.title}`;
      destination = notification.resourceUrl ?? null;
    } else if (notification.kind === "system") {
      isUrgent = notification.urgent === true;
    } else if (notification.kind === "promotion") {
      label = notification.actionLabel
        ? `${notification.title} — ${notification.actionLabel}`
        : notification.title;
      destination = notification.actionUrl ?? null;
    } else {
      throw new Error(`Unsupported notification kind: ${notification.kind}`);
    }

    return {
      id: notification.id,
      label,
      destination,
      isUnread: !notification.read,
      isUrgent,
      createdAt: notification.createdAt,
    }
}

function handleSort(notifications: NotificationRow[]): NotificationRow[] {
  return notifications.sort((left, right) => {
    if (left.isUrgent !== right.isUrgent) {
      return left.isUrgent ? -1 : 1;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}