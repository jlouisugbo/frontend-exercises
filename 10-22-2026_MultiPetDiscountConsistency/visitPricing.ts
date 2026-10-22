// Furlong Veterinary Partners - visit pricing
//
// Multi-pet discount: households with 2+ active pets get 15% off the
// wellness exam fee for a visit, as long as the visit isn't an emergency
// visit (no stacking the discount on top of an already-urgent-care fee).
//
// NOTE (Dana, 2026-09): Front desk flagged a loophole - a few owners were
// booking non-emergency wellness visits for multiple pets just to get the
// discount, then asking the vet to work in an emergency add-on (abscess
// check, sudden limp, whatever) once they were already in the exam room.
// Ops wants the discount pulled the moment any emergency add-on gets tacked
// onto the visit. Added the check here in finalizeInvoice, since that's what
// actually generates the bill the owner pays. Wanted it live before the long
// weekend.

export interface Household {
  id: string;
  activePetCount: number;
}

export interface Visit {
  id: string;
  examFeeCents: number; // base wellness exam fee before any discount
  addOnFeesCents: number; // vaccines, bloodwork, etc. - never discounted
  visitType: 'WELLNESS' | 'SICK' | 'EMERGENCY';
  hasEmergencyAddOn: boolean; // an emergency service got tacked onto the visit after check-in
}

export interface PricingResult {
  examFeeCents: number; // after discount, if any
  totalCents: number; // examFeeCents + addOnFeesCents
  multiPetDiscountApplied: boolean;
}

const MULTI_PET_DISCOUNT_MULTIPLIER = 0.85;

/**
 * Shown to the owner when they book online or call to schedule - before
 * anyone has set foot in the clinic. Needs to be fast and side-effect free.
 */
export function estimateVisitCost(visit: Visit, household: Household): PricingResult {
  const eligibleForMultiPetDiscount =
    household.activePetCount >= 2 && visit.visitType !== 'EMERGENCY';

  const examFeeCents = eligibleForMultiPetDiscount
    ? Math.round(visit.examFeeCents * MULTI_PET_DISCOUNT_MULTIPLIER)
    : visit.examFeeCents;

  return {
    examFeeCents,
    totalCents: examFeeCents + visit.addOnFeesCents,
    multiPetDiscountApplied: eligibleForMultiPetDiscount,
  };
}

/**
 * Called at checkout, once the visit is done - this is what actually
 * generates the invoice and charges the card on file.
 */
export function finalizeInvoice(visit: Visit, household: Household): PricingResult {
  const eligibleForMultiPetDiscount =
    household.activePetCount >= 2 &&
    visit.visitType !== 'EMERGENCY' &&
    !visit.hasEmergencyAddOn;

  const examFeeCents = eligibleForMultiPetDiscount
    ? Math.round(visit.examFeeCents * MULTI_PET_DISCOUNT_MULTIPLIER)
    : visit.examFeeCents;

  return {
    examFeeCents,
    totalCents: examFeeCents + visit.addOnFeesCents,
    multiPetDiscountApplied: eligibleForMultiPetDiscount,
  };
}
