import { describe, it, expect } from 'vitest';
import { requestRollout, type Device, type RolloutWave } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how a Device/RolloutWave get built and
// how a rollout attempt gets made. If you refactor requestRollout (split
// it, rename it, change its signature), update ONLY the helpers below -
// the test cases underneath should keep working unchanged as long as the
// observable eligibility/scheduling behavior stays the same shape.

const DEFAULT_NOW = new Date('2026-10-11T12:00:00Z');

function makeDevice(overrides: Partial<Device> = {}): Device {
  return {
    id: 'device-5521',
    name: 'Lobby Thermostat',
    firmwareVersion: '3.2.0',
    status: 'online',
    powerSource: 'battery',
    batteryPercent: 80,
    pendingUpdateCount: 0,
    ...overrides,
  };
}

function makeWave(overrides: Partial<RolloutWave> = {}): RolloutWave {
  return {
    id: 'wave-14',
    targetFirmwareVersion: '3.3.0',
    minBatteryPercent: 40,
    capacityRemaining: 5,
    scheduledDeviceIds: [],
    blackoutUntil: null,
    ...overrides,
  };
}

function runRollout(device: Device, wave: RolloutWave, now: Date = DEFAULT_NOW) {
  return requestRollout(device, wave, now);
}

function scheduledIdsFor(wave: RolloutWave): RolloutWave['scheduledDeviceIds'] {
  return wave.scheduledDeviceIds;
}
// -------------------------------------------------------------------------

describe('requestRollout', () => {
  it('rejects a device that is not online', () => {
    const device = makeDevice({ status: 'offline' });
    const wave = makeWave();

    const result = runRollout(device, wave);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/online/i);
  });

  it('rejects a device already running the target firmware version', () => {
    const device = makeDevice({ firmwareVersion: '3.3.0' });
    const wave = makeWave();

    const result = runRollout(device, wave);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/already running/i);
  });

  it("rejects a battery-powered device below the wave's minimum charge", () => {
    const device = makeDevice({ powerSource: 'battery', batteryPercent: 25 });
    const wave = makeWave({ minBatteryPercent: 40 });

    const result = runRollout(device, wave);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/battery/i);
  });

  it('does not apply the battery threshold to a mains-powered device', () => {
    const device = makeDevice({ powerSource: 'mains', batteryPercent: 0 });
    const wave = makeWave({ minBatteryPercent: 40, capacityRemaining: 2 });

    const result = runRollout(device, wave);

    expect(result.eligible).toBe(true);
  });

  it('rejects a device while the wave is inside its maintenance freeze window', () => {
    const device = makeDevice();
    const wave = makeWave({ blackoutUntil: '2026-10-11T18:00:00Z' });

    const result = runRollout(device, wave, new Date('2026-10-11T12:00:00Z'));

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/freeze/i);
  });

  it('allows a device once the maintenance freeze window has passed', () => {
    const device = makeDevice();
    const wave = makeWave({ blackoutUntil: '2026-10-11T06:00:00Z', capacityRemaining: 2 });

    const result = runRollout(device, wave, new Date('2026-10-11T12:00:00Z'));

    expect(result.eligible).toBe(true);
  });

  it('rejects a device that already has an update pending', () => {
    const device = makeDevice({ pendingUpdateCount: 1 });
    const wave = makeWave();

    const result = runRollout(device, wave);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/pending/i);
  });

  it('rejects a device when the wave has no remaining capacity', () => {
    const device = makeDevice();
    const wave = makeWave({ capacityRemaining: 0 });

    const result = runRollout(device, wave);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/capacity/i);
  });

  it('schedules an eligible device and consumes wave capacity', () => {
    const device = makeDevice();
    const wave = makeWave({ capacityRemaining: 5 });

    const result = runRollout(device, wave);

    expect(result.eligible).toBe(true);
    expect(result.reason).toMatch(/scheduled/i);
    expect(wave.capacityRemaining).toBe(4);
    expect(scheduledIdsFor(wave)).toEqual(['device-5521']);
    expect(device.pendingUpdateCount).toBe(1);
  });
});
