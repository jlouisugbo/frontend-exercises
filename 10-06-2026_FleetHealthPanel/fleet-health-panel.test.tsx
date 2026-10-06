import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  FleetHealthPanel,
  type Device,
  type DeviceHealth,
  type FetchDeviceHealth,
} from './starter';

// --- Seam ---------------------------------------------------------------
// The only place that knows how FleetHealthPanel is constructed, how a
// device gets selected, and how fetchDeviceHealth results get back into
// it. If you refactor the component's internals (the effect, a ref, a
// request id, whatever you like), update ONLY the helpers in this block -
// the test cases below should keep working unchanged as long as the
// component's public props and rendered output stay the same shape.

const DEVICES: Device[] = [
  { id: 'dev-104', name: 'Chiller Unit 4' },
  { id: 'dev-221', name: 'Dock Door Sensor' },
];

function renderPanel(
  fetchDeviceHealth: FetchDeviceHealth,
  devices: Device[] = DEVICES,
  pollIntervalMs = 60000
) {
  return render(
    <FleetHealthPanel
      devices={devices}
      fetchDeviceHealth={fetchDeviceHealth}
      pollIntervalMs={pollIntervalMs}
    />
  );
}

function fetchHealthResolvingWith(health: DeviceHealth): FetchDeviceHealth {
  return () => Promise.resolve(health);
}

function fetchHealthRejectingWith(message: string): FetchDeviceHealth {
  return () => Promise.reject(new Error(message));
}

function selectDevice(deviceId: string) {
  fireEvent.click(screen.getByTestId(`device-button-${deviceId}`));
}
// -------------------------------------------------------------------------

describe('FleetHealthPanel', () => {
  it('shows an idle prompt and no health reading before any device is selected', () => {
    const fetchDeviceHealth = vi.fn();
    renderPanel(fetchDeviceHealth);

    expect(screen.getByTestId('status-message')).toHaveTextContent('Select a device');
    expect(screen.queryByTestId('health-result')).not.toBeInTheDocument();
    expect(fetchDeviceHealth).not.toHaveBeenCalled();
  });

  it('shows a loading indicator immediately after a device button is clicked', async () => {
    const fetchDeviceHealth: FetchDeviceHealth = () => new Promise(() => {}); // never resolves
    renderPanel(fetchDeviceHealth);

    selectDevice('dev-104');

    expect(await screen.findByTestId('status-message')).toHaveTextContent('Checking device');
  });

  it('renders the health reading once the fetch resolves', async () => {
    const fetchDeviceHealth = fetchHealthResolvingWith({
      deviceId: 'dev-104',
      batteryPct: 82,
      signalBars: 3,
      lastSeenSec: 4,
    });
    renderPanel(fetchDeviceHealth);

    selectDevice('dev-104');

    expect(await screen.findByTestId('health-device-name')).toHaveTextContent('Chiller Unit 4');
    expect(screen.getByTestId('health-battery')).toHaveTextContent('82%');
    expect(screen.getByTestId('health-signal')).toHaveTextContent('3/4 bars');
    expect(screen.getByTestId('health-last-seen')).toHaveTextContent('4s ago');
  });

  it('marks the clicked device button as pressed and leaves the other one unpressed', async () => {
    const fetchDeviceHealth = fetchHealthResolvingWith({
      deviceId: 'dev-104',
      batteryPct: 82,
      signalBars: 3,
      lastSeenSec: 4,
    });
    renderPanel(fetchDeviceHealth);

    selectDevice('dev-104');
    await screen.findByTestId('health-result');

    expect(screen.getByTestId('device-button-dev-104')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('device-button-dev-221')).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows an error message and no health result when the fetch rejects', async () => {
    const fetchDeviceHealth = fetchHealthRejectingWith('fleet gateway unreachable');
    renderPanel(fetchDeviceHealth);

    selectDevice('dev-104');

    expect(await screen.findByRole('alert')).toHaveTextContent('fleet gateway unreachable');
    expect(screen.queryByTestId('health-result')).not.toBeInTheDocument();
  });

  it('loads the newly selected device when a different one is clicked after one is already loaded', async () => {
    const fetchDeviceHealth = vi.fn((deviceId: string) =>
      Promise.resolve(
        deviceId === 'dev-104'
          ? { deviceId, batteryPct: 82, signalBars: 3, lastSeenSec: 4 }
          : { deviceId, batteryPct: 55, signalBars: 1, lastSeenSec: 30 }
      )
    );
    renderPanel(fetchDeviceHealth);

    selectDevice('dev-104');
    expect(await screen.findByTestId('health-device-name')).toHaveTextContent('Chiller Unit 4');

    selectDevice('dev-221');
    expect(await screen.findByTestId('health-device-name')).toHaveTextContent('Dock Door Sensor');

    expect(fetchDeviceHealth).toHaveBeenCalledTimes(2);
  });
});
