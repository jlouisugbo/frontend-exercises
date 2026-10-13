import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  AuctionTicker,
  type AuctionFeedConnection,
  type LotStatus,
  type SubscribeToFeed,
  type FetchLotStatus,
} from './starter';

// --- Seam ---------------------------------------------------------------
// The only place that knows how AuctionTicker is constructed and how its
// feed/poll dependencies are wired in. If you refactor the component's
// internals (a custom hook, a ref-based connection manager, whatever),
// update ONLY the helpers in this block - the test cases below should
// keep working unchanged as long as the component's public props and
// rendered output stay the same shape.

function makeConnection(
  overrides: Partial<Pick<AuctionFeedConnection, 'isConnected'>> = {}
): AuctionFeedConnection & { disconnect: ReturnType<typeof vi.fn> } {
  return {
    isConnected: () => true,
    disconnect: vi.fn(),
    ...overrides,
  };
}

function makeStatus(overrides: Partial<LotStatus> = {}): LotStatus {
  return {
    lotId: 'lot-104',
    highestBid: 42000,
    bidderCount: 3,
    ...overrides,
  };
}

function renderTicker(props: {
  lotId?: string;
  subscribeToFeed: SubscribeToFeed;
  fetchLotStatus: FetchLotStatus;
}) {
  return render(
    <AuctionTicker
      lotId={props.lotId ?? 'lot-104'}
      subscribeToFeed={props.subscribeToFeed}
      fetchLotStatus={props.fetchLotStatus}
    />
  );
}

// subscribeToFeed stub whose connection reports `connected` for
// isConnected(), optionally pushing one status update synchronously
// through onUpdate as soon as it's called.
function feedThatConnects(connected: boolean, pushStatus?: LotStatus): SubscribeToFeed {
  return (_lotId, onUpdate) => {
    if (pushStatus) {
      onUpdate(pushStatus);
    }
    return makeConnection({ isConnected: () => connected });
  };
}

// Advances fake timers and flushes any promise callbacks a timer's
// scheduled work kicks off (e.g. a poll tick's fetchLotStatus().then(...)).
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const GRACE_MS = 2100; // just past the component's feed grace window
const POLL_MS = 4100; // just past one fallback poll tick
// -------------------------------------------------------------------------

describe('AuctionTicker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a waiting state and zero bidders before any status arrives', () => {
    const subscribeToFeed = feedThatConnects(true);
    const fetchLotStatus: FetchLotStatus = vi.fn(() => Promise.resolve(makeStatus()));

    renderTicker({ subscribeToFeed, fetchLotStatus });

    expect(screen.getByTestId('highest-bid')).toHaveTextContent('Waiting for bids…');
    expect(screen.getByTestId('bidder-count')).toHaveTextContent('0');
    expect(screen.queryByTestId('fallback-notice')).not.toBeInTheDocument();
  });

  it('renders a bid pushed by a feed that is already connected, with no fallback', async () => {
    const pushedStatus = makeStatus({ highestBid: 51000, bidderCount: 6 });
    const subscribeToFeed = feedThatConnects(true, pushedStatus);
    const fetchLotStatus: FetchLotStatus = vi.fn(() => Promise.resolve(makeStatus()));

    renderTicker({ subscribeToFeed, fetchLotStatus });
    await advance(GRACE_MS);

    expect(screen.getByTestId('highest-bid')).toHaveTextContent('$51,000');
    expect(screen.getByTestId('bidder-count')).toHaveTextContent('6');
    expect(screen.queryByTestId('fallback-notice')).not.toBeInTheDocument();
    expect(fetchLotStatus).not.toHaveBeenCalled();
  });

  it('falls back to polling the REST endpoint when the feed has not connected by the end of the grace window', async () => {
    const subscribeToFeed = feedThatConnects(false);
    const polledStatus = makeStatus({ highestBid: 38000, bidderCount: 2 });
    const fetchLotStatus: FetchLotStatus = vi.fn(() => Promise.resolve(polledStatus));

    renderTicker({ subscribeToFeed, fetchLotStatus });
    await advance(GRACE_MS);

    expect(screen.getByTestId('fallback-notice')).toBeInTheDocument();

    await advance(POLL_MS);

    expect(fetchLotStatus).toHaveBeenCalled();
    expect(screen.getByTestId('highest-bid')).toHaveTextContent('$38,000');
    expect(screen.getByTestId('bidder-count')).toHaveTextContent('2');
  });

  it('disconnects the feed connection when the lot changes', async () => {
    const connection = makeConnection({ isConnected: () => true });
    const subscribeToFeed: SubscribeToFeed = vi.fn(() => connection);
    const fetchLotStatus: FetchLotStatus = vi.fn(() => Promise.resolve(makeStatus()));

    const { rerender } = renderTicker({ lotId: 'lot-104', subscribeToFeed, fetchLotStatus });
    await advance(GRACE_MS);

    rerender(
      <AuctionTicker lotId="lot-205" subscribeToFeed={subscribeToFeed} fetchLotStatus={fetchLotStatus} />
    );

    expect(connection.disconnect).toHaveBeenCalledTimes(1);
  });

  it('resets to the waiting state and re-subscribes when the selected lot changes', async () => {
    const statusForA = makeStatus({ lotId: 'lot-104', highestBid: 51000, bidderCount: 6 });
    const calls: string[] = [];
    const subscribeToFeed: SubscribeToFeed = (lotId, onUpdate) => {
      calls.push(lotId);
      if (lotId === 'lot-104') {
        onUpdate(statusForA);
      }
      return makeConnection({ isConnected: () => true });
    };
    const fetchLotStatus: FetchLotStatus = vi.fn(() => Promise.resolve(makeStatus()));

    const { rerender } = renderTicker({ lotId: 'lot-104', subscribeToFeed, fetchLotStatus });
    await advance(GRACE_MS);
    expect(screen.getByTestId('highest-bid')).toHaveTextContent('$51,000');

    rerender(
      <AuctionTicker lotId="lot-205" subscribeToFeed={subscribeToFeed} fetchLotStatus={fetchLotStatus} />
    );

    expect(screen.getByTestId('lot-id')).toHaveTextContent('lot-205');
    expect(screen.getByTestId('highest-bid')).toHaveTextContent('Waiting for bids…');
    expect(calls).toEqual(['lot-104', 'lot-205']);
  });
});
