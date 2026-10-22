import { describe, it, expect } from 'vitest';
import { estimateVisitCost, finalizeInvoice, type Household, type Visit } from './visitPricing';

// --- Test seam ---
// Wraps object construction and the calls under test, including the
// compound result object each function returns. Expected to change shape if
// the discount logic gets refactored.
function makeHousehold(overrides: Partial<Household> = {}): Household {
  return { id: 'household-1', activePetCount: 2, ...overrides };
}

function makeVisit(overrides: Partial<Visit> = {}): Visit {
  return {
    id: 'visit-1',
    examFeeCents: 8000,
    addOnFeesCents: 0,
    visitType: 'WELLNESS',
    hasEmergencyAddOn: false,
    ...overrides,
  };
}

function estimate(householdOverrides: Partial<Household> = {}, visitOverrides: Partial<Visit> = {}) {
  const result = estimateVisitCost(makeVisit(visitOverrides), makeHousehold(householdOverrides));
  return {
    discountApplied: result.multiPetDiscountApplied,
    examFeeCents: result.examFeeCents,
    totalCents: result.totalCents,
  };
}

function finalize(householdOverrides: Partial<Household> = {}, visitOverrides: Partial<Visit> = {}) {
  const result = finalizeInvoice(makeVisit(visitOverrides), makeHousehold(householdOverrides));
  return {
    discountApplied: result.multiPetDiscountApplied,
    examFeeCents: result.examFeeCents,
    totalCents: result.totalCents,
  };
}
// --- end seam ---

describe('estimateVisitCost', () => {
  it('applies the multi-pet discount for a 2-pet household on a wellness visit', () => {
    const result = estimate();
    expect(result.discountApplied).toBe(true);
    expect(result.examFeeCents).toBe(6800);
    expect(result.totalCents).toBe(6800);
  });

  it('applies the discount for a larger household too', () => {
    const result = estimate({ activePetCount: 4 });
    expect(result.discountApplied).toBe(true);
  });

  it('does not discount a single-pet household', () => {
    const result = estimate({ activePetCount: 1 });
    expect(result.discountApplied).toBe(false);
    expect(result.examFeeCents).toBe(8000);
  });

  it('does not discount an emergency visit', () => {
    const result = estimate({}, { visitType: 'EMERGENCY' });
    expect(result.discountApplied).toBe(false);
  });

  it('includes add-on fees in the total without discounting them', () => {
    const result = estimate({}, { addOnFeesCents: 1500 });
    expect(result.examFeeCents).toBe(6800);
    expect(result.totalCents).toBe(8300);
  });

  it('currently still shows the discount for a visit that will later get an emergency add-on', () => {
    const result = estimate({}, { hasEmergencyAddOn: true });
    expect(result.discountApplied).toBe(true);
  });
});

describe('finalizeInvoice', () => {
  it('applies the multi-pet discount for a 2-pet household wellness visit with no emergency add-on', () => {
    const result = finalize();
    expect(result.discountApplied).toBe(true);
    expect(result.examFeeCents).toBe(6800);
    expect(result.totalCents).toBe(6800);
  });

  it('applies the discount for a larger household too', () => {
    const result = finalize({ activePetCount: 3 });
    expect(result.discountApplied).toBe(true);
  });

  it('does not discount a single-pet household', () => {
    const result = finalize({ activePetCount: 1 });
    expect(result.discountApplied).toBe(false);
    expect(result.examFeeCents).toBe(8000);
  });

  it('does not discount a visit booked as emergency from the start', () => {
    const result = finalize({}, { visitType: 'EMERGENCY' });
    expect(result.discountApplied).toBe(false);
  });

  it('withholds the discount once an emergency add-on is tacked onto the visit', () => {
    const result = finalize({}, { hasEmergencyAddOn: true });
    expect(result.discountApplied).toBe(false);
    expect(result.examFeeCents).toBe(8000);
  });

  it('includes add-on fees in the total without discounting them', () => {
    const result = finalize({}, { addOnFeesCents: 1500 });
    expect(result.totalCents).toBe(8300);
  });
});

describe('estimate vs. final invoice for the same visit', () => {
  it('an owner is quoted a discount that disappears once an emergency add-on happens', () => {
    const quoted = estimate({}, { hasEmergencyAddOn: true });
    const billed = finalize({}, { hasEmergencyAddOn: true });
    expect(quoted.discountApplied).toBe(true);
    expect(billed.discountApplied).toBe(false);
    expect(quoted.examFeeCents).not.toBe(billed.examFeeCents);
  });
});
