// Realta's split-view listings browser - a scrollable card list on the
// left, and a detail panel on the right that loads whichever listing the
// person most recently clicked. No router, no per-listing page, just a
// click handler that kicks off a fetch and renders whatever comes back.

import { useState } from 'react';

export interface ListingSummary {
  id: string;
  address: string;
  price: number;
}

export interface ListingDetail {
  id: string;
  address: string;
  price: number;
  description: string;
  sqft: number;
  bedrooms: number;
}

export type FetchListingDetail = (listingId: string) => Promise<ListingDetail>;

export type DetailStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface ListingDetailPanelProps {
  listings: ListingSummary[];
  fetchListingDetail: FetchListingDetail;
}

export function ListingDetailPanel({ listings, fetchListingDetail }: ListingDetailPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const [status, setStatus] = useState<DetailStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSelect(listingId: string) {
    setSelectedId(listingId);
    setStatus('loading');
    setErrorMessage(null);

    fetchListingDetail(listingId)
      .then((result) => {
        setDetail(result);
        setStatus('loaded');
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setStatus('error');
        setErrorMessage(message);
      });
  }

  return (
    <div data-testid="listing-panel">
      <ul data-testid="listing-list">
        {listings.map((listing) => (
          <li key={listing.id}>
            <button
              data-testid={`listing-card-${listing.id}`}
              onClick={() => handleSelect(listing.id)}
              aria-pressed={selectedId === listing.id}
            >
              {listing.address} - ${listing.price.toLocaleString()}
            </button>
          </li>
        ))}
      </ul>

      <div data-testid="detail-panel">
        {status === 'idle' && (
          <p data-testid="status-message">Select a listing to see details.</p>
        )}

        {status === 'loading' && (
          <p data-testid="status-message" role="status">
            Loading listing…
          </p>
        )}

        {status === 'error' && (
          <p data-testid="status-message" role="alert">
            Couldn't load that listing: {errorMessage}
          </p>
        )}

        {status === 'loaded' && (
          <div data-testid="listing-detail">
            <h2 data-testid="detail-address">{detail?.address}</h2>
            <p data-testid="detail-price">${detail?.price.toLocaleString()}</p>
            <p data-testid="detail-beds-sqft">
              {detail?.bedrooms} bd · {detail?.sqft} sqft
            </p>
            <p data-testid="detail-description">{detail?.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
