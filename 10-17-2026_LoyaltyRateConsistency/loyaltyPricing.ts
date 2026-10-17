// Harborview Hotels - booking pricing
//
// Loyalty discount: Gold/Platinum members get 10% off, as long as they're
// staying 2+ nights and aren't already on a promo rate (no stacking).
//
// NOTE (Priya, 2026-08): Trust & Safety asked us to stop extending the loyalty
// discount to accounts with an active payment dispute - a few disputed
// accounts were using the discount to book comped-looking stays while their
// chargeback was still under review. Added the check here in
// finalizeBooking, since that's what actually commits the charge. Shipped
// same day, T&S wanted it live before the weekend.

export type LoyaltyTier = 'standard' | 'silver' | 'gold' | 'platinum';

export interface Member {
  id: string;
  tier: LoyaltyTier;
  hasActiveDispute: boolean;
}

export interface Booking {
  id: string;
  roomRateCents: number; // nightly rate before any discount
  nights: number;
  rateCode: 'STANDARD' | 'PROMO' | 'CORPORATE';
}

export interface QuoteResult {
  nightlyRateCents: number;
  totalCents: number;
  loyaltyDiscountApplied: boolean;
}

const LOYALTY_DISCOUNT_MULTIPLIER = 0.9;

/**
 * Shown on the search results page and the booking summary page, before the
 * guest has committed to anything. Needs to be fast and side-effect free.
 */
export function getQuotedRate(booking: Booking, member: Member): QuoteResult {
  const eligibleForLoyaltyDiscount =
    (member.tier === 'gold' || member.tier === 'platinum') &&
    booking.nights >= 2 &&
    booking.rateCode !== 'PROMO';

  const nightlyRateCents = eligibleForLoyaltyDiscount
    ? Math.round(booking.roomRateCents * LOYALTY_DISCOUNT_MULTIPLIER)
    : booking.roomRateCents;

  return {
    nightlyRateCents,
    totalCents: nightlyRateCents * booking.nights,
    loyaltyDiscountApplied: eligibleForLoyaltyDiscount,
  };
}

/**
 * Called when the guest hits "Confirm Booking" - this is what actually
 * commits the room hold and charges the card on file.
 */
export function finalizeBooking(booking: Booking, member: Member): QuoteResult {
  const eligibleForLoyaltyDiscount =
    (member.tier === 'gold' || member.tier === 'platinum') &&
    booking.nights >= 2 &&
    booking.rateCode !== 'PROMO' &&
    !member.hasActiveDispute;

  const nightlyRateCents = eligibleForLoyaltyDiscount
    ? Math.round(booking.roomRateCents * LOYALTY_DISCOUNT_MULTIPLIER)
    : booking.roomRateCents;

  return {
    nightlyRateCents,
    totalCents: nightlyRateCents * booking.nights,
    loyaltyDiscountApplied: eligibleForLoyaltyDiscount,
  };
}
