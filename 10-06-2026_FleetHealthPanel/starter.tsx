// Nimbus fleet console - the device health panel field techs pull up
// before heading out on a maintenance run, picking a device from the
// sidebar to check its battery, signal, and last-seen status. Auto-refresh
// got bolted on last sprint after techs complained about having to
// manually hit "refresh" every time they wanted a current reading.

import { useEffect, useState } from 'react';

export interface Device {
  id: string;
  name: string;
}

export interface DeviceHealth {
  deviceId: string;
  batteryPct: number;
  signalBars: number;
  lastSeenSec: number;
}

export type FetchDeviceHealth = (deviceId: string) => Promise<DeviceHealth>;

export type HealthStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface FleetHealthPanelProps {
  devices: Device[];
  fetchDeviceHealth: FetchDeviceHealth;
  pollIntervalMs?: number;
}

export function FleetHealthPanel({
  devices,
  fetchDeviceHealth,
  pollIntervalMs = 10000,
}: FleetHealthPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [health, setHealth] = useState<DeviceHealth | null>(null);
  const [status, setStatus] = useState<HealthStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function loadHealth(deviceId: string) {
    setStatus('loading');
    setErrorMessage(null);

    fetchDeviceHealth(deviceId)
      .then((result) => {
        setHealth(result);
        setStatus('loaded');
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setStatus('error');
        setErrorMessage(message);
      });
  }

  function handleSelect(deviceId: string) {
    setSelectedId(deviceId);
    loadHealth(deviceId);
  }

  // Keep the reading current for whichever device a tech is looking at,
  // without them needing to click back in every few seconds.
  useEffect(() => {
    if (!selectedId) return;

    const timer = setInterval(() => {
      loadHealth(selectedId);
    }, pollIntervalMs);

    return () => clearInterval(timer);
  }, [selectedId, pollIntervalMs]);

  const selectedDevice = devices.find((d) => d.id === selectedId) ?? null;

  return (
    <div data-testid="fleet-panel">
      <ul data-testid="device-list">
        {devices.map((device) => (
          <li key={device.id}>
            <button
              type="button"
              data-testid={`device-button-${device.id}`}
              onClick={() => handleSelect(device.id)}
              aria-pressed={selectedId === device.id}
            >
              {device.name}
            </button>
          </li>
        ))}
      </ul>

      <div data-testid="health-body">
        {status === 'idle' && (
          <p data-testid="status-message">Select a device to see its live health.</p>
        )}

        {status === 'loading' && (
          <p data-testid="status-message" role="status">
            Checking device…
          </p>
        )}

        {status === 'error' && (
          <p data-testid="status-message" role="alert">
            Couldn't read device health: {errorMessage}
          </p>
        )}

        {status === 'loaded' && health && selectedDevice && (
          <div data-testid="health-result">
            <p data-testid="health-device-name">{selectedDevice.name}</p>
            <p data-testid="health-battery">{health.batteryPct}%</p>
            <p data-testid="health-signal">{health.signalBars}/4 bars</p>
            <p data-testid="health-last-seen">{health.lastSeenSec}s ago</p>
          </div>
        )}
      </div>
    </div>
  );
}
