import { describe, it, expect } from 'vitest';
import {
  calculateShippingCost,
  getEstimatedDeliveryDays,
  getCarrierDisplayName,
  getShipmentSummary,
  type ShipmentOrder,
} from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows the current shape of starter.ts's
// public API. If you refactor calculateShippingCost / getEstimatedDeliveryDays
// / getCarrierDisplayName / getShipmentSummary to take different arguments
// (e.g. a single options object, or a carrier "strategy" object instead of
// a raw order + booleans), update ONLY the helpers in this block. The
// test cases below should keep working unchanged.
function makeOrder(overrides: Partial<ShipmentOrder> = {}): ShipmentOrder {
  return {
    id: 'ord-1',
    carrier: 'ups',
    weightKg: 2,
    destinationCountry: 'US',
    ...overrides,
  };
}

function getCost(
  overrides: Partial<ShipmentOrder> = {},
  isExpress = false,
  isFragile = false
): number {
  return calculateShippingCost(makeOrder(overrides), isExpress, isFragile);
}

function getDays(overrides: Partial<ShipmentOrder> = {}, isExpress = false): number {
  return getEstimatedDeliveryDays(makeOrder(overrides), isExpress);
}

function getDisplayName(overrides: Partial<ShipmentOrder> = {}): string {
  return getCarrierDisplayName(makeOrder(overrides));
}

function getSummary(
  overrides: Partial<ShipmentOrder> = {},
  isExpress = false,
  isFragile = false
): string {
  return getShipmentSummary(makeOrder(overrides), isExpress, isFragile);
}
// -------------------------------------------------------------------------

describe('calculateShippingCost', () => {
  it('computes the domestic base cost per carrier', () => {
    expect(getCost({ carrier: 'ups', weightKg: 2 })).toBeCloseTo(7.4, 2);
    expect(getCost({ carrier: 'fedex', weightKg: 2 })).toBeCloseTo(8.2, 2);
    expect(getCost({ carrier: 'usps', weightKg: 2 })).toBeCloseTo(5.8, 2);
    expect(getCost({ carrier: 'dhl', weightKg: 2 })).toBeCloseTo(9.6, 2);
    expect(getCost({ carrier: 'ontrac', weightKg: 2 })).toBeCloseTo(13, 2);
  });

  it('adds an international surcharge when shipping outside the home country', () => {
    expect(getCost({ carrier: 'ups', weightKg: 2, destinationCountry: 'CA' })).toBeCloseTo(22.4, 2);
    expect(getCost({ carrier: 'fedex', weightKg: 2, destinationCountry: 'CA' })).toBeCloseTo(26.2, 2);
    expect(getCost({ carrier: 'usps', weightKg: 2, destinationCountry: 'CA' })).toBeCloseTo(27.8, 2);
    expect(getCost({ carrier: 'dhl', weightKg: 2, destinationCountry: 'CA' })).toBeCloseTo(19.6, 2);
    expect(getCost({ carrier: 'ontrac', weightKg: 2, destinationCountry: 'CA' })).toBeCloseTo(33, 2);
  });

  it('applies the express multiplier on top of the base cost', () => {
    expect(getCost({ carrier: 'ups', weightKg: 2 }, true)).toBeCloseTo(12.95, 2);
    expect(getCost({ carrier: 'fedex', weightKg: 2 }, true)).toBeCloseTo(13.12, 2);
    expect(getCost({ carrier: 'usps', weightKg: 2 }, true)).toBeCloseTo(11.6, 2);
    expect(getCost({ carrier: 'dhl', weightKg: 2 }, true)).toBeCloseTo(14.4, 2);
    expect(getCost({ carrier: 'ontrac', weightKg: 2 }, true)).toBeCloseTo(19.5, 2);
  });

  it('adds a flat fragile handling fee', () => {
    expect(getCost({ carrier: 'ups', weightKg: 2 }, false, true)).toBeCloseTo(11.4, 2);
    expect(getCost({ carrier: 'fedex', weightKg: 2 }, false, true)).toBeCloseTo(11.7, 2);
    expect(getCost({ carrier: 'usps', weightKg: 2 }, false, true)).toBeCloseTo(7.8, 2);
    expect(getCost({ carrier: 'dhl', weightKg: 2 }, false, true)).toBeCloseTo(14.6, 2);
    expect(getCost({ carrier: 'ontrac', weightKg: 2 }, false, true)).toBeCloseTo(18, 2);
  });

  it('combines international, express, and fragile surcharges in order', () => {
    expect(
      getCost({ carrier: 'ups', weightKg: 2, destinationCountry: 'CA' }, true, true)
    ).toBeCloseTo(43.2, 2);
  });
});

describe('getEstimatedDeliveryDays', () => {
  it('returns the domestic estimate per carrier', () => {
    expect(getDays({ carrier: 'ups' })).toBe(3);
    expect(getDays({ carrier: 'fedex' })).toBe(2);
    expect(getDays({ carrier: 'usps' })).toBe(4);
    expect(getDays({ carrier: 'dhl' })).toBe(3);
    expect(getDays({ carrier: 'ontrac' })).toBe(5);
  });

  it('returns a longer estimate for international destinations', () => {
    expect(getDays({ carrier: 'ups', destinationCountry: 'CA' })).toBe(7);
    expect(getDays({ carrier: 'fedex', destinationCountry: 'CA' })).toBe(6);
    expect(getDays({ carrier: 'usps', destinationCountry: 'CA' })).toBe(10);
    expect(getDays({ carrier: 'dhl', destinationCountry: 'CA' })).toBe(5);
    expect(getDays({ carrier: 'ontrac', destinationCountry: 'CA' })).toBe(12);
  });

  it('halves the estimate (rounding up) for express shipments', () => {
    expect(getDays({ carrier: 'ups' }, true)).toBe(2);
    expect(getDays({ carrier: 'ups', destinationCountry: 'CA' }, true)).toBe(4);
    expect(getDays({ carrier: 'fedex' }, true)).toBe(1);
  });
});

describe('getCarrierDisplayName', () => {
  it('maps each known carrier code to a display label', () => {
    expect(getDisplayName({ carrier: 'ups' })).toBe('UPS');
    expect(getDisplayName({ carrier: 'fedex' })).toBe('FedEx');
    expect(getDisplayName({ carrier: 'usps' })).toBe('USPS');
    expect(getDisplayName({ carrier: 'dhl' })).toBe('DHL Express');
  });

  it('falls back to a generic label for an unrecognized carrier code', () => {
    expect(getDisplayName({ carrier: 'ontrac' })).toBe('Unknown Carrier');
  });
});

describe('getShipmentSummary', () => {
  it('pluralizes "days" when the estimate is more than one day', () => {
    expect(getSummary({ carrier: 'ups', weightKg: 2 })).toBe('UPS: $7.40 · 3 days');
  });

  it('uses the singular "day" when the estimate is exactly one day', () => {
    expect(getSummary({ carrier: 'fedex', weightKg: 2 }, true)).toBe('FedEx: $13.12 · 1 day');
  });
});
