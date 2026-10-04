// Wanderlux agent console - the route-quote panel traveling agents glance at
// while they're on the phone with a customer, comparing fares between two
// cities before quoting a price. useRouteQuote used to be inline state in
// this component, but it got pulled into a hook last sprint since the new
// round-trip panel needs the same fetch-on-route-change logic.

import { useEffect, useState } from 'react';

export interface RouteQuote {
  origin: string;
  destination: string;
  airline: string;
  fare: number;
  cabin: string;
}

export type FetchRouteQuote = (origin: string, destination: string) => Promise<RouteQuote>;

export type QuoteStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface UseRouteQuoteResult {
  quote: RouteQuote | null;
  status: QuoteStatus;
  errorMessage: string | null;
}

// Shared by the one-way and (soon) round-trip panels so both get fare
// lookups without duplicating the fetch wiring.
export function useRouteQuote(
  origin: string,
  destination: string,
  fetchRouteQuote: FetchRouteQuote
): UseRouteQuoteResult {
  const [quote, setQuote] = useState<RouteQuote | null>(null);
  const [status, setStatus] = useState<QuoteStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!origin || !destination) {
      setStatus('idle');
      setQuote(null);
      setErrorMessage(null);
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    fetchRouteQuote(origin, destination)
      .then((result) => {
        setQuote(result);
        setStatus('loaded');
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setStatus('error');
        setErrorMessage(message);
      });
  }, [origin, destination, fetchRouteQuote]);

  return { quote, status, errorMessage };
}

export interface RouteQuotePanelProps {
  origins: string[];
  destinations: string[];
  fetchRouteQuote: FetchRouteQuote;
}

export function RouteQuotePanel({ origins, destinations, fetchRouteQuote }: RouteQuotePanelProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const { quote, status, errorMessage } = useRouteQuote(origin, destination, fetchRouteQuote);

  return (
    <div data-testid="route-panel">
      <label>
        Origin
        <select
          data-testid="origin-select"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        >
          <option value="">Select origin</option>
          {origins.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>

      <label>
        Destination
        <select
          data-testid="destination-select"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        >
          <option value="">Select destination</option>
          {destinations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      {status === 'idle' && (
        <p data-testid="status-message">Pick an origin and destination to see a fare.</p>
      )}

      {status === 'loading' && (
        <p data-testid="status-message" role="status">
          Checking fares…
        </p>
      )}

      {status === 'error' && (
        <p data-testid="status-message" role="alert">
          Couldn't fetch a quote: {errorMessage}
        </p>
      )}

      {status === 'loaded' && quote && (
        <div data-testid="quote-result">
          <p data-testid="quote-route">
            {quote.origin} → {quote.destination}
          </p>
          <p data-testid="quote-fare">${quote.fare.toFixed(2)}</p>
          <p data-testid="quote-airline">
            {quote.airline} · {quote.cabin}
          </p>
        </div>
      )}
    </div>
  );
}
