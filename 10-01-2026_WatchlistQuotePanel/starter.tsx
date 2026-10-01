// Live quote panel for the trading desk's watchlist sidebar.
// Renders whatever symbol is currently selected in the watchlist. Traders
// click fast when they're scanning the list before the open, so this needs
// to stay responsive - no spinners lingering longer than they have to.

import { useEffect, useState } from 'react';

export interface Quote {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
  asOf: string; // ISO timestamp from the quote feed
}

export type FetchQuote = (symbol: string) => Promise<Quote>;

export interface QuotePanelProps {
  symbol: string;
  displayName: string;
  fetchQuote: FetchQuote;
}

const SIGNIFICANT_MOVE_PERCENT = 5;

export function QuotePanel({ symbol, displayName, fetchQuote }: QuotePanelProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    fetchQuote(symbol)
      .then((nextQuote) => {
        setQuote(nextQuote);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setIsLoading(false);
      });
    // Re-fetch whenever the watchlist selection changes.
  }, [symbol, fetchQuote]);

  if (error) {
    return (
      <div role="alert" data-testid="quote-error">
        Couldn't load quote for {displayName}: {error}
      </div>
    );
  }

  if (isLoading && !quote) {
    return <div role="status">Loading quote for {displayName}…</div>;
  }

  if (!quote) {
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
