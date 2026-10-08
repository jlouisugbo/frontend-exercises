import { describe, it, expect } from 'vitest';
import { toLineItem, type PayrollEvent } from './starter';

// --- Seam ---------------------------------------------------------------
// The only place that knows how a PayrollEvent gets built for a test. If
// you reshape PayrollEvent (a discriminated union, separate interfaces per
// type, whatever), update ONLY the helpers in this block - the test cases
// below should keep working unchanged as long as toLineItem's observable
// input/output shape stays the same.

function hireEvent(overrides: Partial<Extract<PayrollEvent, {type: "hire"}>> = {}): PayrollEvent {
  return {
    type: 'hire',
    employeeId: 'emp-1',
    effectiveDate: '2026-10-01',
    startingSalaryCents: 650000,
    ...overrides,
  };
}

function terminationEvent(overrides: Partial<Extract<PayrollEvent, {type: "termination"}>> = {}): PayrollEvent {
  return {
    type: 'termination',
    employeeId: 'emp-1',
    effectiveDate: '2026-10-01',
    severanceCents: 200000,
    ...overrides,
  };
}

function bonusEvent(overrides: Partial<Extract<PayrollEvent, {type: "bonus"}>> = {}): PayrollEvent {
  return {
    type: 'bonus',
    employeeId: 'emp-1',
    effectiveDate: '2026-10-01',
    bonusAmountCents: 50000,
    bonusReason: 'Spot bonus',
    ...overrides,
  };
}

function correctionEvent(overrides: Partial<Extract<PayrollEvent, {type: "correction"}>> = {}): PayrollEvent {
  return {
    type: 'correction',
    employeeId: 'emp-1',
    effectiveDate: '2026-10-01',
    correctedFieldName: 'severanceCents',
    correctedValueCents: 25000,
    ...overrides,
  };
}
// -------------------------------------------------------------------------

describe('toLineItem', () => {
  it('builds a hire line item from the starting salary', () => {
    const item = toLineItem(hireEvent({ startingSalaryCents: 720000 }));

    expect(item.description).toContain('Starting salary');
    expect(item.amountCents).toBe(720000);
  });

  it('defaults a hire line item to zero when no starting salary is given', () => {
    const item = toLineItem(hireEvent({ startingSalaryCents: undefined }));

    expect(item.amountCents).toBe(0);
  });

  it('builds a termination line item from the severance amount', () => {
    const item = toLineItem(terminationEvent({ severanceCents: 300000 }));

    expect(item.description).toContain('severance');
    expect(item.amountCents).toBe(300000);
  });

  it('defaults a termination line item to zero when no severance is given', () => {
    const item = toLineItem(terminationEvent({ severanceCents: undefined }));

    expect(item.amountCents).toBe(0);
  });

  it('builds a bonus line item from the bonus amount and reason', () => {
    const item = toLineItem(bonusEvent({ bonusAmountCents: 15000, bonusReason: 'Referral bonus' }));

    expect(item.description).toBe('Referral bonus');
    expect(item.amountCents).toBe(15000);
  });

  it('falls back to a generic description and zero amount when a bonus is missing its details', () => {
    const item = toLineItem(bonusEvent({ bonusAmountCents: undefined, bonusReason: undefined }));

    expect(item.description).toBe('Bonus');
    expect(item.amountCents).toBe(0);
  });

  it('builds a correction line item from the corrected field and value', () => {
    const item = toLineItem(
      correctionEvent({ correctedFieldName: 'bonusAmountCents', correctedValueCents: 5000 })
    );

    expect(item.description).toBe('Correction: bonusAmountCents');
    expect(item.amountCents).toBe(5000);
  });

  it('falls back to an "unspecified field" description when a correction is missing its field name', () => {
    const item = toLineItem(correctionEvent({ correctedFieldName: undefined, correctedValueCents: undefined }));

    expect(item.description).toBe('Correction: unspecified field');
    expect(item.amountCents).toBe(0);
  });
});
