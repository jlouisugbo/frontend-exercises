// Live bid ticker for BrickLane's courthouse-auction floor. Bids come in
// over a push feed so bidders see updates the instant they land, but the
// feed can take a couple of seconds to confirm it's actually connected on
// a bad connection, and courthouse wifi is notoriously unreliable - so
// this falls back to polling the REST endpoint if the feed hasn't come up
// by the time anyone watching would notice a stale number. Shipped the
// week before the county's first tablet-only auction pilot.

import { useEffect, useState } from 'react';

export interface LotStatus {
  lotId: string;
  highestBid: number;
  bidderCount: number;
}

export interface AuctionFeedConnection {
  isConnected: () => boolean;
  disconnect: () => void;
}

export type SubscribeToFeed = (
  lotId: string,
  onUpdate: (status: LotStatus) => void
) => AuctionFeedConnection;

export type FetchLotStatus = (lotId: string) => Promise<LotStatus>;

export interface AuctionTickerProps {
  lotId: string;
  subscribeToFeed: SubscribeToFeed;
  fetchLotStatus: FetchLotStatus;
}

const FEED_GRACE_MS = 2000;
const FALLBACK_POLL_MS = 4000;

export function AuctionTicker({ lotId, subscribeToFeed, fetchLotStatus }: AuctionTickerProps) {
  const [status, setStatus] = useState<LotStatus | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    setStatus(null);
    setUsingFallback(false);

    const connection = subscribeToFeed(lotId, (update) => {
      setStatus(update);
    });

    const graceTimer = setTimeout(() => {
      if (!connection.isConnected()) {
        // The feed never came up in time for this lot - poll the REST
        // endpoint instead so bidders aren't staring at a blank ticker.
        setUsingFallback(true);
        const pollInterval = setInterval(() => {
          fetchLotStatus(lotId).then(setStatus);
        }, FALLBACK_POLL_MS);
      }
    }, FEED_GRACE_MS);

    return () => {
      connection.disconnect();
      clearTimeout(graceTimer);
    };
  }, [lotId, subscribeToFeed, fetchLotStatus]);

  return (
    <div data-testid="auction-ticker">
      <p data-testid="lot-id">{lotId}</p>
      <p data-testid="highest-bid">
        {status ? `$${status.highestBid.toLocaleString()}` : 'Waiting for bids…'}
      </p>
      <p data-testid="bidder-count">{status ? status.bidderCount : 0}</p>
      {usingFallback && <p data-testid="fallback-notice">Reconnecting…</p>}
    </div>
  );
}
