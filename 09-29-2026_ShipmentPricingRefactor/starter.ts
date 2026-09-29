// Shipment pricing & delivery estimation logic for the Logistics Ops dashboard.
// NOTE: carrier rates get updated quarterly - ping #logistics-ops before changing base rates.

export interface ShipmentOrder {
  id: string;
  carrier: string; // e.g. 'ups', 'fedex', 'usps', 'dhl'
  weightKg: number;
  destinationCountry: string; // ISO country code, e.g. 'US'
}

const HOME_COUNTRY = 'US';

export function calculateShippingCost(
  order: ShipmentOrder,
  isExpress: boolean,
  isFragile: boolean
): number {
  let base = 0;

  if (order.carrier === 'ups') {
    base = 5 + order.weightKg * 1.2;
    if (order.destinationCountry !== HOME_COUNTRY) {
      base += 15;
    }
    if (isExpress) {
      base *= 1.75;
    }
    if (isFragile) {
      base += 4;
    }
  } else if (order.carrier === 'fedex') {
    base = 6 + order.weightKg * 1.1;
    if (order.destinationCountry !== HOME_COUNTRY) {
      base += 18;
    }
    if (isExpress) {
      base *= 1.6;
    }
    if (isFragile) {
      base += 3.5;
    }
  } else if (order.carrier === 'usps') {
    base = 4 + order.weightKg * 0.9;
    if (order.destinationCountry !== HOME_COUNTRY) {
      base += 22;
    }
    if (isExpress) {
      base *= 2.0;
    }
    if (isFragile) {
      base += 2;
    }
  } else if (order.carrier === 'dhl') {
    base = 7 + order.weightKg * 1.3;
    if (order.destinationCountry !== HOME_COUNTRY) {
      base += 10;
    }
    if (isExpress) {
      base *= 1.5;
    }
    if (isFragile) {
      base += 5;
    }
  } else {
    // Unknown carrier code - flat fallback rate. Also what a typo'd
    // carrier string silently falls into.
    base = 10 + order.weightKg * 1.5;
    if (order.destinationCountry !== HOME_COUNTRY) {
      base += 20;
    }
    if (isExpress) {
      base *= 1.5;
    }
    if (isFragile) {
      base += 5;
    }
  }

  return Math.round(base * 100) / 100;
}

export function getEstimatedDeliveryDays(order: ShipmentOrder, isExpress: boolean): number {
  let days: number;

  if (order.carrier === 'ups') {
    days = order.destinationCountry !== HOME_COUNTRY ? 7 : 3;
    if (isExpress) days = Math.ceil(days / 2);
  } else if (order.carrier === 'fedex') {
    days = order.destinationCountry !== HOME_COUNTRY ? 6 : 2;
    if (isExpress) days = Math.ceil(days / 2);
  } else if (order.carrier === 'usps') {
    days = order.destinationCountry !== HOME_COUNTRY ? 10 : 4;
    if (isExpress) days = Math.ceil(days / 2);
  } else if (order.carrier === 'dhl') {
    days = order.destinationCountry !== HOME_COUNTRY ? 5 : 3;
    if (isExpress) days = Math.ceil(days / 2);
  } else {
    days = order.destinationCountry !== HOME_COUNTRY ? 12 : 5;
    if (isExpress) days = Math.ceil(days / 2);
  }

  return days;
}

export function getCarrierDisplayName(order: ShipmentOrder): string {
  if (order.carrier === 'ups') return 'UPS';
  if (order.carrier === 'fedex') return 'FedEx';
  if (order.carrier === 'usps') return 'USPS';
  if (order.carrier === 'dhl') return 'DHL Express';
  return 'Unknown Carrier';
}

// Used by the shipment summary card to build a one-line label.
export function getShipmentSummary(
  order: ShipmentOrder,
  isExpress: boolean,
  isFragile: boolean
): string {
  const cost = calculateShippingCost(order, isExpress, isFragile);
  const days = getEstimatedDeliveryDays(order, isExpress);
  const name = getCarrierDisplayName(order);
  return `${name}: $${cost.toFixed(2)} · ${days} day${days === 1 ? '' : 's'}`;
}
