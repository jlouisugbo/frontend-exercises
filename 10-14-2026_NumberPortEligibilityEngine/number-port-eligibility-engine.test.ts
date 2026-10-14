import { describe, it, expect } from 'vitest';
import {
  attemptPortIn,
  type CarrierAccount,
  type PortableLine,
  type PortBatch,
  type PortRequest,
} from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how a request/line/account/batch get
// built and how a port eligibility check gets made. If you refactor
// attemptPortIn (split it, rename it, change its signature), update ONLY
// the helpers below - the test cases underneath should keep working
// unchanged as long as the observable eligibility/slot-consumption
// behavior stays the same shape.

function makeRequest(overrides: Partial<PortRequest> = {}): PortRequest {
  return {
    phoneNumber: '555-010-2024',
    enteredPin: '4471',
    ...overrides,
  };
}

function makeLine(overrides: Partial<PortableLine> = {}): PortableLine {
  return {
    id: 'line-1',
    phoneNumber: '555-010-2024',
    portStatus: 'none',
    ...overrides,
  };
}

function makeAccount(overrides: Partial<CarrierAccount> = {}): CarrierAccount {
  return {
    id: 'acct-1',
    standing: 'good',
    pin: '4471',
    ...overrides,
  };
}

function makeBatch(overrides: Partial<PortBatch> = {}): PortBatch {
  return {
    date: '2026-10-14',
    slotsRemaining: 3,
    ...overrides,
  };
}

function attemptPort(
  request: PortRequest,
  line: PortableLine,
  account: CarrierAccount,
  batch: PortBatch
) {
  return attemptPortIn(request, line, account, batch);
}

function slotsRemainingFor(batch: PortBatch): number {
  return batch.slotsRemaining;
}

function portStatusFor(line: PortableLine): PortableLine['portStatus'] {
  return line.portStatus;
}
// -------------------------------------------------------------------------

describe('attemptPortIn', () => {
  it('rejects an account that is not in good standing', () => {
    const request = makeRequest();
    const line = makeLine();
    const account = makeAccount({ standing: 'past_due' });
    const batch = makeBatch();

    const result = attemptPort(request, line, account, batch);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/good standing/i);
  });

  it('rejects a line that already has a port in progress', () => {
    const request = makeRequest();
    const line = makeLine({ portStatus: 'in_progress' });
    const account = makeAccount();
    const batch = makeBatch();

    const result = attemptPort(request, line, account, batch);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/already has a port in progress/i);
  });

  it('rejects a PIN that does not match the account on file', () => {
    const request = makeRequest({ enteredPin: '0000' });
    const line = makeLine();
    const account = makeAccount({ pin: '4471' });
    const batch = makeBatch();

    const result = attemptPort(request, line, account, batch);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/pin/i);
  });

  it('rejects a port when no batch slots remain', () => {
    const request = makeRequest();
    const line = makeLine();
    const account = makeAccount();
    const batch = makeBatch({ slotsRemaining: 0 });

    const result = attemptPort(request, line, account, batch);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/no port slots/i);
  });

  it('starts an eligible port and reserves a batch slot', () => {
    const request = makeRequest();
    const line = makeLine();
    const account = makeAccount();
    const batch = makeBatch({ slotsRemaining: 3 });

    const result = attemptPort(request, line, account, batch);

    expect(result.eligible).toBe(true);
    expect(result.reason).toMatch(/port started/i);
    expect(slotsRemainingFor(batch)).toBe(2);
    expect(portStatusFor(line)).toBe('in_progress');
  });
});
