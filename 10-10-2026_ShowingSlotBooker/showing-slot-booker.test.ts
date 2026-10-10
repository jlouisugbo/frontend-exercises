import { describe, it, expect } from 'vitest';
import { requestShowing, type ShowingSlot, type Buyer } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how a ShowingSlot/Buyer get built and
// how a booking attempt gets made. If you refactor requestShowing (split
// it, rename it, change its signature), update ONLY the helpers below -
// the test cases underneath should keep working unchanged as long as the
// observable eligibility/slot-booking behavior stays the same shape.

function makeSlot(overrides: Partial<ShowingSlot> = {}): ShowingSlot {
  return {
    id: 'slot-204',
    propertyId: '118-Maple-St',
    startTime: '2026-10-14T15:00:00',
    capacityRemaining: 3,
    isBlackedOut: false,
    ...overrides,
  };
}

function makeBuyer(overrides: Partial<Buyer> = {}): Buyer {
  return {
    id: 'buyer-7',
    activeShowingRequests: [],
    maxConcurrentRequests: 3,
    flaggedForNoShow: false,
    ...overrides,
  };
}

function requestShow(slot: ShowingSlot, buyer: Buyer) {
  return requestShowing(slot, buyer);
}

function activeRequestsFor(buyer: Buyer): Buyer['activeShowingRequests'] {
  return buyer.activeShowingRequests;
}
// -------------------------------------------------------------------------

describe('requestShowing', () => {
  it('rejects a slot inside a blacked-out window', () => {
    const slot = makeSlot({ isBlackedOut: true });
    const buyer = makeBuyer();

    const result = requestShow(slot, buyer);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/window/i);
  });

  it('rejects a buyer flagged for repeated no-shows', () => {
    const slot = makeSlot();
    const buyer = makeBuyer({ flaggedForNoShow: true });

    const result = requestShow(slot, buyer);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/no-show/i);
  });

  it('rejects a buyer who already has the maximum number of active requests', () => {
    const slot = makeSlot();
    const buyer = makeBuyer({
      maxConcurrentRequests: 2,
      activeShowingRequests: [
        { slotId: 'slot-100', propertyId: '55-Oak-Ave', startTime: '2026-10-12T10:00:00' },
        { slotId: 'slot-101', propertyId: '9-Birch-Ln', startTime: '2026-10-13T11:00:00' },
      ],
    });

    const result = requestShow(slot, buyer);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/maximum|active/i);
  });

  it('rejects a slot with no capacity remaining', () => {
    const slot = makeSlot({ capacityRemaining: 0 });
    const buyer = makeBuyer();

    const result = requestShow(slot, buyer);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/booked/i);
  });

  it('books an eligible buyer and consumes a slot', () => {
    const slot = makeSlot();
    const buyer = makeBuyer();

    const result = requestShow(slot, buyer);

    expect(result.eligible).toBe(true);
    expect(result.reason).toMatch(/booked/i);
    expect(slot.capacityRemaining).toBe(2);
    expect(activeRequestsFor(buyer)).toEqual([
      { slotId: 'slot-204', propertyId: '118-Maple-St', startTime: '2026-10-14T15:00:00' },
    ]);
  });
});
