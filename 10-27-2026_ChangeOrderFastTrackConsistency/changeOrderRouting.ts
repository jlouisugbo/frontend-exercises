// Meridian Construction Group - change order approval routing
//
// Change orders under a certain size, outside structural scope, from a
// trusted client tier can skip the GC's manager sign-off and go straight to
// the field team ("fast-track"). Everything else needs manual review.
//
// NOTE (Priya, 2026-08): After the Riverside Ave incident - a fast-tracked
// change order went through for a client whose account had an open safety
// violation that nobody on the field team caught in time - Ops wants any
// client with an open safety violation routed to manual review
// automatically, no matter what the order itself looks like. Added the
// check here in finalizeChangeOrder, since that's what actually creates the
// record the field team and the auditors see. Wanted it live before the
// inspector's next site visit.

export type ChangeOrderCategory =
  | 'structural'
  | 'electrical'
  | 'plumbing'
  | 'finishes'
  | 'site-work';

export interface ClientAccount {
  id: string;
  tier: 'standard' | 'preferred' | 'enterprise';
  hasOpenSafetyViolation: boolean;
}

export interface DraftChangeOrder {
  id: string;
  amount: number; // cents
  category: ChangeOrderCategory;
  projectId: string;
}

export type ApprovalPath = 'fast-track' | 'manual-review';

export interface ChangeOrderResult {
  orderId: string;
  approvalPath: ApprovalPath;
  submittedAt: string;
}

const FAST_TRACK_AMOUNT_LIMIT_CENTS = 500000; // $5,000 - small enough for a foreman to sign off on-site

/**
 * Drives the live "will this fast-track?" badge on the change order
 * drafting form while a PM is still filling it out. Needs to be fast and
 * side-effect free - it reruns on every field edit.
 */
export function previewApprovalPath(order: DraftChangeOrder, client: ClientAccount): ApprovalPath {
  const isSmallEnough = order.amount <= FAST_TRACK_AMOUNT_LIMIT_CENTS;
  const isNonStructural = order.category !== 'structural';
  const isTrustedTier = client.tier === 'preferred' || client.tier === 'enterprise';

  return isSmallEnough && isNonStructural && isTrustedTier ? 'fast-track' : 'manual-review';
}

/**
 * Called when the PM hits submit - this is what actually creates the
 * change order record the field team and the auditors rely on.
 */
export function finalizeChangeOrder(order: DraftChangeOrder, client: ClientAccount): ChangeOrderResult {
  const isSmallEnough = order.amount <= FAST_TRACK_AMOUNT_LIMIT_CENTS;
  const isNonStructural = order.category !== 'structural';
  const isTrustedTier = client.tier === 'preferred' || client.tier === 'enterprise';
  const hasNoSafetyViolation = !client.hasOpenSafetyViolation;

  const approvalPath: ApprovalPath =
    isSmallEnough && isNonStructural && isTrustedTier && hasNoSafetyViolation
      ? 'fast-track'
      : 'manual-review';

  return {
    orderId: order.id,
    approvalPath,
    submittedAt: new Date().toISOString(),
  };
}

/**
 * Label shown next to the order in the drafting form's summary panel.
 */
export function buildDraftSummaryBadge(order: DraftChangeOrder, client: ClientAccount): string {
  const path = previewApprovalPath(order, client);
  return path === 'fast-track'
    ? 'Fast-track eligible - no manager sign-off needed'
    : 'Requires manager review';
}
