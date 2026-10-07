// Live vitals panel for the nurse-facing patient queue dashboard.
// Pulls the latest reading from the bedside monitor gateway whenever the
// selected patient changes. Keep this snappy - it lives in the queue
// sidebar and re-renders a lot as nurses click between patients.

import { useEffect, useState } from 'react';

export interface VitalsReading {
  heartRate: number;
  systolicBp: number;
  diastolicBp: number;
  spo2: number;
  recordedAt: string; // ISO timestamp from the bedside monitor
}

export type FetchVitals = (patientId: string) => Promise<VitalsReading>;

export interface PatientVitalsPanelProps {
  patientId: string;
  patientName: string;
  fetchVitals: FetchVitals;
}

const CRITICAL_HEART_RATE_BPM = 120;
const CRITICAL_SPO2_PERCENT = 90;

export function PatientVitalsPanel({
  patientId,
  patientName,
  fetchVitals,
}: PatientVitalsPanelProps) {
  const [vitals, setVitals] = useState<VitalsReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const abort = new AbortController() 
    fetchVitals(patientId)
      .then((reading) => {
        setVitals(reading);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      }).finally(() => setIsLoading(false))
    // Re-fetch whenever the queue selection changes.
    return () => {
      abort.abort()
    }
  }, [patientId]);

  if (error) {
    return (
      <div role="alert" data-testid="vitals-error">
        Couldn't load vitals for {patientName}: {error}
      </div>
    );
  }

  if (isLoading && !vitals) {
    return <div role="status">Loading vitals for {patientName}…</div>;
  }

  if (!vitals) {
    return null;
  }

  const isCritical =
    vitals.heartRate >= CRITICAL_HEART_RATE_BPM || vitals.spo2 <= CRITICAL_SPO2_PERCENT;

  return (
    <section
      data-testid="vitals-panel"
      className={isCritical ? 'vitals-panel vitals-panel--critical' : 'vitals-panel'}
    >
      <h2>{patientName}</h2>
      <dl>
        <dt>Heart rate</dt>
        <dd data-testid="heart-rate">{vitals.heartRate} bpm</dd>
        <dt>Blood pressure</dt>
        <dd data-testid="blood-pressure">
          {vitals.systolicBp}/{vitals.diastolicBp}
        </dd>
        <dt>SpO2</dt>
        <dd data-testid="spo2">{vitals.spo2}%</dd>
      </dl>
      {isCritical && (
        <p role="alert" data-testid="critical-alert">
          Vitals out of normal range
        </p>
      )}
    </section>
  );
}
