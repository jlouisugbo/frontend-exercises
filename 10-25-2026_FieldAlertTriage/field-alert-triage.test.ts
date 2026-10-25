import { describe, it, expect } from 'vitest';
import { formatAlertHeadline, getAlertPriority, FieldAlert } from './fieldAlertTriage';

// --- Seam -------------------------------------------------------------
// This is the only place that knows how a FieldAlert gets built and how the
// two triage functions get called. If you refactor FieldAlert's shape (for
// example, into a tagged union), update ONLY the helpers below - the test
// cases underneath should keep working unchanged as long as the inputs and
// outputs described in each test still hold.

function makeAlert(overrides: Partial<FieldAlert> & { kind: string }): FieldAlert {
  return {
    id: 'alert-1',
    fieldName: 'North Forty',
    cropName: 'Soybeans',
    timestamp: 1_700_000_000_000,
    ...overrides,
  };
}

function headlineFor(alert: FieldAlert): string {
  return formatAlertHeadline(alert);
}

function priorityFor(alert: FieldAlert): number {
  return getAlertPriority(alert);
}
// ------------------------------------------------------------------------

describe('formatAlertHeadline', () => {
  it('describes a low-moisture alert with the level and threshold', () => {
    const alert = makeAlert({
      kind: 'low-moisture',
      fieldName: 'North Forty',
      cropName: 'Soybeans',
      moistureLevel: 18,
      moistureThreshold: 30,
    });

    expect(headlineFor(alert)).toBe('North Forty: Soybeans moisture at 18% (below 30%)');
  });

  it('describes a frost-risk alert with the forecast low and frost line', () => {
    const alert = makeAlert({
      kind: 'frost-risk',
      fieldName: 'Orchard Block 3',
      cropName: 'Peaches',
      forecastLowTemp: 29,
      frostThreshold: 34,
    });

    expect(headlineFor(alert)).toBe(
      'Orchard Block 3: forecast low 29°F threatens Peaches (frost line 34°F)',
    );
  });

  it('describes a pest-detected alert with the severity and species', () => {
    const alert = makeAlert({
      kind: 'pest-detected',
      fieldName: 'South Forty',
      cropName: 'Cotton',
      pestSpecies: 'aphid',
      infestationSeverity: 'moderate',
    });

    expect(headlineFor(alert)).toBe('South Forty: moderate aphid activity on Cotton');
  });

  it('falls back to a generic message for a kind it does not recognize', () => {
    const alert = makeAlert({ kind: 'equipment-fault', fieldName: 'Greenhouse 2' });

    expect(headlineFor(alert)).toBe('Greenhouse 2: unrecognized alert (equipment-fault)');
  });
});

describe('getAlertPriority', () => {
  describe('low-moisture', () => {
    it('scores a large deficit as highest priority', () => {
      const alert = makeAlert({ kind: 'low-moisture', moistureLevel: 10, moistureThreshold: 30 });
      expect(priorityFor(alert)).toBe(9);
    });

    it('scores a moderate deficit as medium priority', () => {
      const alert = makeAlert({ kind: 'low-moisture', moistureLevel: 22, moistureThreshold: 30 });
      expect(priorityFor(alert)).toBe(6);
    });

    it('scores a small deficit as low priority', () => {
      const alert = makeAlert({ kind: 'low-moisture', moistureLevel: 28, moistureThreshold: 30 });
      expect(priorityFor(alert)).toBe(3);
    });
  });

  describe('frost-risk', () => {
    it('scores a forecast well below the frost line as highest priority', () => {
      const alert = makeAlert({ kind: 'frost-risk', forecastLowTemp: 20, frostThreshold: 34 });
      expect(priorityFor(alert)).toBe(10);
    });

    it('scores a forecast at or just below the frost line as medium priority', () => {
      const alert = makeAlert({ kind: 'frost-risk', forecastLowTemp: 32, frostThreshold: 34 });
      expect(priorityFor(alert)).toBe(7);
    });

    it('scores a forecast above the frost line as low priority', () => {
      const alert = makeAlert({ kind: 'frost-risk', forecastLowTemp: 40, frostThreshold: 34 });
      expect(priorityFor(alert)).toBe(2);
    });
  });

  describe('pest-detected', () => {
    it('scores a heavy infestation as high priority', () => {
      const alert = makeAlert({ kind: 'pest-detected', infestationSeverity: 'heavy' });
      expect(priorityFor(alert)).toBe(8);
    });

    it('scores a moderate infestation as medium priority', () => {
      const alert = makeAlert({ kind: 'pest-detected', infestationSeverity: 'moderate' });
      expect(priorityFor(alert)).toBe(5);
    });

    it('scores a light (or unset) infestation as low priority', () => {
      const alert = makeAlert({ kind: 'pest-detected' });
      expect(priorityFor(alert)).toBe(2);
    });
  });

  it('scores a kind it does not recognize as the lowest priority', () => {
    const alert = makeAlert({ kind: 'equipment-fault' });
    expect(priorityFor(alert)).toBe(1);
  });
});
