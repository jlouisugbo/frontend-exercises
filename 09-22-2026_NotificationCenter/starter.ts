type NotificationBase = {
  id: string;
  title: string;
  createdAt: string;
  read: boolean;
};

export type RawNotification = NotificationBase & {
  kind?: string | undefined;
  senderName?: string | undefined;
  conversationId?: string | undefined;
  resourceUrl?: string | undefined;
  urgent?: boolean | undefined;
  actionLabel?: string | undefined;
  actionUrl?: string | undefined;
  expiresAt?: string | undefined;
};

export type Notification =
  | (NotificationBase & {
      kind: "message";
      senderName: string;
      conversationId: string;
    })
  | (NotificationBase & {
      kind: "mention";
      senderName: string;
      resourceUrl?: string;
    })
  | (NotificationBase & {
      kind: "system";
      urgent?: boolean;
    })
  | (NotificationBase & {
      kind: "promotion";
      actionLabel?: string;
      actionUrl?: string;
      expiresAt?: string;
    });

export type NotificationRow = {
  id: string;
  label: string;
  destination: string | null;
  isUnread: boolean;
  isUrgent: boolean;
  createdAt: string;
};

export function buildNotificationRows(
  notifications: RawNotification[],
  nowIso: string,
): NotificationRow[] {
  return notifications
    .map(parseNotification)
    .filter((notification) => !isExpiredPromotion(notification, nowIso))
    .map(buildNotificationRow)
    .sort(compareNotificationRows);
}

function parseNotification(raw: RawNotification): Notification {
  const shared: NotificationBase = {
    id: raw.id,
    title: raw.title,
    createdAt: raw.createdAt,
    read: raw.read,
  };

  switch (raw.kind) {
    case "message": {
      if (typeof raw.senderName !== "string" || typeof raw.conversationId !== "string") {
        throw new Error("Invalid message notification");
      }

      return {
        ...shared,
        kind: "message",
        senderName: raw.senderName,
        conversationId: raw.conversationId,
      };
    }
    case "mention": {
      if (typeof raw.senderName !== "string") {
        throw new Error("Invalid mention notification");
      }

      return {
        ...shared,
        kind: "mention",
        senderName: raw.senderName,
        ...(raw.resourceUrl !== undefined ? { resourceUrl: raw.resourceUrl } : {}),
      };
    }
    case "system":
      return {
        ...shared,
        kind: "system",
        ...(raw.urgent !== undefined ? { urgent: raw.urgent } : {}),
      };
    case "promotion":
      return {
        ...shared,
        kind: "promotion",
        ...(raw.actionLabel !== undefined ? { actionLabel: raw.actionLabel } : {}),
        ...(raw.actionUrl !== undefined ? { actionUrl: raw.actionUrl } : {}),
        ...(raw.expiresAt !== undefined ? { expiresAt: raw.expiresAt } : {}),
      };
    default:
      throw new Error(`Unsupported notification kind: ${raw.kind}`);
  }
}

function isExpiredPromotion(notification: Notification, nowIso: string): boolean {
  return (
    notification.kind === "promotion" &&
    notification.expiresAt !== undefined &&
    notification.expiresAt <= nowIso
  );
}

function buildNotificationRow(notification: Notification): NotificationRow {
  const row = {
    id: notification.id,
    isUnread: !notification.read,
    createdAt: notification.createdAt,
  };

  switch (notification.kind) {
    case "message":
      return {
        ...row,
        label: `${notification.senderName}: ${notification.title}`,
        destination: `/messages/${notification.conversationId}`,
        isUrgent: false,
      };
    case "mention":
      return {
        ...row,
        label: `${notification.senderName} mentioned you: ${notification.title}`,
        destination: notification.resourceUrl ?? null,
        isUrgent: false,
      };
    case "system":
      return {
        ...row,
        label: notification.title,
        destination: null,
        isUrgent: notification.urgent === true,
      };
    case "promotion":
      return {
        ...row,
        label: notification.actionLabel
          ? `${notification.title} — ${notification.actionLabel}`
          : notification.title,
        destination: notification.actionUrl ?? null,
        isUrgent: false,
      };
    default: {
      const exhaustive: never = notification;
      throw new Error(`Unsupported notification kind: ${exhaustive}`);
    }
  }
}

function compareNotificationRows(left: NotificationRow, right: NotificationRow): number {
  if (left.isUrgent !== right.isUrgent) {
    return left.isUrgent ? -1 : 1;
  }

  if (right.createdAt !== left.createdAt) {
    return right.createdAt < left.createdAt ? -1 : 1;
  }

  return 0;
}
