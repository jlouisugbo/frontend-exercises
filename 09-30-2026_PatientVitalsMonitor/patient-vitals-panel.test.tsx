import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PatientVitalsPanel, type VitalsReading, type FetchVitals } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how PatientVitalsPanel is constructed
// and how its props are wired to a vitals-fetching function. If you
// refactor the component's internals (a custom hook, a reducer, an
// AbortController-based fetch wrapper, whatever), update ONLY the
// helpers in this block - the test cases below should keep working
// unchanged as long as the component's public props and rendered output
// stay the same shape.
function makeReading(overrides: Partial<VitalsReading> = {}): VitalsReading {
  return {
    heartRate: 72,
    systolicBp: 118,
    diastolicBp: 76,
    spo2: 98,
    recordedAt: '2026-09-30T12:00:00.000Z',
    ...overrides,
  };
}

function renderPanel(props: {
  patientId?: string;
  patientName?: string;
  fetchVitals: FetchVitals;
}) {
  return render(
    <PatientVitalsPanel
      patientId={props.patientId ?? 'patient-1'}
      patientName={props.patientName ?? 'Jordan Ellis'}
      fetchVitals={props.fetchVitals}
    />
  );
}

function fetchVitalsResolvingWith(reading: VitalsReading): FetchVitals {
  return () => Promise.resolve(reading);
}

function fetchVitalsRejectingWith(message: string): FetchVitals {
  return () => Promise.reject(new Error(message));
}
// -------------------------------------------------------------------------

describe('PatientVitalsPanel', () => {
  it('shows a loading state before the reading arrives', () => {
    const fetchVitals: FetchVitals = () => new Promise(() => {}); // never resolves

    renderPanel({ fetchVitals });

    expect(screen.getByRole('status')).toHaveTextContent('Loading vitals for Jordan Ellis');
  });

  it('renders the vitals once the fetch resolves', async () => {
    const fetchVitals = fetchVitalsResolvingWith(
      makeReading({ heartRate: 72, systolicBp: 118, diastolicBp: 76, spo2: 98 })
    );

    renderPanel({ fetchVitals });

    const panel = await screen.findByTestId('vitals-panel');
    expect(within(panel).getByTestId('heart-rate')).toHaveTextContent('72 bpm');
    expect(within(panel).getByTestId('blood-pressure')).toHaveTextContent('118/76');
    expect(within(panel).getByTestId('spo2')).toHaveTextContent('98%');
    expect(panel.className).not.toContain('critical');
    expect(screen.queryByTestId('critical-alert')).not.toBeInTheDocument();
  });

  it('flags the panel critical when heart rate reaches the critical threshold', async () => {
    const fetchVitals = fetchVitalsResolvingWith(makeReading({ heartRate: 120 }));

    renderPanel({ fetchVitals });

    const panel = await screen.findByTestId('vitals-panel');
    expect(panel.className).toContain('critical');
    expect(screen.getByTestId('critical-alert')).toBeInTheDocument();
  });

  it('flags the panel critical when spo2 drops to the critical threshold', async () => {
    const fetchVitals = fetchVitalsResolvingWith(makeReading({ spo2: 90 }));

    renderPanel({ fetchVitals });

    const panel = await screen.findByTestId('vitals-panel');
    expect(panel.className).toContain('critical');
    expect(screen.getByTestId('critical-alert')).toBeInTheDocument();
  });

  it('does not flag the panel critical when vitals are just outside the thresholds', async () => {
    const fetchVitals = fetchVitalsResolvingWith(makeReading({ heartRate: 119, spo2: 91 }));

    renderPanel({ fetchVitals });

    const panel = await screen.findByTestId('vitals-panel');
    expect(panel.className).not.toContain('critical');
    expect(screen.queryByTestId('critical-alert')).not.toBeInTheDocument();
  });

  it('shows an error message when the fetch rejects', async () => {
    const fetchVitals = fetchVitalsRejectingWith('monitor feed unavailable');

    renderPanel({ fetchVitals });

    const alert = await screen.findByTestId('vitals-error');
    expect(alert).toHaveTextContent('monitor feed unavailable');
  });

  it('re-fetches with the newly selected patient id when the selection changes', async () => {
    const calls: string[] = [];
    const fetchVitals: FetchVitals = (patientId) => {
      calls.push(patientId);
      return Promise.resolve(makeReading());
    };

    const { rerender } = renderPanel({ fetchVitals, patientId: 'patient-1' });
    await screen.findByTestId('vitals-panel');

    rerender(
      <PatientVitalsPanel
        patientId="patient-2"
        patientName="Alex Rivera"
        fetchVitals={fetchVitals}
      />
    );
    await screen.findByText('Alex Rivera');

    expect(calls).toEqual(['patient-1', 'patient-2']);
  });
});
