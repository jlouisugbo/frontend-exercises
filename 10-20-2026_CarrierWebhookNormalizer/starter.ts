// Webhook intake for Fleetline's multi-carrier shipment tracking board.
// Every carrier partner POSTs tracking updates to the same endpoint, each
// in its own shape; this is the function that turns whatever lands in the
// request body into the internal TrackingEvent our ops dashboard renders.
// Carrier integrations get bolted on in a hurry whenever sales closes a
// new partner, so this has grown by increments, not by design.

export interface TrackingEvent {
  shipmentId: string;
  carrier: string;
  status: 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  etaDate: Date;
  weightKg: number;
}

// The shape we expect, based on our first two carriers (Swiftship and
// Cargex), both of which send eta as an ISO 8601 string and weight as a
// bare number of kilograms.
interface RawCarrierPayload {
  shipment_id: string;
  carrier_code: string;
  status_code: number;
  data: {
    eta: string;
    weight: number;
  };
}

const STATUS_BY_CODE: Record<number, TrackingEvent['status']> = {
  1: 'in_transit',
  2: 'out_for_delivery',
  3: 'delivered',
  4: 'exception',
};

/**
 * Turns a raw webhook request body into a TrackingEvent the dashboard can
 * render. `body` comes straight off `req.body` as `unknown` - Express gives
 * us no guarantee about its shape, so this is the only place that's
 * supposed to find out what we actually got.
 */
export function normalizeTrackingEvent(body: unknown): TrackingEvent {
  const payload = body as RawCarrierPayload;

  const status = STATUS_BY_CODE[payload.status_code] ?? 'exception';

  return {
    shipmentId: payload.shipment_id,
    carrier: payload.carrier_code,
    status,
    etaDate: new Date(payload.data.eta),
    weightKg: payload.data.weight,
  };
}
