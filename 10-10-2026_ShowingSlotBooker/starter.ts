// Showing-request eligibility + slot-booking for Meridian Realty's listing
// site. Wired straight to the "Request This Time" button since launch - one
// pass: check the rules, and if everything lines up, hold the slot.

export interface ShowingSlot {
  id: string;
  propertyId: string;
  startTime: string; // ISO timestamp, e.g. "2026-10-14T15:00:00"
  capacityRemaining: number;
  isBlackedOut: boolean; // seller requested no showings during this window (e.g. open house day)
}

export interface ShowingBooking {
  slotId: string;
  propertyId: string;
  startTime: string;
}

export interface Buyer {
  id: string;
  activeShowingRequests: ShowingBooking[];
  maxConcurrentRequests: number;
  flaggedForNoShow: boolean; // repeat no-shows get temporarily blocked from booking
}

export interface ShowingResult {
  eligible: boolean;
  reason: string;
}

/**
 * Checks whether `buyer` can book `slot`, and - if so - books it.
 *
 * Wired directly to the "Request This Time" button on a property's listing page.
 */
export function requestShowing(slot: ShowingSlot, buyer: Buyer): ShowingResult {
  if (slot.isBlackedOut) {
    return {
      eligible: false,
      reason: "This time window isn't open for private showings.",
    };
  }

  if (buyer.flaggedForNoShow) {
    return {
      eligible: false,
      reason: "Account is temporarily blocked from booking after repeated no-shows.",
    };
  }

  if (buyer.activeShowingRequests.length >= buyer.maxConcurrentRequests) {
    return {
      eligible: false,
      reason: "Already has the maximum number of active showing requests.",
    };
  }

  if (slot.capacityRemaining <= 0) {
    return {
      eligible: false,
      reason: "This time slot is fully booked.",
    };
  }

  // Everything checks out - hold the slot.
  slot.capacityRemaining -= 1;
  buyer.activeShowingRequests.push({
    slotId: slot.id,
    propertyId: slot.propertyId,
    startTime: slot.startTime,
  });

  return {
    eligible: true,
    reason: "Showing booked.",
  };
}
