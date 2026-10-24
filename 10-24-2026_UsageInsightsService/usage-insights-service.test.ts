import { describe, it, expect } from 'vitest';
import { UsageInsightsService, AcmeMeterGateway } from './usageInsightsService';

// --- Seam -----------------------------------------------------------------
// This is the only place that knows how UsageInsightsService (and the
// gateway it talks to) get constructed and invoked. If you refactor how the
// service gets its meter-data dependency, update ONLY the helpers below -
// the test cases underneath should keep working unchanged as long as the
// observable numbers stay the same shape.

function makeService(): UsageInsightsService {
  return new UsageInsightsService();
}

function makeGateway(): AcmeMeterGateway {
  return new AcmeMeterGateway();
}

function dailySummaryFor(service: UsageInsightsService, accountId: string) {
  return service.getDailySummary(accountId);
}

function peakHourFor(service: UsageInsightsService, accountId: string) {
  return service.getPeakHour(accountId);
}

function aboveBaseline(service: UsageInsightsService, accountId: string, baselineKwh: number) {
  return service.isAboveBaseline(accountId, baselineKwh);
}

function tariffFor(gateway: AcmeMeterGateway, accountId: string) {
  return gateway.fetchTariff(accountId);
}
// ---------------------------------------------------------------------------

describe('getDailySummary', () => {
  it('sums interval readings into total kWh and cost at the account tariff rate', () => {
    const service = makeService();

    const summary = dailySummaryFor(service, 'acct-100');

    expect(summary.totalKwh).toBeCloseTo(11.8, 5);
    expect(summary.estimatedCost).toBeCloseTo(1.65, 2);
    expect(summary.currency).toBe('USD');
  });

  it('falls back to the default tariff and zero usage for an account Acme has nothing on file for', () => {
    const service = makeService();

    const summary = dailySummaryFor(service, 'acct-unknown');

    expect(summary.totalKwh).toBe(0);
    expect(summary.estimatedCost).toBe(0);
    expect(summary.currency).toBe('USD');
  });
});

describe('getPeakHour', () => {
  it('returns the hour with the highest reading', () => {
    const service = makeService();

    expect(peakHourFor(service, 'acct-100')).toBe(18);
  });

  it('returns null when there are no readings for the account', () => {
    const service = makeService();

    expect(peakHourFor(service, 'acct-unknown')).toBeNull();
  });
});

describe('isAboveBaseline', () => {
  it('returns true when total usage exceeds the baseline', () => {
    const service = makeService();

    expect(aboveBaseline(service, 'acct-100', 5)).toBe(true);
  });

  it('returns false when total usage is at or below the baseline', () => {
    const service = makeService();

    expect(aboveBaseline(service, 'acct-200', 10)).toBe(false);
  });
});

describe('AcmeMeterGateway', () => {
  it('returns the configured tariff for a known account', () => {
    const gateway = makeGateway();

    expect(tariffFor(gateway, 'acct-200')).toEqual({ ratePerKwh: 0.18, currency: 'USD' });
  });

  it('falls back to a default tariff for an account with no rate on file', () => {
    const gateway = makeGateway();

    expect(tariffFor(gateway, 'acct-unknown')).toEqual({ ratePerKwh: 0.15, currency: 'USD' });
  });
});
