// Shipment pricing & delivery estimation logic for the Logistics Ops dashboard.
// NOTE: carrier rates get updated quarterly - ping #logistics-ops before changing base rates.

export interface ShipmentOrder {
  id: string;
  carrier: string; // e.g. 'ups', 'fedex', 'usps', 'dhl'
  weightKg: number;
  destinationCountry: string; // ISO country code, e.g. 'US'
}

type Carrier = {
  base: number
  weightMult: number;
  notHomeCountry: number;
  expressMult: number;
  fragileAdd: number;
  intlDays: number;
  domesticDays: number;
  label: string;
}

const carriers: Record<string, Carrier> = {
  'ups': {
    base: 5,
    weightMult: 1.2,
    notHomeCountry: 15,
    expressMult: 1.75,
    fragileAdd: 4,
    intlDays: 7,
    domesticDays: 3,
    label: "UPS",
  }, 
  'fedex': {
    base: 6,
    weightMult: 1.1,
    notHomeCountry: 18,
    expressMult: 1.6,
    fragileAdd: 3.5,
    intlDays: 6,
    domesticDays: 2,
    label: "FedEx"
  },
  'usps': {
    base: 4,
    weightMult: 0.9,
    notHomeCountry: 22,
    expressMult: 2.0,
    fragileAdd: 2,
    intlDays: 10,
    domesticDays: 4,
    label: "USPS",
  },
  'dhl': {
    base: 7,
    weightMult: 1.3,
    notHomeCountry: 10,
    expressMult: 1.5,
    fragileAdd: 5,
    intlDays: 5,
    domesticDays: 3,
    label: "DHL Express"
  },
  fallback: {
    base: 10,
    weightMult: 1.5,
    notHomeCountry: 20,
    expressMult: 1.5,
    fragileAdd: 5,
    intlDays: 12,
    domesticDays: 5,
    label: "Unknown Carrier"
  }
}

const HOME_COUNTRY = 'US';

export function calculateShippingCost(
  order: ShipmentOrder,
  isExpress: boolean,
  isFragile: boolean
): number {
  let base = 0;
  const carrier = carriers[order.carrier] ?? carriers.fallback;
  base = carrier.base + order.weightKg * carrier.weightMult
  if (order.destinationCountry !== HOME_COUNTRY) {
    base += carrier.notHomeCountry;
  }
  if (isExpress) {
    base *= carrier.expressMult;
  }
  if (isFragile) {
    base += carrier.fragileAdd;
  }
  return Math.round(base * 100) / 100;
}

export function getEstimatedDeliveryDays(order: ShipmentOrder, isExpress: boolean): number {
  let days: number;
  const carrier = carriers[order.carrier] ?? carriers.fallback
  days = order.destinationCountry !== HOME_COUNTRY ? carrier.intlDays : carrier.domesticDays
  if (isExpress) days = Math.ceil(days / 2);
  return days;
}

export function getCarrierDisplayName(order: ShipmentOrder): string {
  return (carriers[order.carrier] ?? carriers.fallback).label
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
