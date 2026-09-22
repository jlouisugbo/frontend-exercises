export type RawNotification = {
  id: string;
  kind: string;
  title: string;
  createdAt: string;
  read: boolean;
  senderName?: string;
  conversationId?: string;
  resourceUrl?: string;
  urgent?: boolean;
  actionLabel?: string;
  actionUrl?: string;
  expiresAt?: string;
};

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
    .filter((notification) => {
      if (notification.kind === "promotion" && notification.expiresAt) {
        return notification.expiresAt > nowIso;
      }

      return true;
    })
    .map((notification) => {
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
      };
    })
    .sort((left, right) => {
      if (left.isUrgent !== right.isUrgent) {
        return left.isUrgent ? -1 : 1;
      }

      return right.createdAt.localeCompare(left.createdAt);
    });
}
