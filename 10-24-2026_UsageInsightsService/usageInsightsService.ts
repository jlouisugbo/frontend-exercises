// Usage Insights powers the "How am I doing this month?" card on BrightGrid's
// account dashboard: total usage, estimated cost, peak hour, and whether
// the account is running hot against a baseline. It's only ever had one
// meter-data vendor to deal with, so nobody's had a reason to pull that
// dependency apart from the math that uses it.

export interface IntervalReading {
  hour: number; // 0-23, local hour of day
  kwh: number;
}

export interface Tariff {
  ratePerKwh: number;
  currency: string;
}

/**
 * Thin wrapper around Acme Meter Co.'s metering API - the vendor BrightGrid
 * has used since launch. Stands in for a real network call with a small
 * in-memory fixture so the rest of the app (and these tests) don't need
 * one.
 */
export class AcmeMeterGateway {
  private readonly fixtures: Record<string, IntervalReading[]> = {
    'acct-100': [
      { hour: 0, kwh: 0.4 },
      { hour: 1, kwh: 0.3 },
      { hour: 2, kwh: 0.3 },
      { hour: 17, kwh: 2.1 },
      { hour: 18, kwh: 3.4 },
      { hour: 19, kwh: 2.8 },
      { hour: 20, kwh: 1.6 },
      { hour: 21, kwh: 0.9 },
    ],
    'acct-200': [
      { hour: 6, kwh: 0.5 },
      { hour: 7, kwh: 1.1 },
      { hour: 8, kwh: 0.6 },
      { hour: 22, kwh: 0.4 },
      { hour: 23, kwh: 0.3 },
    ],
  };

  private readonly tariffs: Record<string, Tariff> = {
    'acct-100': { ratePerKwh: 0.14, currency: 'USD' },
    'acct-200': { ratePerKwh: 0.18, currency: 'USD' },
  };

  fetchIntervalReadings(accountId: string): IntervalReading[] {
    return this.fixtures[accountId] ?? [];
  }

  fetchTariff(accountId: string): Tariff {
    return this.tariffs[accountId] ?? { ratePerKwh: 0.15, currency: 'USD' };
  }
}

export interface DailySummary {
  totalKwh: number;
  estimatedCost: number;
  currency: string;
}

/**
 * Computes the numbers that show up on the dashboard card. Everything here
 * is just arithmetic over whatever AcmeMeterGateway hands back.
 */
export class UsageInsightsService {
  private readonly gateway = new AcmeMeterGateway();

  getDailySummary(accountId: string): DailySummary {
    const readings = this.gateway.fetchIntervalReadings(accountId);
    const tariff = this.gateway.fetchTariff(accountId);
    const totalKwh = readings.reduce((sum, r) => sum + r.kwh, 0);
    return {
      totalKwh: round2(totalKwh),
      estimatedCost: round2(totalKwh * tariff.ratePerKwh),
      currency: tariff.currency,
    };
  }

  getPeakHour(accountId: string): number | null {
    const readings = this.gateway.fetchIntervalReadings(accountId);
    if (readings.length === 0) {
      return null;
    }
    return readings.reduce((peak, r) => (r.kwh > peak.kwh ? r : peak)).hour;
  }

  isAboveBaseline(accountId: string, baselineKwh: number): boolean {
    const readings = this.gateway.fetchIntervalReadings(accountId);
    const totalKwh = readings.reduce((sum, r) => sum + r.kwh, 0);
    return totalKwh > baselineKwh;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
