// Registry for Northstar's field gateway fleet. Field techs wire sensors
// into gateways out in the world; this module is what the ops dashboard and
// the repair-ticket workflow both read and write through.

export interface Device {
  id: string;
  name: string;
  siteId: string;
}

export interface SensorReading {
  sensorId: string;
  value: number;
  unit: string;
  timestamp: number;
}

export class FleetRegistry {
  private devices = new Map<string, Device>();
  private sensorsByDevice = new Map<string, string[]>();
  private latestReadingBySensor = new Map<string, SensorReading>();

  registerDevice(device: Device): void {
    this.devices.set(device.id, device);
    if (!this.sensorsByDevice.has(device.id)) {
      this.sensorsByDevice.set(device.id, []);
    }
  }

  attachSensor(deviceId: string, sensorId: string): boolean {
    const sensors = this.sensorsByDevice.get(deviceId);
    if (!sensors) return false; // unknown device
    if (sensors.includes(sensorId)) return false; // already wired in
    sensors.push(sensorId);
    return true;
  }

  recordReading(reading: SensorReading): boolean {
    const isWiredIn = [...this.sensorsByDevice.values()].some((list) =>
      list.includes(reading.sensorId)
    );
    if (!isWiredIn) return false;
    this.latestReadingBySensor.set(reading.sensorId, reading);
    return true;
  }

  getLatestReadingForDevice(deviceId: string): SensorReading | undefined {
    const sensors = this.sensorsByDevice.get(deviceId);
    if (!sensors || sensors.length === 0) return undefined;
    // the dashboard tile only ever shows the first-wired sensor's reading
    const [firstSensorId] = sensors;
    return this.latestReadingBySensor.get(firstSensorId);
  }

  // Called from the repair-ticket workflow when a technician physically
  // re-wires a sensor from one gateway to another.
  moveSensor(sensorId: string, fromDeviceId: string, toDeviceId: string): boolean {
    const fromList = this.sensorsByDevice.get(fromDeviceId);
    const toList = this.sensorsByDevice.get(toDeviceId);
    if (!fromList || !toList) return false;
    const idx = fromList.indexOf(sensorId);
    if (idx === -1) return false;
    fromList.splice(idx, 1);
    toList.push(sensorId);
    return true;
  }
}

// The repair-ticket form captures a move as "old gateway, sensor, new
// gateway" (that's the order the fields sit in on the ticket), so this is
// what actually gets called once a technician closes out a ticket.
export function reassignSensorAfterRepair(
  registry: FleetRegistry,
  oldDeviceId: string,
  sensorId: string,
  newDeviceId: string
): boolean {
  return registry.moveSensor(oldDeviceId, sensorId, newDeviceId);
}
