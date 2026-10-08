import { describe, it, expect } from 'vitest';
import { evaluateUpgrade, type Flight, type Passenger, type FareClass } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how a Flight/Passenger get built and
// how an eligibility check gets made. If you refactor evaluateUpgrade
// (split it, rename it, change its signature), update ONLY the helpers
// below - the test cases underneath should keep working unchanged as long
// as the observable eligibility/seat-consumption behavior stays the same
// shape.

function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'AA100',
    seatsAvailable: {
      economy: 20,
      premium_economy: 4,
      business: 2,
      first: 1,
    },
    ...overrides,
  };
}

function makePassenger(overrides: Partial<Passenger> = {}): Passenger {
  return {
    id: 'p1',
    loyaltyTier: 'gold',
    currentFareClass: 'economy',
    upgradesUsedThisTrip: 0,
    ...overrides,
  };
}

function attemptUpgrade(flight: Flight, passenger: Passenger) {
  return evaluateUpgrade(flight, passenger);
}

function seatsFor(flight: Flight, fareClass: FareClass): number {
  return flight.seatsAvailable[fareClass];
}
// -------------------------------------------------------------------------

describe('evaluateUpgrade', () => {
  it('rejects a passenger already in the top fare class', () => {
    const flight = makeFlight();
    const passenger = makePassenger({ currentFareClass: 'first' });

    const result = attemptUpgrade(flight, passenger);

    expect(result.eligible).toBe(false);
    expect(result.newFareClass).toBeNull();
    expect(result.reason).toMatch(/top fare class/i);
  });

  it('rejects a passenger whose loyalty tier does not qualify for upgrades', () => {
    const flight = makeFlight();
    const passenger = makePassenger({ loyaltyTier: 'none' });

    const result = attemptUpgrade(flight, passenger);

    expect(result.eligible).toBe(false);
    expect(result.newFareClass).toBeNull();
    expect(result.reason).toMatch(/loyalty tier/i);
  });

  it("rejects an upgrade that would exceed the tier's allowed steps for this trip", () => {
    const flight = makeFlight();
    const passenger = makePassenger({ loyaltyTier: 'silver', upgradesUsedThisTrip: 1 });

    const result = attemptUpgrade(flight, passenger);

    expect(result.eligible).toBe(false);
    expect(result.newFareClass).toBeNull();
    expect(result.reason).toMatch(/step count/i);
  });

  it('rejects an upgrade when the target fare class has no seats left', () => {
    const flight = makeFlight({
      seatsAvailable: { economy: 20, premium_economy: 0, business: 2, first: 1 },
    });
    const passenger = makePassenger();

    const result = attemptUpgrade(flight, passenger);

    expect(result.eligible).toBe(false);
    expect(result.newFareClass).toBeNull();
    expect(result.reason).toMatch(/no seats available/i);
  });

  it('upgrades an eligible passenger and consumes a seat in the target class', () => {
    const flight = makeFlight();
    const passenger = makePassenger();

    const result = attemptUpgrade(flight, passenger);

    expect(result.eligible).toBe(true);
    expect(result.newFareClass).toBe('premium_economy');
    expect(result.reason).toMatch(/upgrade applied/i);
    expect(passenger.currentFareClass).toBe('premium_economy');
    expect(passenger.upgradesUsedThisTrip).toBe(1);
    expect(seatsFor(flight, 'premium_economy')).toBe(3);
  });
});
