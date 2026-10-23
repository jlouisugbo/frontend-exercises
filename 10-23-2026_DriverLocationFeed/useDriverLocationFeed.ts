import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Talks to the location-streaming backend. A couple of other dispatch
// screens already import `rideLocationFeed` directly, so this hook only
// takes a `connect` override so tests can swap it out - real callers just
// use the default.
// ---------------------------------------------------------------------------

export interface LocationUpdate {
  lat: number;
  lng: number;
  recordedAt: number;
}

export interface FeedConnection {
  connectionId: string;
  disconnect: () => void;
}

export type ConnectFn = (
  rideId: string,
  onUpdate: (update: LocationUpdate) => void,
  onDrop: () => void
) => FeedConnection;

let connectionSeq = 0;

export const rideLocationFeed: { connect: ConnectFn } = {
  connect: (_rideId, _onUpdate, _onDrop) => {
    connectionSeq += 1;
    return {
      connectionId: `conn-${connectionSeq}`,
      disconnect: () => {},
    };
  },
};

export interface UseDriverLocationFeedOptions {
  connect?: ConnectFn;
}

export interface DriverLocationFeedState {
  isConnected: boolean;
  lastUpdate: LocationUpdate | null;
}

/**
 * Keeps a live driver-location subscription open for whichever ride is
 * currently selected on the dispatch map. The feed occasionally "drops"
 * mid-ride (driver's phone loses signal, app backgrounds, a cell-tower
 * handoff) - when that happens we grab a fresh connection automatically so
 * the dispatcher's map never just freezes on a stale pin.
 */
export function useDriverLocationFeed(
  rideId: string | null,
  options: UseDriverLocationFeedOptions = {}
): DriverLocationFeedState {
  const connect = options.connect ?? rideLocationFeed.connect;
  const connectionRef = useRef<FeedConnection | null>(null);
  const [state, setState] = useState<DriverLocationFeedState>({
    isConnected: false,
    lastUpdate: null,
  });

  useEffect(() => {
    if (!rideId) {
      setState({ isConnected: false, lastUpdate: null });
      return;
    }

    const handleUpdate = (update: LocationUpdate) => {
      setState((prev) => ({ ...prev, lastUpdate: update }));
    };

    const handleDrop = () => {
      // Signal lost mid-ride - grab a fresh connection so the map keeps
      // moving instead of sitting on a stale pin until the dispatcher
      // notices and reloads.
      setState((prev) => ({ ...prev, isConnected: false }));
      const next = connect(rideId, handleUpdate, handleDrop);
      connectionRef.current = next;
      setState((prev) => ({ ...prev, isConnected: true }));
    };

    const connection = connect(rideId, handleUpdate, handleDrop);
    connectionRef.current = connection;
    setState({ isConnected: true, lastUpdate: null });

    return () => {
      connectionRef.current?.disconnect();
      connectionRef.current = null;
    };
  }, [rideId, connect]);

  return state;
}
