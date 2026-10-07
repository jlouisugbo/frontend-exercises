import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductGrid, type Product } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how ProductGrid is constructed and how
// its product list is built. If you refactor the internals (memoized
// callbacks, a different filtering approach, whatever), update ONLY the
// helpers in this block - the test cases below should keep working
// unchanged as long as the component's public props and rendered output
// stay the same shape.

function makeProducts(): Product[] {
  return [
    { id: 'p1', name: 'Trail Running Shoes', priceCents: 8999 },
    { id: 'p2', name: 'Trail Running Socks', priceCents: 1299 },
    { id: 'p3', name: 'Road Bike Helmet', priceCents: 12999 },
  ];
}

function renderGrid(overrides: {
  products?: Product[];
  onAddToCart?: (id: string) => void;
}) {
  const onAddToCart = overrides.onAddToCart ?? vi.fn();
  const utils = render(
    <ProductGrid products={overrides.products ?? makeProducts()} onAddToCart={onAddToCart} />
  );
  return { ...utils, onAddToCart };
}

function searchFor(query: string) {
  fireEvent.change(screen.getByTestId('search-input'), { target: { value: query } });
}
// -------------------------------------------------------------------------

describe('ProductGrid', () => {
  it('shows every product when the search box is empty', () => {
    renderGrid({});

    expect(screen.getByTestId('product-card-p1')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-p2')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-p3')).toBeInTheDocument();
  });

  it('filters products case-insensitively as the user types', () => {
    renderGrid({});

    searchFor('bike');

    expect(screen.queryByTestId('product-card-p1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('product-card-p2')).not.toBeInTheDocument();
    expect(screen.getByTestId('product-card-p3')).toBeInTheDocument();
  });

  it('narrows down to a single matching product without losing it', () => {
    renderGrid({});

    searchFor('helmet');

    expect(screen.getByTestId('product-card-p3')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  it('shows an empty-state message with the query when nothing matches', () => {
    renderGrid({});

    searchFor('surfboard');

    expect(screen.getByTestId('empty-state')).toHaveTextContent('surfboard');
    expect(screen.queryByTestId('product-grid')).not.toBeInTheDocument();
  });

  it('calls onAddToCart with the clicked product id', () => {
    const onAddToCart = vi.fn();
    renderGrid({ onAddToCart });

    fireEvent.click(
      screen.getByTestId('product-card-p2').querySelector('button') as HTMLButtonElement
    );

    expect(onAddToCart).toHaveBeenCalledWith('p2');
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });
});
