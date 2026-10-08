// Fare upgrade eligibility + booking for AltitudeAir's "Upgrade My Seat"
// button. Shipped fast ahead of the holiday travel rush - loyalty wanted
// this live before the Thanksgiving spike, so it's a single pass: check
// the rules, and if everything lines up, grab the seat.

export type FareClass = "economy" | "premium_economy" | "business" | "first";

export type LoyaltyTier = "none" | "silver" | "gold" | "platinum";

export interface Passenger {
  id: string;
  loyaltyTier: LoyaltyTier;
  currentFareClass: FareClass;
  upgradesUsedThisTrip: number;
}

export interface Flight {
  id: string;
  seatsAvailable: Record<FareClass, number>;
}

const FARE_ORDER: FareClass[] = ["economy", "premium_economy", "business", "first"];

// How many fare-class steps a loyalty tier is allowed to upgrade across a
// single trip (not per call - there's nowhere higher than first class to
// go anyway, this just caps how far gold/silver members can jump).
const TIER_MAX_UPGRADE_STEPS: Record<LoyaltyTier, number> = {
  none: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
};

export interface UpgradeResult {
  eligible: boolean;
  newFareClass: FareClass | null;
  reason: string;
}

/**
 * Checks whether `passenger` can be upgraded to the next fare class up on
 * `flight`, and - if so - upgrades them.
 *
 * Wired directly to the "Upgrade My Seat" button in the booking app.
 */
export function evaluateUpgrade(flight: Flight, passenger: Passenger): UpgradeResult {
  const currentIndex = FARE_ORDER.indexOf(passenger.currentFareClass);

  if (currentIndex === FARE_ORDER.length - 1) {
    return {
      eligible: false,
      newFareClass: null,
      reason: "Already in the top fare class.",
    };
  }

  const maxSteps = TIER_MAX_UPGRADE_STEPS[passenger.loyaltyTier];
  if (maxSteps === 0) {
    return {
      eligible: false,
      newFareClass: null,
      reason: "Loyalty tier does not qualify for upgrades.",
    };
  }

  if (passenger.upgradesUsedThisTrip + 1 > maxSteps) {
    return {
      eligible: false,
      newFareClass: null,
      reason: "Upgrade would exceed this trip's allowed step count for the loyalty tier.",
    };
  }

  const targetFareClass = FARE_ORDER[currentIndex + 1];
  const seatsLeft = flight.seatsAvailable[targetFareClass];

  if (seatsLeft <= 0) {
    return {
      eligible: false,
      newFareClass: null,
      reason: "No seats available in target fare class.",
    };
  }

  // Everything checks out - take the seat.
  flight.seatsAvailable[targetFareClass] = seatsLeft - 1;
  passenger.currentFareClass = targetFareClass;
  passenger.upgradesUsedThisTrip += 1;

  return {
    eligible: true,
    newFareClass: targetFareClass,
    reason: "Upgrade applied.",
  };
}
