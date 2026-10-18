import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PriceAlertBanner, priceFeed, type PriceUpdate } from './starter';

// --- Seam -------------------------------------------------------------
// The only place that knows how PriceAlertBanner gets rendered, how a
// price push gets simulated, and how the feed's connection bookkeeping
// gets inspected. If you refactor the banner or the feed internals,
// update only the helpers below - the test cases should keep working
// unchanged as long as PriceAlertBanner's props and rendered output
// stay the same shape.

let nextListingId = 1;
function uniqueListingId(): string {
  // Each test gets its own listing id so an earlier test's connections
  // never interfere with what a later test observes on the feed.
  return `car-${nextListingId++}`;
}

function renderBanner(listingId: string) {
  return render(<PriceAlertBanner listingId={listingId} />);
}

function pushUpdate(update: PriceUpdate) {
  // priceFeed delivers updates synchronously and outside any DOM event,
  // so the resulting setState needs to be wrapped for React to flush it
  // before the assertions below run.
  act(() => {
    priceFeed.publish(update);
  });
}

function connectDirectly(listingId: string) {
  return priceFeed.connect(listingId);
}

function trackedConnections() {
  return priceFeed.trackedConnectionCount();
}
// -------------------------------------------------------------------------

describe('PriceAlertBanner', () => {
  it('renders nothing before any price update arrives', () => {
    const listingId = uniqueListingId();
    renderBanner(listingId);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a banner when the price drops', () => {
    const listingId = uniqueListingId();
    renderBanner(listingId);

    pushUpdate({ listingId, price: 18500, previousPrice: 19900 });

    expect(screen.getByRole('status')).toHaveTextContent('$19900');
    expect(screen.getByRole('status')).toHaveTextContent('$18500');
  });

  it('does not show a banner when the price rises or stays the same', () => {
    const listingId = uniqueListingId();
    renderBanner(listingId);

    pushUpdate({ listingId, price: 19900, previousPrice: 19900 });
    pushUpdate({ listingId, price: 21000, previousPrice: 19900 });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('clears the banner when dismissed', () => {
    const listingId = uniqueListingId();
    renderBanner(listingId);

    pushUpdate({ listingId, price: 18500, previousPrice: 19900 });
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('ignores a price update meant for a different listing', () => {
    const listingId = uniqueListingId();
    const otherListingId = uniqueListingId();
    renderBanner(listingId);

    pushUpdate({ listingId: otherListingId, price: 100, previousPrice: 500 });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('clears any prior alert when switching to a different listing', () => {
    const firstListingId = uniqueListingId();
    const secondListingId = uniqueListingId();
    const { rerender } = renderBanner(firstListingId);

    pushUpdate({ listingId: firstListingId, price: 18500, previousPrice: 19900 });
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<PriceAlertBanner listingId={secondListingId} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('priceFeed connections', () => {
  it('starts a connection as active and delivers matching updates to its listener', () => {
    const listingId = uniqueListingId();
    const connection = connectDirectly(listingId);
    const received: PriceUpdate[] = [];
    connection.onUpdate((update) => received.push(update));

    pushUpdate({ listingId, price: 100, previousPrice: 200 });

    expect(received).toHaveLength(1);
  });

  it('does not throw when a connection with no listener receives an update', () => {
    const listingId = uniqueListingId();
    connectDirectly(listingId);

    expect(() => pushUpdate({ listingId, price: 100, previousPrice: 200 })).not.toThrow();
  });

  it('stops delivering updates to a paused connection', () => {
    const listingId = uniqueListingId();
    const connection = connectDirectly(listingId);
    const received: PriceUpdate[] = [];
    connection.onUpdate((update) => received.push(update));

    connection.pause();
    pushUpdate({ listingId, price: 100, previousPrice: 200 });

    expect(received).toHaveLength(0);
  });

  it('removes a connection from the feed once closed', () => {
    const listingId = uniqueListingId();
    const before = trackedConnections();
    const connection = connectDirectly(listingId);

    expect(trackedConnections()).toBe(before + 1);

    connection.close();

    expect(trackedConnections()).toBe(before);
  });

  it('keeps a paused connection tracked by the feed instead of releasing it', () => {
    const listingId = uniqueListingId();
    const before = trackedConnections();
    const connection = connectDirectly(listingId);

    connection.pause();

    expect(trackedConnections()).toBe(before + 1);
  });
});
