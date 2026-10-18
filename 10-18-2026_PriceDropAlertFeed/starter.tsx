import { useEffect, useState } from "react";

// --- Pricing feed ---------------------------------------------------------
// A tiny in-memory stand-in for the real-time pricing service. In
// production this wraps a WebSocket; here it's just enough to drive the
// banner below and let tests simulate price pushes without a real socket.

export type PriceUpdate = {
  listingId: string;
  price: number;
  previousPrice: number;
};

type UpdateListener = (update: PriceUpdate) => void;

export interface PriceConnection {
  readonly listingId: string;
  readonly status: "active" | "paused" | "closed";
  onUpdate(listener: UpdateListener): void;
  pause(): void;
  close(): void;
}

class PriceConnectionImpl implements PriceConnection {
  status: "active" | "paused" | "closed" = "active";
  private listener: UpdateListener | null = null;

  constructor(
    public readonly listingId: string,
    private readonly feed: PriceFeedImpl
  ) {}

  onUpdate(listener: UpdateListener): void {
    this.listener = listener;
  }

  pause(): void {
    // Quiets this connection without giving up its spot in the feed's
    // connection table - built for a "mute alerts for this car" toggle
    // on the listing card that never actually shipped.
    this.status = "paused";
  }

  close(): void {
    this.status = "closed";
    this.listener = null;
    this.feed._detach(this);
  }

  dispatch(update: PriceUpdate): void {
    this.listener?.(update);
  }
}

class PriceFeedImpl {
  private connections: PriceConnectionImpl[] = [];

  connect(listingId: string): PriceConnection {
    const connection = new PriceConnectionImpl(listingId, this);
    this.connections.push(connection);
    return connection;
  }

  publish(update: PriceUpdate): void {
    for (const connection of this.connections) {
      if (connection.listingId === update.listingId && connection.status === "active") {
        connection.dispatch(update);
      }
    }
  }

  /** Every connection the feed is still holding onto, paused or active. */
  trackedConnectionCount(): number {
    return this.connections.length;
  }

  _detach(connection: PriceConnectionImpl): void {
    this.connections = this.connections.filter((c) => c !== connection);
  }
}

export const priceFeed = new PriceFeedImpl();

// --- Banner ----------------------------------------------------------------

export function PriceAlertBanner({ listingId }: { listingId: string }) {
  const [alert, setAlert] = useState<PriceUpdate | null>(null);

  useEffect(() => {
    setAlert(null);

    const connection = priceFeed.connect(listingId);
    connection.onUpdate((update) => {
      if (update.price < update.previousPrice) {
        setAlert(update);
      }
    });

    return () => {
      // Stop this listing's alerts from firing once we've moved on.
      connection.pause();
    };
  }, [listingId]);

  if (!alert) {
    return null;
  }

  return (
    <div role="status">
      <span>
        Price drop on {alert.listingId}: ${alert.previousPrice} {"→"} ${alert.price}
      </span>
      <button onClick={() => setAlert(null)}>Dismiss</button>
    </div>
  );
}
