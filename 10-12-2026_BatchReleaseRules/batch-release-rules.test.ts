import { describe, it, expect } from 'vitest';
import { canStageForPicking, canApproveShipment, type Batch } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how a Batch gets built for a test. If
// you refactor how release eligibility is checked (a shared rules module,
// whatever), update ONLY the helper in this block - the test cases below
// should keep working unchanged as long as canStageForPicking/
// canApproveShipment keep the same observable input/output shape.

function batch(qualityStatus: Batch['qualityStatus']): Batch {
  return { batchId: 'b1', sku: 'SKU-100', qualityStatus };
}
// -------------------------------------------------------------------------

describe('canStageForPicking', () => {
  it('allows a passed batch to stage for a regular facility', () => {
    expect(canStageForPicking(batch('passed'), 'FAC-EAST')).toBe(true);
  });

  it('blocks a recalled batch from staging anywhere', () => {
    expect(canStageForPicking(batch('recalled'), 'QUARANTINE_HOLD')).toBe(false);
  });

  it('allows a quarantined batch to stage into quarantine hold', () => {
    expect(canStageForPicking(batch('quarantined'), 'QUARANTINE_HOLD')).toBe(true);
  });

  it('blocks a quarantined batch from staging into a regular facility', () => {
    expect(canStageForPicking(batch('quarantined'), 'FAC-EAST')).toBe(false);
  });
});

describe('canApproveShipment', () => {
  it('allows a passed batch to ship to a regular facility', () => {
    expect(canApproveShipment(batch('passed'), 'FAC-EAST')).toBe(true);
  });

  it('blocks a recalled batch from shipping', () => {
    expect(canApproveShipment(batch('recalled'), 'FAC-EAST')).toBe(false);
  });

  it('currently approves a quarantined batch for shipment to a regular facility', () => {
    expect(canApproveShipment(batch('quarantined'), 'FAC-EAST')).toBe(true);
  });
});
