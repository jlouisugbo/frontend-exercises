import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QuotePanel, type Quote, type FetchQuote } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how QuotePanel is constructed and how
// its props are wired to a quote-fetching function. If you refactor the
// component's internals (a custom hook, a reducer, an AbortController-based
// fetch wrapper, whatever), update ONLY the helpers in this block - the
// test cases below should keep working unchanged as long as the
// component's public props and rendered output stay the same shape.
function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    symbol: 'ACME',
    price: 142.5,
    changePercent: 1.2,
    volume: 1_204_300,
    asOf: '2026-10-01T13:30:00.000Z',
    ...overrides,
  };
}

function renderPanel(props: {
  symbol?: string;
  displayName?: string;
  fetchQuote: FetchQuote;
}) {
  return render(
    <QuotePanel
      symbol={props.symbol ?? 'ACME'}
      displayName={props.displayName ?? 'Acme Corp'}
      fetchQuote={props.fetchQuote}
    />
  );
}

function fetchQuoteResolvingWith(quote: Quote): FetchQuote {
  return () => Promise.resolve(quote);
}

function fetchQuoteRejectingWith(message: string): FetchQuote {
  return () => Promise.reject(new Error(message));
}
// -------------------------------------------------------------------------

describe('QuotePanel', () => {
  it('shows a loading state before the quote arrives', () => {
    const fetchQuote: FetchQuote = () => new Promise(() => {}); // never resolves

    renderPanel({ fetchQuote });

    expect(screen.getByRole('status')).toHaveTextContent('Loading quote for Acme Corp');
  });

  it('renders the quote once the fetch resolves', async () => {
    const fetchQuote = fetchQuoteResolvingWith(
      makeQuote({ price: 142.5, changePercent: 1.2, volume: 1_204_300 })
    );

    renderPanel({ fetchQuote });

    const panel = await screen.findByTestId('quote-panel');
    expect(within(panel).getByTestId('price')).toHaveTextContent('$142.50');
    expect(within(panel).getByTestId('change')).toHaveTextContent('1.20%');
    expect(within(panel).getByTestId('volume')).toHaveTextContent('1,204,300');
    expect(panel.className).not.toContain('big-mover');
    expect(screen.queryByTestId('big-mover-badge')).not.toBeInTheDocument();
  });

  it('flags the panel a big mover when change reaches the positive threshold', async () => {
    const fetchQuote = fetchQuoteResolvingWith(makeQuote({ changePercent: 5 }));

    renderPanel({ fetchQuote });

    const panel = await screen.findByTestId('quote-panel');
    expect(panel.className).toContain('big-mover');
    expect(screen.getByTestId('big-mover-badge')).toBeInTheDocument();
  });

  it('flags the panel a big mover when change reaches the negative threshold', async () => {
    const fetchQuote = fetchQuoteResolvingWith(makeQuote({ changePercent: -5 }));

    renderPanel({ fetchQuote });

    const panel = await screen.findByTestId('quote-panel');
    expect(panel.className).toContain('big-mover');
    expect(screen.getByTestId('big-mover-badge')).toBeInTheDocument();
  });

  it('does not flag the panel a big mover when change is just inside the threshold', async () => {
    const fetchQuote = fetchQuoteResolvingWith(makeQuote({ changePercent: 4.9 }));

    renderPanel({ fetchQuote });

    const panel = await screen.findByTestId('quote-panel');
    expect(panel.className).not.toContain('big-mover');
    expect(screen.queryByTestId('big-mover-badge')).not.toBeInTheDocument();
  });

  it('shows an error message when the fetch rejects', async () => {
    const fetchQuote = fetchQuoteRejectingWith('quote feed unavailable');

    renderPanel({ fetchQuote });

    const alert = await screen.findByTestId('quote-error');
    expect(alert).toHaveTextContent('quote feed unavailable');
  });

  it('re-fetches with the newly selected symbol when the watchlist selection changes', async () => {
    const calls: string[] = [];
    const fetchQuote: FetchQuote = (symbol) => {
      calls.push(symbol);
      return Promise.resolve(makeQuote({ symbol }));
    };

    const { rerender } = renderPanel({ fetchQuote, symbol: 'ACME' });
    await screen.findByTestId('quote-panel');

    rerender(
      <QuotePanel symbol="GLBX" displayName="Globex Corp" fetchQuote={fetchQuote} />
    );
    await screen.findByText('Globex Corp (GLBX)');

    expect(calls).toEqual(['ACME', 'GLBX']);
  });
});
