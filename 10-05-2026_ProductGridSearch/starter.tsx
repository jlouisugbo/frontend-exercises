// Product grid for the storefront's category pages. Search-as-you-type got
// added on top of the existing grid last sprint - just filtered the same
// list client-side rather than wiring up a new endpoint.

import { memo, useState, useMemo } from 'react';

export interface Product {
  id: string;
  name: string;
  priceCents: number;
}

export interface ProductCardProps {
  product: Product;
  onAddToCart: (id: string) => void;
  onRender?: (id: string) => void; // test seam: fires on every render of this card
}

export const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
  onRender,
}: ProductCardProps) {
  onRender?.(product.id);

  return (
    <article data-testid={`product-card-${product.id}`}>
      <h3>{product.name}</h3>
      <p>${(product.priceCents / 100).toFixed(2)}</p>
      <button onClick={() => onAddToCart(product.id)}>Add to cart</button>
    </article>
  );
});

export interface ProductGridProps {
  products: Product[];
  onAddToCart: (id: string) => void;
  onCardRender?: (id: string) => void; // test seam: forwarded to every card
}

export function ProductGrid({ products, onAddToCart, onCardRender }: ProductGridProps) {
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    return products.filter((product) => product.name.toLowerCase().includes(search.toLowerCase()))
  }, [products, search])

  return (
    <div>
      <input
        data-testid="search-input"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search products"
      />
      {visible.length === 0 ? (
        <p data-testid="empty-state">No products match "{search}".</p>
      ) : (
        <div data-testid="product-grid">
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={(id) => onAddToCart(id)}
              onRender={onCardRender}
            />
          ))}
        </div>
      )}
    </div>
  );
}
