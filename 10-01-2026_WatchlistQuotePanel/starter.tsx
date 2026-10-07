// Live quote panel for the trading desk's watchlist sidebar.
// Renders whatever symbol is currently selected in the watchlist. Traders
// click fast when they're scanning the list before the open, so this needs
// to stay responsive - no spinners lingering longer than they have to.

import { useEffect, useRef, useState } from 'react';

export interface Quote {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
  asOf: string; // ISO timestamp from the quote feed
}

export type FetchQuote = (symbol: string, abort: AbortController) => Promise<Quote>;

export interface QuotePanelProps {
  symbol: string;
  displayName: string;
  fetchQuote: FetchQuote;
}

const SIGNIFICANT_MOVE_PERCENT = 5;
const QUOTE_REFRESH_INTERVAL_MS = 2000;

function useQuote(symbol: string, fetchQuote: FetchQuote) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchQuoteRef = useRef(fetchQuote);

  useEffect(() => {
    fetchQuoteRef.current = fetchQuote;
  }, [fetchQuote]);

  useEffect(() => {
    setQuote(null);
    setIsLoading(true);
    setError(null);

    let active = true;
    let inFlightAbort: AbortController | null = null;

    const load = (initial: boolean) => {
      inFlightAbort?.abort();
      const abort = new AbortController();
      inFlightAbort = abort;

      fetchQuoteRef.current(symbol, abort)
        .then((nextQuote) => {
          if (!active || abort.signal.aborted) return;
          if (nextQuote.symbol !== symbol) return;
          setQuote(nextQuote);
          setError(null);
          if (initial) setIsLoading(false);
        })
        .catch((err: unknown) => {
          if (!active || abort.signal.aborted) return;
          const message = err instanceof Error ? err.message : 'Unknown error';
          if (initial) {
            setError(message);
            setIsLoading(false);
          }
        });
    };

    load(true);

    const intervalId = window.setInterval(() => load(false), QUOTE_REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      inFlightAbort?.abort();
      window.clearInterval(intervalId);
    };
  }, [symbol]);

  return { quote, isLoading, error };
}

export function QuotePanel({ symbol, displayName, fetchQuote }: QuotePanelProps) {
  const { quote, isLoading, error } = useQuote(symbol, fetchQuote);

  if (error && !quote) {
    return (
      <div role="alert" data-testid="quote-error">
        Couldn't load quote for {displayName}: {error}
      </div>
    );
  }

  if (isLoading && !quote) {
    return <div role="status">Loading quote for {displayName}…</div>;
  }

  if (!quote || quote.symbol !== symbol) {
    return null;
  }

  const isBigMover = Math.abs(quote.changePercent) >= SIGNIFICANT_MOVE_PERCENT;

  return (
    <section
      data-testid="quote-panel"
      className={isBigMover ? 'quote-panel quote-panel--big-mover' : 'quote-panel'}
    >
      <h2>
        {displayName} ({quote.symbol})
      </h2>
      <dl>
        <dt>Price</dt>
        <dd data-testid="price">${quote.price.toFixed(2)}</dd>
        <dt>Change</dt>
        <dd data-testid="change">{quote.changePercent.toFixed(2)}%</dd>
        <dt>Volume</dt>
        <dd data-testid="volume">{quote.volume.toLocaleString()}</dd>
      </dl>
      {isBigMover && (
        <p role="alert" data-testid="big-mover-badge">
          Significant price move
        </p>
      )}
    </section>
  );
}
