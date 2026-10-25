// AgriPulse's field-alert feed shows growers a stream of problems detected by soil
// sensors, weather inputs, and scouting reports: moisture dropping below a crop's
// safe threshold, a frost warning for the night ahead, or a pest sighting that needs
// following up. The live feed and the dispatch queue (which decides who gets paged
// first) each need to turn a raw alert into something human-facing, so there are two
// functions here doing roughly the same kind of per-alert-type reasoning.

export interface FieldAlert {
  id: string;
  kind: string; // 'low-moisture' | 'frost-risk' | 'pest-detected'
  fieldName: string;
  cropName: string;
  timestamp: number;
  moistureLevel?: number; // percent, only set for 'low-moisture'
  moistureThreshold?: number; // percent, only set for 'low-moisture'
  forecastLowTemp?: number; // fahrenheit, only set for 'frost-risk'
  frostThreshold?: number; // fahrenheit, only set for 'frost-risk'
  pestSpecies?: string; // only set for 'pest-detected'
  infestationSeverity?: 'light' | 'moderate' | 'heavy'; // only set for 'pest-detected'
}

/**
 * Builds the one-line headline shown in the live alert feed.
 */
export function formatAlertHeadline(alert: FieldAlert): string {
  if (alert.kind === 'low-moisture') {
    const level = alert.moistureLevel ?? 0;
    const threshold = alert.moistureThreshold ?? 0;
    return `${alert.fieldName}: ${alert.cropName} moisture at ${level}% (below ${threshold}%)`;
  } else if (alert.kind === 'frost-risk') {
    const low = alert.forecastLowTemp ?? 32;
    const threshold = alert.frostThreshold ?? 32;
    return `${alert.fieldName}: forecast low ${low}°F threatens ${alert.cropName} (frost line ${threshold}°F)`;
  } else if (alert.kind === 'pest-detected') {
    const severity = alert.infestationSeverity ?? 'light';
    return `${alert.fieldName}: ${severity} ${alert.pestSpecies ?? 'pest'} activity on ${alert.cropName}`;
  } else {
    return `${alert.fieldName}: unrecognized alert (${alert.kind})`;
  }
}

/**
 * Scores an alert 1-10 for the dispatch queue - higher means it gets paged first.
 * This branches on the same `kind` field as formatAlertHeadline above, but it's a
 * separate function read by a different team (the on-call rotation, not the ops
 * dashboard), so its chain has drifted to check slightly different things.
 */
export function getAlertPriority(alert: FieldAlert): number {
  if (alert.kind === 'low-moisture') {
    const level = alert.moistureLevel ?? 0;
    const threshold = alert.moistureThreshold ?? 0;
    const deficit = threshold - level;
    if (deficit >= 15) return 9;
    if (deficit >= 5) return 6;
    return 3;
  } else if (alert.kind === 'frost-risk') {
    const low = alert.forecastLowTemp ?? 32;
    const threshold = alert.frostThreshold ?? 32;
    if (low <= threshold - 5) return 10;
    if (low <= threshold) return 7;
    return 2;
  } else if (alert.kind === 'pest-detected') {
    switch (alert.infestationSeverity) {
      case 'heavy':
        return 8;
      case 'moderate':
        return 5;
      default:
        return 2;
    }
  } else {
    return 1;
  }
}
