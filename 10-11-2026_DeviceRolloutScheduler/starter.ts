// Firmware rollout eligibility + scheduling for Lumen Home's fleet
// dashboard. Wired straight to the per-device "Push Update" button since
// the first wave went out - one pass: check the rules, and if everything
// lines up, schedule it.

export interface Device {
  id: string;
  name: string;
  firmwareVersion: string;
  status: "online" | "offline" | "maintenance";
  powerSource: "battery" | "mains";
  batteryPercent: number; // 0-100; only meaningful for battery-powered devices
  pendingUpdateCount: number;
}

export interface RolloutWave {
  id: string;
  targetFirmwareVersion: string;
  minBatteryPercent: number;
  capacityRemaining: number;
  scheduledDeviceIds: string[];
  blackoutUntil: string | null; // ISO timestamp; null when no freeze is active
}

export interface RolloutResult {
  eligible: boolean;
  reason: string;
}

/**
 * Checks whether `device` can join `wave`, and - if so - schedules it.
 *
 * Wired directly to the "Push Update" button on a device's row in the
 * fleet dashboard.
 */
export function requestRollout(device: Device, wave: RolloutWave, now: Date): RolloutResult {
  if (device.status !== "online") {
    return {
      eligible: false,
      reason: "Device must be online to receive an update.",
    };
  }

  if (device.firmwareVersion === wave.targetFirmwareVersion) {
    return {
      eligible: false,
      reason: "Device is already running the target firmware version.",
    };
  }

  if (device.powerSource === "battery" && device.batteryPercent < wave.minBatteryPercent) {
    return {
      eligible: false,
      reason: "Battery is too low to risk an update right now.",
    };
  }

  if (wave.blackoutUntil && now.getTime() < new Date(wave.blackoutUntil).getTime()) {
    return {
      eligible: false,
      reason: "This wave is in a maintenance freeze window.",
    };
  }

  if (device.pendingUpdateCount > 0) {
    return {
      eligible: false,
      reason: "Device already has an update pending.",
    };
  }

  if (wave.capacityRemaining <= 0) {
    return {
      eligible: false,
      reason: "This rollout wave has no remaining capacity.",
    };
  }

  // Everything checks out - schedule it.
  wave.capacityRemaining -= 1;
  wave.scheduledDeviceIds.push(device.id);
  device.pendingUpdateCount += 1;

  return {
    eligible: true,
    reason: "Device scheduled for update.",
  };
}
