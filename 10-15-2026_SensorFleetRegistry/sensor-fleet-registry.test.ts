import { describe, it, expect } from 'vitest';
import { FleetRegistry, type Device, type SensorReading } from './starter';

// --- Seam ---------------------------------------------------------------
// The only place that knows how a registry gets constructed. If you refactor
// FleetRegistry's internals (or the id types its methods accept), update
// ONLY this helper - the test cases below should keep working unchanged as
// long as FleetRegistry keeps its current exported name and public methods.
function makeRegistry(): FleetRegistry {
  return new FleetRegistry();
}
// -------------------------------------------------------------------------

const gatewayA: Device = { id: 'gw-a', name: 'North Rack Gateway', siteId: 'site-1' };
const gatewayB: Device = { id: 'gw-b', name: 'South Rack Gateway', siteId: 'site-1' };

function reading(sensorId: string, value: number): SensorReading {
  return { sensorId, value, unit: 'C', timestamp: 1000 };
}

describe('attachSensor', () => {
  it('fails to attach to a device that was never registered', () => {
    const registry = makeRegistry();
    expect(registry.attachSensor('unknown-gw', 'sensor-1')).toBe(false);
  });

  it('fails to attach the same sensor to a device twice', () => {
    const registry = makeRegistry();
    registry.registerDevice(gatewayA);
    registry.attachSensor(gatewayA.id, 'sensor-1');

    expect(registry.attachSensor(gatewayA.id, 'sensor-1')).toBe(false);
  });

  it('attaches a sensor to a registered device', () => {
    const registry = makeRegistry();
    registry.registerDevice(gatewayA);

    expect(registry.attachSensor(gatewayA.id, 'sensor-1')).toBe(true);
  });
});

describe('recordReading', () => {
  it('rejects a reading for a sensor that is not wired into any device', () => {
    const registry = makeRegistry();
    registry.registerDevice(gatewayA);

    expect(registry.recordReading(reading('sensor-1', 72))).toBe(false);
  });

  it('records a reading for a sensor that is wired in', () => {
    const registry = makeRegistry();
    registry.registerDevice(gatewayA);
    registry.attachSensor(gatewayA.id, 'sensor-1');

    expect(registry.recordReading(reading('sensor-1', 72))).toBe(true);
  });
});

describe('getLatestReadingForDevice', () => {
  it('returns undefined for a device that was never registered', () => {
    const registry = makeRegistry();
    expect(registry.getLatestReadingForDevice('unknown-gw')).toBeUndefined();
  });

  it('returns undefined for a registered device with no sensors attached', () => {
    const registry = makeRegistry();
    registry.registerDevice(gatewayA);

    expect(registry.getLatestReadingForDevice(gatewayA.id)).toBeUndefined();
  });

  it('returns undefined when the attached sensor has no reading yet', () => {
    const registry = makeRegistry();
    registry.registerDevice(gatewayA);
    registry.attachSensor(gatewayA.id, 'sensor-1');

    expect(registry.getLatestReadingForDevice(gatewayA.id)).toBeUndefined();
  });

  it("returns the first-attached sensor's latest reading", () => {
    const registry = makeRegistry();
    registry.registerDevice(gatewayA);
    registry.attachSensor(gatewayA.id, 'sensor-1');
    registry.recordReading(reading('sensor-1', 72));

    expect(registry.getLatestReadingForDevice(gatewayA.id)).toEqual(reading('sensor-1', 72));
  });
});

describe('moveSensor', () => {
  it('fails when the source device is unknown', () => {
    const registry = makeRegistry();
    registry.registerDevice(gatewayB);

    expect(registry.moveSensor('sensor-1', 'unknown-gw', gatewayB.id)).toBe(false);
  });

  it('fails when the destination device is unknown', () => {
    const registry = makeRegistry();
    registry.registerDevice(gatewayA);
    registry.attachSensor(gatewayA.id, 'sensor-1');

    expect(registry.moveSensor('sensor-1', gatewayA.id, 'unknown-gw')).toBe(false);
  });

  it('fails when the sensor is not actually attached to the source device', () => {
    const registry = makeRegistry();
    registry.registerDevice(gatewayA);
    registry.registerDevice(gatewayB);

    expect(registry.moveSensor('sensor-1', gatewayA.id, gatewayB.id)).toBe(false);
  });

  it('moves a sensor from one device to another', () => {
    const registry = makeRegistry();
    registry.registerDevice(gatewayA);
    registry.registerDevice(gatewayB);
    registry.attachSensor(gatewayA.id, 'sensor-1');
    registry.recordReading(reading('sensor-1', 72));

    expect(registry.moveSensor('sensor-1', gatewayA.id, gatewayB.id)).toBe(true);
    expect(registry.getLatestReadingForDevice(gatewayA.id)).toBeUndefined();
    expect(registry.getLatestReadingForDevice(gatewayB.id)).toEqual(reading('sensor-1', 72));

    // the sensor is gone from gatewayA's list now, so moving it again from
    // there should fail the same way an unattached sensor would
    expect(registry.moveSensor('sensor-1', gatewayA.id, gatewayB.id)).toBe(false);
  });
});
