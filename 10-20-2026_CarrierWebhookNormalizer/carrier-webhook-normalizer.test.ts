import { describe, it, expect } from 'vitest';
import { normalizeTrackingEvent, type TrackingEvent } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how a raw webhook body gets built and
// how normalizeTrackingEvent gets invoked and read back. If you refactor
// (add runtime validation, change RawCarrierPayload, change how eta/weight
// get parsed, etc.), update ONLY the helpers below - the test cases
// underneath should keep working unchanged as long as the observable
// TrackingEvent shape and values stay the same.

interface RawPayloadOverrides {
  shipment_id?: string;
  carrier_code?: string;
  status_code?: number;
  data?: Partial<{ eta: string | null; weight: number | string }>;
}

function rawPayload(overrides: RawPayloadOverrides = {}): unknown {
  return {
    shipment_id: overrides.shipment_id ?? 'SS-1001',
    carrier_code: overrides.carrier_code ?? 'swiftship',
    status_code: overrides.status_code ?? 1,
    data: {
      eta: '2026-10-25T14:00:00.000Z',
      weight: 12.4,
      ...overrides.data,
    },
  };
}

function normalize(body: unknown): TrackingEvent {
  return normalizeTrackingEvent(body);
}

function statusOf(event: TrackingEvent): TrackingEvent['status'] {
  return event.status;
}

function etaIsoOf(event: TrackingEvent): string {
  return event.etaDate.toISOString();
}

// Read as `unknown` rather than `number` on purpose, so this seam can
// surface whatever actually comes back at runtime without the test file
// itself fighting the type checker to find out.
function weightValueOf(event: TrackingEvent): unknown {
  return event.weightKg;
}
// -------------------------------------------------------------------------

describe('normalizeTrackingEvent - status mapping', () => {
  it('maps each known status code', () => {
    expect(statusOf(normalize(rawPayload({ status_code: 1 })))).toBe('in_transit');
    expect(statusOf(normalize(rawPayload({ status_code: 2 })))).toBe('out_for_delivery');
    expect(statusOf(normalize(rawPayload({ status_code: 3 })))).toBe('delivered');
    expect(statusOf(normalize(rawPayload({ status_code: 4 })))).toBe('exception');
  });

  it('falls back to exception for an unrecognized status code', () => {
    expect(statusOf(normalize(rawPayload({ status_code: 99 })))).toBe('exception');
  });
});

describe('normalizeTrackingEvent - eta', () => {
  it('parses a Swiftship/Cargex ISO eta string correctly', () => {
    const result = normalize(rawPayload());
    expect(etaIsoOf(result)).toBe('2026-10-25T14:00:00.000Z');
  });

  it('currently resolves a missing (null) eta to the unix epoch rather than an explicit "unknown" state', () => {
    // Driftline marks a shipment as "not yet scheduled" with `eta: null`
    // instead of an ISO string. This captures what the code actually does
    // with that today.
    const result = normalize(
      rawPayload({ carrier_code: 'driftline', data: { eta: null, weight: 8 } })
    );
    expect(etaIsoOf(result)).toBe('1970-01-01T00:00:00.000Z');
  });
});

describe('normalizeTrackingEvent - weight', () => {
  it('passes a Swiftship/Cargex numeric weight through unchanged', () => {
    const result = normalize(rawPayload({ data: { weight: 12.4 } }));
    expect(weightValueOf(result)).toBe(12.4);
  });

  it('currently passes a Driftline formatted weight string through as-is, not a number', () => {
    // Driftline's legacy export sends weight as "12.4 kg" instead of a bare
    // number. Nothing in normalizeTrackingEvent notices or converts it.
    const result = normalize(
      rawPayload({ carrier_code: 'driftline', data: { weight: '12.4 kg' } })
    );
    expect(weightValueOf(result)).toBe('12.4 kg');
  });
});

describe('normalizeTrackingEvent - identifying fields', () => {
  it('carries shipment id and carrier code through', () => {
    const result = normalize(rawPayload({ shipment_id: 'CX-2002', carrier_code: 'cargex' }));
    expect(result.shipmentId).toBe('CX-2002');
    expect(result.carrier).toBe('cargex');
  });
});
