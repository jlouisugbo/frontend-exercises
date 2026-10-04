import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  RouteQuotePanel,
  type RouteQuote,
  type FetchRouteQuote,
} from './starter';

// --- Seam ---------------------------------------------------------------
// The only place that knows how RouteQuotePanel gets constructed, how an
// origin/destination gets picked, and how fetchRouteQuote results get back
// into it. If you refactor the internals (useRouteQuote, a request id, a
// ref, whatever you like), update ONLY the helpers in this block - the
// test cases below should keep working unchanged as long as the
// component's public props and rendered output stay the same shape.

const ORIGINS = ['JFK', 'ORD'];
const DESTINATIONS = ['LAX', 'SEA'];

function renderPanel(
  fetchRouteQuote: FetchRouteQuote,
  origins: string[] = ORIGINS,
  destinations: string[] = DESTINATIONS
) {
  return render(
    <RouteQuotePanel
      origins={origins}
      destinations={destinations}
      fetchRouteQuote={fetchRouteQuote}
    />
  );
}

function fetchQuoteResolvingWith(
  overrides: Partial<Omit<RouteQuote, 'origin' | 'destination'>> = {}
): FetchRouteQuote {
  return (origin, destination) =>
    Promise.resolve({
      origin,
      destination,
      airline: overrides.airline ?? 'Unknown Air',
      fare: overrides.fare ?? 0,
      cabin: overrides.cabin ?? 'Economy',
    });
}

function fetchQuoteRejectingWith(message: string): FetchRouteQuote {
  return () => Promise.reject(new Error(message));
}

function selectOrigin(value: string) {
  fireEvent.change(screen.getByTestId('origin-select'), { target: { value } });
}

function selectDestination(value: string) {
  fireEvent.change(screen.getByTestId('destination-select'), { target: { value } });
}
// -------------------------------------------------------------------------

describe('RouteQuotePanel', () => {
  it('shows an idle prompt and fetches nothing before both an origin and destination are picked', () => {
    const fetchRouteQuote = vi.fn();
    renderPanel(fetchRouteQuote);

    expect(screen.getByTestId('status-message')).toHaveTextContent('Pick an origin and destination');
    expect(fetchRouteQuote).not.toHaveBeenCalled();
  });

  it('stays idle when only an origin has been picked', () => {
    const fetchRouteQuote = vi.fn();
    renderPanel(fetchRouteQuote);

    selectOrigin('JFK');

    expect(screen.getByTestId('status-message')).toHaveTextContent('Pick an origin and destination');
    expect(fetchRouteQuote).not.toHaveBeenCalled();
  });

  it('shows a loading indicator once both an origin and destination are picked', async () => {
    const fetchRouteQuote: FetchRouteQuote = () => new Promise(() => {}); // never resolves
    renderPanel(fetchRouteQuote);

    selectOrigin('JFK');
    selectDestination('LAX');

    expect(await screen.findByTestId('status-message')).toHaveTextContent('Checking fares');
  });

  it('renders the fare once the quote resolves', async () => {
    const fetchRouteQuote = fetchQuoteResolvingWith({ airline: 'Pacifica Air', fare: 214.5, cabin: 'Economy' });
    renderPanel(fetchRouteQuote);

    selectOrigin('JFK');
    selectDestination('LAX');

    expect(await screen.findByTestId('quote-route')).toHaveTextContent('JFK → LAX');
    expect(screen.getByTestId('quote-fare')).toHaveTextContent('214.50');
    expect(screen.getByTestId('quote-airline')).toHaveTextContent('Pacifica Air');
  });

  it('shows an error message and no quote when the fetch rejects', async () => {
    const fetchRouteQuote = fetchQuoteRejectingWith('fares service unreachable');
    renderPanel(fetchRouteQuote);

    selectOrigin('JFK');
    selectDestination('LAX');

    expect(await screen.findByRole('alert')).toHaveTextContent('fares service unreachable');
    expect(screen.queryByTestId('quote-result')).not.toBeInTheDocument();
  });

  it("loads the new route's fare when the destination changes after a quote is already loaded", async () => {
    const fetchRouteQuote = vi.fn((origin: string, destination: string) =>
      Promise.resolve({
        origin,
        destination,
        airline: destination === 'LAX' ? 'Pacifica Air' : 'Cascade Wings',
        fare: destination === 'LAX' ? 214.5 : 189.0,
        cabin: 'Economy',
      })
    );
    renderPanel(fetchRouteQuote);

    selectOrigin('JFK');
    selectDestination('LAX');
    expect(await screen.findByTestId('quote-route')).toHaveTextContent('JFK → LAX');

    selectDestination('SEA');
    expect(await screen.findByTestId('quote-route')).toHaveTextContent('JFK → SEA');

    expect(fetchRouteQuote).toHaveBeenCalledTimes(2);
  });
});
