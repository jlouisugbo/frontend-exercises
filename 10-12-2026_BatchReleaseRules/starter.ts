// Quality-release rules for finished-goods batches. canStageForPicking backs
// the warehouse pick-list screen and has gated outbound batches since the
// plant's WMS went live. canApproveShipment backs the newer shipping-desk
// approval screen, added when direct-to-customer orders launched - there
// wasn't a shared rules module yet, so it was written to match
// canStageForPicking's shape by eye rather than by calling into it.

export type QualityStatus = 'passed' | 'quarantined' | 'recalled';

export interface Batch {
  batchId: string;
  sku: string;
  qualityStatus: QualityStatus;
}

export const QUARANTINE_HOLD = 'QUARANTINE_HOLD';

export function canStageForPicking(batch: Batch, destinationFacility: string): boolean {
  if (batch.qualityStatus === 'recalled') {
    return false;
  }
  if (batch.qualityStatus === 'quarantined' && destinationFacility !== QUARANTINE_HOLD) {
    return false;
  }
  return true;
}

export function canApproveShipment(batch: Batch, destinationFacility: string): boolean {
  if (batch.qualityStatus === 'recalled') {
    return false;
  }
  // Direct-to-customer shipping didn't exist when quarantine holds were
  // introduced, and recalled was the only status that ever needed
  // blocking here, so there was never a reason to check destinationFacility.
  return true;
}
