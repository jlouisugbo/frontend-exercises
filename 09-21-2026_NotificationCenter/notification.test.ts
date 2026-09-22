import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useNotificationCenter,
  addNotification,
  markAllRead,
  removeNotification,
  __resetForTests,
} from './starter';

// ---------------------------------------------------------------------------
// Update this if your refactored store/hook changes its construction
// interface (e.g. if `useNotificationCenter` starts taking arguments, or the
// store becomes something you instantiate rather than a module singleton).
function setup() {
  __resetForTests();
  return renderHook(() => useNotificationCenter());
}

// Update this if your refactored code changes its response shape (e.g. if
// `notifications` moves under a different key, or becomes a Map).
function currentNotifications(hook: ReturnType<typeof setup>) {
  return hook.result.current.notifications;
}
// ---------------------------------------------------------------------------

describe('useNotificationCenter', () => {
  beforeEach(() => {
    __resetForTests();
  });

  describe('addNotification', () => {
    it('adds a notification to the list', () => {
      const hook = setup();
      act(() => addNotification('Hello', 'info'));
      expect(currentNotifications(hook)).toHaveLength(1);
    });

    it('marks new notifications as unread', () => {
      const hook = setup();
      act(() => addNotification('Hello', 'info'));
      expect(currentNotifications(hook)[0].read).toBe(false);
    });

    it('stores the message text', () => {
      const hook = setup();
      act(() => addNotification('Hello', 'info'));
      expect(currentNotifications(hook)[0].message).toBe('Hello');
    });

    it('stores the given type', () => {
      const hook = setup();
      act(() => addNotification('Hello', 'error'));
      expect(currentNotifications(hook)[0].type).toBe('error');
    });

    it('appends rather than replacing existing notifications', () => {
      const hook = setup();
      act(() => addNotification('a', 'info'));
      act(() => addNotification('b', 'info'));
      expect(currentNotifications(hook)).toHaveLength(2);
    });
  });

  describe('markAllRead', () => {
    it('marks all notifications read when passed true', () => {
      const hook = setup();
      act(() => addNotification('a', 'info'));
      act(() => addNotification('b', 'info'));
      act(() => markAllRead(true));
      expect(currentNotifications(hook).every((n) => n.read)).toBe(true);
    });

    it('marks all notifications unread when passed false', () => {
      const hook = setup();
      act(() => addNotification('a', 'info'));
      act(() => markAllRead(true));
      act(() => markAllRead(false));
      expect(currentNotifications(hook).every((n) => n.read)).toBe(false);
    });
  });

  describe('removeNotification', () => {
    it('removes the matching notification by id', () => {
      const hook = setup();
      act(() => addNotification('a', 'info'));
      const id = currentNotifications(hook)[0].id;
      act(() => removeNotification(id));
      expect(currentNotifications(hook)).toHaveLength(0);
    });

    it('leaves non-matching notifications untouched', () => {
      const hook = setup();
      act(() => addNotification('a', 'info'));
      act(() => addNotification('b', 'info'));
      const idToRemove = currentNotifications(hook)[0].id;
      act(() => removeNotification(idToRemove));
      expect(currentNotifications(hook)[0].message).toBe('b');
    });
  });

  describe('rendering', () => {
    it('re-renders an already-mounted consumer when a notification is added', () => {
      const hook = setup();
      act(() => addNotification('a', 'info'));
      expect(currentNotifications(hook)).toHaveLength(1);
    });

    it('reflects state that was added before the consumer mounted', () => {
      __resetForTests();
      act(() => addNotification('early', 'info'));
      const hook = renderHook(() => useNotificationCenter());
      expect(currentNotifications(hook)).toHaveLength(1);
    });
  });
});
