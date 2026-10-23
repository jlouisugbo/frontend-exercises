import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useDriverLocationFeed,
  rideLocationFeed,
  type ConnectFn,
  type LocationUpdate,
} from "./useDriverLocationFeed";

// ---- Test seam ------------------------------------------------------------
// Builds a fake location feed and wraps renderHook so every test drives the
// hook through the same fake `connect`, the way the dispatch backend team's
// real client gets swapped in production. This shape (createTestFeed +
// renderFeed) is expected to change if the hook's connect signature changes
// during a refactor - don't build a fake feed or call renderHook directly,
// inline, anywhere else in this file.
interface FakeConnection {
  connectionId: string;
  disconnect: ReturnType<typeof vi.fn>;
  emitUpdate: (update: LocationUpdate) => void;
  emitDrop: () => void;
}

function createTestFeed() {
  const connections: FakeConnection[] = [];
  let seq = 0;

  const connect: ConnectFn = (_rideId, onUpdate, onDrop) => {
    seq += 1;
    const connectionId = `test-conn-${seq}`;
    const disconnect = vi.fn();
    connections.push({ connectionId, disconnect, emitUpdate: onUpdate, emitDrop: onDrop });
    return { connectionId, disconnect };
  };

  return { connect, connections };
}

function renderFeed(initialRideId: string | null = "ride-1") {
  const { connect, connections } = createTestFeed();
  const utils = renderHook(
    ({ rideId }: { rideId: string | null }) => useDriverLocationFeed(rideId, { connect }),
    { initialProps: { rideId: initialRideId } }
  );
  return { ...utils, connections };
}
// ----------------------------------------------------------------------------

describe("useDriverLocationFeed", () => {
  it("does not connect when there is no ride selected", () => {
    const { result, connections } = renderFeed(null);

    expect(connections).toHaveLength(0);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastUpdate).toBeNull();
  });

  it("connects to the feed for the given ride", () => {
    const { result, connections } = renderFeed("ride-1");

    expect(connections).toHaveLength(1);
    expect(result.current.isConnected).toBe(true);
  });

  it("stores the latest location update", () => {
    const { result, connections } = renderFeed("ride-1");

    act(() => {
      connections[0].emitUpdate({ lat: 40.7, lng: -74.0, recordedAt: 1000 });
    });

    expect(result.current.lastUpdate).toEqual({ lat: 40.7, lng: -74.0, recordedAt: 1000 });
  });

  it("reconnects automatically when the feed drops mid-ride", () => {
    const { result, connections } = renderFeed("ride-1");

    act(() => {
      connections[0].emitDrop();
    });

    expect(connections).toHaveLength(2);
    expect(result.current.isConnected).toBe(true);
  });

  it("keeps delivering updates through a reconnect", () => {
    const { result, connections } = renderFeed("ride-1");

    act(() => {
      connections[0].emitDrop();
    });
    act(() => {
      connections[1].emitUpdate({ lat: 41.0, lng: -73.9, recordedAt: 2000 });
    });

    expect(result.current.lastUpdate).toEqual({ lat: 41.0, lng: -73.9, recordedAt: 2000 });
  });

  it("tears down the old connection and opens a new one when the ride changes", () => {
    const { connections, rerender } = renderFeed("ride-1");

    rerender({ rideId: "ride-2" });

    expect(connections[0].disconnect).toHaveBeenCalledTimes(1);
    expect(connections).toHaveLength(2);
  });

  it("disconnects and clears state when the ride is cleared", () => {
    const { result, connections, rerender } = renderFeed("ride-1");

    rerender({ rideId: null });

    expect(connections[0].disconnect).toHaveBeenCalledTimes(1);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastUpdate).toBeNull();
  });

  it("disconnects the active connection on unmount", () => {
    const { connections, unmount } = renderFeed("ride-1");

    unmount();

    expect(connections[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it("falls back to the shared feed client when no override is given", () => {
    const connectSpy = vi
      .spyOn(rideLocationFeed, "connect")
      .mockImplementation((_rideId, _onUpdate, _onDrop) => ({
        connectionId: "default-conn",
        disconnect: vi.fn(),
      }));

    const { result } = renderHook(() => useDriverLocationFeed("ride-1"));

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(result.current.isConnected).toBe(true);

    connectSpy.mockRestore();
  });
});
