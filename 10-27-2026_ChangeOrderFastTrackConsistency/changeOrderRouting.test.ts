import { describe, it, expect } from 'vitest';
import {
  previewApprovalPath,
  finalizeChangeOrder,
  buildDraftSummaryBadge,
  type DraftChangeOrder,
  type ClientAccount,
} from './changeOrderRouting';

// --- Test seam ---
// Wraps object construction and the calls under test, including the
// compound result object finalizeChangeOrder returns. Expected to change
// shape if the routing logic gets refactored.
function makeOrder(overrides: Partial<DraftChangeOrder> = {}): DraftChangeOrder {
  return {
    id: 'co-1',
    amount: 200000, // $2,000
    category: 'electrical',
    projectId: 'proj-1',
    ...overrides,
  };
}

function makeClient(overrides: Partial<ClientAccount> = {}): ClientAccount {
  return {
    id: 'client-1',
    tier: 'preferred',
    hasOpenSafetyViolation: false,
    ...overrides,
  };
}

function preview(
  orderOverrides: Partial<DraftChangeOrder> = {},
  clientOverrides: Partial<ClientAccount> = {},
) {
  return previewApprovalPath(makeOrder(orderOverrides), makeClient(clientOverrides));
}

function finalize(
  orderOverrides: Partial<DraftChangeOrder> = {},
  clientOverrides: Partial<ClientAccount> = {},
) {
  const result = finalizeChangeOrder(makeOrder(orderOverrides), makeClient(clientOverrides));
  return {
    approvalPath: result.approvalPath,
    orderId: result.orderId,
    submittedAt: result.submittedAt,
  };
}

function badge(
  orderOverrides: Partial<DraftChangeOrder> = {},
  clientOverrides: Partial<ClientAccount> = {},
) {
  return buildDraftSummaryBadge(makeOrder(orderOverrides), makeClient(clientOverrides));
}
// --- end seam ---

describe('previewApprovalPath', () => {
  it('fast-tracks a small, non-structural order for a preferred-tier client', () => {
    expect(preview()).toBe('fast-track');
  });

  it('fast-tracks for an enterprise-tier client too', () => {
    expect(preview({}, { tier: 'enterprise' })).toBe('fast-track');
  });

  it('requires manual review once the amount is above the fast-track limit', () => {
    expect(preview({ amount: 500001 })).toBe('manual-review');
  });

  it('requires manual review for structural change orders', () => {
    expect(preview({ category: 'structural' })).toBe('manual-review');
  });

  it('requires manual review for standard-tier clients', () => {
    expect(preview({}, { tier: 'standard' })).toBe('manual-review');
  });

  it('currently still fast-tracks for a client with an open safety violation', () => {
    expect(preview({}, { hasOpenSafetyViolation: true })).toBe('fast-track');
  });
});

describe('finalizeChangeOrder', () => {
  it('fast-tracks a small, non-structural order for a preferred-tier client', () => {
    expect(finalize().approvalPath).toBe('fast-track');
  });

  it('fast-tracks for an enterprise-tier client too', () => {
    expect(finalize({}, { tier: 'enterprise' }).approvalPath).toBe('fast-track');
  });

  it('requires manual review once the amount is above the fast-track limit', () => {
    expect(finalize({ amount: 500001 }).approvalPath).toBe('manual-review');
  });

  it('requires manual review for structural change orders', () => {
    expect(finalize({ category: 'structural' }).approvalPath).toBe('manual-review');
  });

  it('requires manual review for standard-tier clients', () => {
    expect(finalize({}, { tier: 'standard' }).approvalPath).toBe('manual-review');
  });

  it('requires manual review for a client with an open safety violation, even if size/category/tier would otherwise qualify', () => {
    expect(finalize({}, { hasOpenSafetyViolation: true }).approvalPath).toBe('manual-review');
  });

  it('stamps the order id and a submission timestamp onto the result', () => {
    const result = finalize({ id: 'co-42' });
    expect(result.orderId).toBe('co-42');
    expect(typeof result.submittedAt).toBe('string');
    expect(result.submittedAt.length).toBeGreaterThan(0);
  });
});

describe('buildDraftSummaryBadge', () => {
  it('shows a fast-track message when eligible', () => {
    expect(badge()).toContain('Fast-track eligible');
  });

  it('shows a manager-review message when not eligible', () => {
    expect(badge({ category: 'structural' })).toBe('Requires manager review');
  });
});

describe('preview vs. final routing for the same order', () => {
  it('a PM sees a fast-track badge that does not hold up once submitted, for a client with an open safety violation', () => {
    const previewed = preview({}, { hasOpenSafetyViolation: true });
    const submitted = finalize({}, { hasOpenSafetyViolation: true });
    expect(previewed).toBe('fast-track');
    expect(submitted.approvalPath).toBe('manual-review');
  });
});
