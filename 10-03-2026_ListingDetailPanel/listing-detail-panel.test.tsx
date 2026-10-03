import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ListingDetailPanel,
  type ListingDetail,
  type ListingSummary,
  type FetchListingDetail,
} from './starter';

// --- Seam ---------------------------------------------------------------
// The only place that knows how ListingDetailPanel is constructed, how a
// listing gets selected, and how fetchListingDetail results get back into
// it. If you refactor the component's internals (a request-id guard, a
// ref, whatever you like), update ONLY the helpers in this block - the
// test cases below should keep working unchanged as long as the
// component's public props and rendered output stay the same shape.

const LISTINGS: ListingSummary[] = [
  { id: '101', address: '12 Oak St', price: 450000 },
  { id: '202', address: '88 Pine Ave', price: 610000 },
];

function renderPanel(
  fetchListingDetail: FetchListingDetail,
  listings: ListingSummary[] = LISTINGS
) {
  return render(
    <ListingDetailPanel listings={listings} fetchListingDetail={fetchListingDetail} />
  );
}

function fetchDetailResolvingWith(
  overrides: Partial<Omit<ListingDetail, 'id'>> = {}
): FetchListingDetail {
  return (listingId) =>
    Promise.resolve({
      id: listingId,
      address: overrides.address ?? 'Unknown address',
      price: overrides.price ?? 0,
      description: overrides.description ?? 'A lovely home.',
      sqft: overrides.sqft ?? 1200,
      bedrooms: overrides.bedrooms ?? 3,
    });
}

function fetchDetailRejectingWith(message: string): FetchListingDetail {
  return () => Promise.reject(new Error(message));
}

function selectListing(listingId: string) {
  fireEvent.click(screen.getByTestId(`listing-card-${listingId}`));
}
// -------------------------------------------------------------------------

describe('ListingDetailPanel', () => {
  it('shows an idle prompt and no detail before any listing is selected', () => {
    const fetchListingDetail = vi.fn();
    renderPanel(fetchListingDetail);

    expect(screen.getByTestId('status-message')).toHaveTextContent('Select a listing');
    expect(screen.queryByTestId('listing-detail')).not.toBeInTheDocument();
    expect(fetchListingDetail).not.toHaveBeenCalled();
  });

  it('shows a loading indicator immediately after a listing is clicked', async () => {
    const fetchListingDetail: FetchListingDetail = () => new Promise(() => {}); // never resolves
    renderPanel(fetchListingDetail);

    selectListing('101');

    expect(await screen.findByTestId('status-message')).toHaveTextContent('Loading listing');
  });

  it('renders the full detail once the fetch resolves', async () => {
    const fetchListingDetail = fetchDetailResolvingWith({
      address: '12 Oak St',
      price: 450000,
      description: 'Sunny two-bedroom with a renovated kitchen.',
      sqft: 1100,
      bedrooms: 2,
    });
    renderPanel(fetchListingDetail);

    selectListing('101');

    expect(await screen.findByTestId('detail-address')).toHaveTextContent('12 Oak St');
    expect(screen.getByTestId('detail-price')).toHaveTextContent('450,000');
    expect(screen.getByTestId('detail-beds-sqft')).toHaveTextContent('2 bd');
    expect(screen.getByTestId('detail-beds-sqft')).toHaveTextContent('1100 sqft');
    expect(screen.getByTestId('detail-description')).toHaveTextContent(
      'Sunny two-bedroom with a renovated kitchen.'
    );
  });

  it('marks the clicked card as pressed and leaves the other one unpressed', async () => {
    const fetchListingDetail = fetchDetailResolvingWith();
    renderPanel(fetchListingDetail);

    selectListing('101');
    await screen.findByTestId('listing-detail');

    expect(screen.getByTestId('listing-card-101')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('listing-card-202')).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows an error message and no detail when the fetch rejects', async () => {
    const fetchListingDetail = fetchDetailRejectingWith('listing service unreachable');
    renderPanel(fetchListingDetail);

    selectListing('101');

    expect(await screen.findByRole('alert')).toHaveTextContent('listing service unreachable');
    expect(screen.queryByTestId('listing-detail')).not.toBeInTheDocument();
  });

  it('loads the newly selected listing when a different card is clicked after one is already loaded', async () => {
    const fetchListingDetail = vi.fn((listingId: string) =>
      Promise.resolve({
        id: listingId,
        address: listingId === '101' ? '12 Oak St' : '88 Pine Ave',
        price: listingId === '101' ? 450000 : 610000,
        description: 'desc',
        sqft: 1000,
        bedrooms: 3,
      })
    );
    renderPanel(fetchListingDetail);

    selectListing('101');
    expect(await screen.findByTestId('detail-address')).toHaveTextContent('12 Oak St');

    selectListing('202');
    expect(await screen.findByTestId('detail-address')).toHaveTextContent('88 Pine Ave');

    expect(fetchListingDetail).toHaveBeenCalledTimes(2);
  });
});
