// A shared notification center used across the app: a bell icon shows an
// unread count, a dropdown lists recent notifications, and various features
// call `addNotification` when something happens (a comment, an upload
// finishing, etc). It's been working fine in the demo page.
//
// NOTE: this file intentionally has no JSX. `useNotificationCenter` is a
// plain hook that any component (toast list, bell icon, badge) can consume.

import { useSyncExternalStore } from 'react';

type notificationType = 'info' | 'success' | 'error' | 'warning';
export type Notification = {
  id: string;
  message: string;
  type: notificationType;
  read: boolean;
  createdAt: number;
};

let notifications: Notification[] = [];
let listeners: Array<() => void> = [];

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function addNotification(message: string, type: notificationType) {
  const notification: Notification = {
    id: Math.random().toString(36).slice(2),
    message,
    type,
    read: false,
    createdAt: Date.now(),
  };
  notifications.push(notification);
  notifyListeners();
}

export function markAllRead(read: boolean) {
  notifications = notifications.map((n) => ({ ...n, read }));
  notifyListeners();
}

export function removeNotification(id: string) {
  notifications = notifications.filter((n) => n.id !== id);
  notifyListeners();
}

export function getNotifications(): Notification[] {
  return notifications;
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  }
}

/**
 * Hook every notification-related component uses to read the current list
 * and re-render when it changes.
 */
export function useNotificationCenter() {
  const notifications = useSyncExternalStore(subscribe, getNotifications)
  return {
    notifications,
    addNotification,
    markAllRead,
    removeNotification,
  };
}

// --- Test-only helpers -----------------------------------------------------
// Not part of the public API. Exported so tests can reset/introspect module
// state between examples. Update these if your refactor changes how state
// is stored (e.g. if you move off a module-level array).

export function __resetForTests() {
  notifications = [];
  listeners = [];
}
