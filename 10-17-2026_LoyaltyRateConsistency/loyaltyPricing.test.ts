import { describe, it, expect } from 'vitest';
import { getQuotedRate, finalizeBooking, type Member, type Booking } from './loyaltyPricing';

// --- Test seam ---
// Wraps object construction and the calls under test, including the compound
// result object each function returns. Expected to change shape if the
// eligibility logic gets refactored.
function makeMember(overrides: Partial<Member> = {}): Member {
  return { id: 'member-1', tier: 'gold', hasActiveDispute: false, ...overrides };
}

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return { id: 'booking-1', roomRateCents: 20000, nights: 3, rateCode: 'STANDARD', ...overrides };
}

function quoteDiscount(memberOverrides: Partial<Member> = {}, bookingOverrides: Partial<Booking> = {}) {
  const result = getQuotedRate(makeBooking(bookingOverrides), makeMember(memberOverrides));
  return {
    discountApplied: result.loyaltyDiscountApplied,
    nightlyRateCents: result.nightlyRateCents,
    totalCents: result.totalCents,
  };
}

function finalizeDiscount(memberOverrides: Partial<Member> = {}, bookingOverrides: Partial<Booking> = {}) {
  const result = finalizeBooking(makeBooking(bookingOverrides), makeMember(memberOverrides));
  return {
    discountApplied: result.loyaltyDiscountApplied,
    nightlyRateCents: result.nightlyRateCents,
    totalCents: result.totalCents,
  };
}
// --- end seam ---

describe('getQuotedRate', () => {
  it('applies the loyalty discount for a gold member on a multi-night standard-rate stay', () => {
    const quote = quoteDiscount();
    expect(quote.discountApplied).toBe(true);
    expect(quote.nightlyRateCents).toBe(18000);
    expect(quote.totalCents).toBe(54000);
  });

  it('applies the discount for a platinum member too', () => {
    const quote = quoteDiscount({ tier: 'platinum' });
    expect(quote.discountApplied).toBe(true);
  });

  it('does not discount a standard-tier member', () => {
    const quote = quoteDiscount({ tier: 'standard' });
    expect(quote.discountApplied).toBe(false);
    expect(quote.nightlyRateCents).toBe(20000);
  });

  it('does not discount a silver-tier member', () => {
    const quote = quoteDiscount({ tier: 'silver' });
    expect(quote.discountApplied).toBe(false);
  });

  it('does not discount a one-night stay', () => {
    const quote = quoteDiscount({}, { nights: 1 });
    expect(quote.discountApplied).toBe(false);
  });

  it('does not stack the loyalty discount on an already-discounted promo rate', () => {
    const quote = quoteDiscount({}, { rateCode: 'PROMO' });
    expect(quote.discountApplied).toBe(false);
  });

  it('currently still shows the discount to a member with an active dispute', () => {
    const quote = quoteDiscount({ hasActiveDispute: true });
    expect(quote.discountApplied).toBe(true);
  });
});

describe('finalizeBooking', () => {
  it('applies the loyalty discount for a gold member with no dispute on a multi-night standard-rate stay', () => {
    const final = finalizeDiscount();
    expect(final.discountApplied).toBe(true);
    expect(final.nightlyRateCents).toBe(18000);
    expect(final.totalCents).toBe(54000);
  });

  it('applies the discount for a platinum member too', () => {
    const final = finalizeDiscount({ tier: 'platinum' });
    expect(final.discountApplied).toBe(true);
  });

  it('does not discount a standard-tier member', () => {
    const final = finalizeDiscount({ tier: 'standard' });
    expect(final.discountApplied).toBe(false);
    expect(final.nightlyRateCents).toBe(20000);
  });

  it('does not discount a one-night stay', () => {
    const final = finalizeDiscount({}, { nights: 1 });
    expect(final.discountApplied).toBe(false);
  });

  it('does not stack the loyalty discount on an already-discounted promo rate', () => {
    const final = finalizeDiscount({}, { rateCode: 'PROMO' });
    expect(final.discountApplied).toBe(false);
  });

  it('withholds the discount from a member with an active dispute', () => {
    const final = finalizeDiscount({ hasActiveDispute: true });
    expect(final.discountApplied).toBe(false);
  });
});

describe('quote vs. final charge for the same guest', () => {
  it('a disputed gold member sees one discount result at quote time and a different one at checkout', () => {
    const quote = quoteDiscount({ hasActiveDispute: true });
    const final = finalizeDiscount({ hasActiveDispute: true });
    expect(quote.discountApplied).toBe(true);
    expect(final.discountApplied).toBe(false);
    expect(quote.nightlyRateCents).not.toBe(final.nightlyRateCents);
  });
});
