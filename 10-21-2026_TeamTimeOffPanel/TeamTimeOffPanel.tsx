import { useEffect, useState } from "react";

export interface TimeOffRequest {
  id: string;
  employeeName: string;
  startDate: string; // "yyyy-mm-dd"
  endDate: string; // "yyyy-mm-dd"
  status: "approved" | "pending" | "denied";
}

export interface TeamTimeOffPanelProps {
  teamId: string;
  /** "yyyy-mm" */
  selectedMonth: string;
  viewMode: "member" | "manager";
  fetchTimeOffRequests: (teamId: string, month: string) => Promise<TimeOffRequest[]>;
  fetchWhosOutToday: (teamId: string) => Promise<string[]>;
  trackPanelViewed: (teamId: string) => void;
  /** Exposed mainly so tests don't have to wait out a real 30s cadence. */
  pollIntervalMs?: number;
}

const DEFAULT_POLL_INTERVAL_MS = 30000;

export function TeamTimeOffPanel({
  teamId,
  selectedMonth,
  viewMode,
  fetchTimeOffRequests,
  fetchWhosOutToday,
  trackPanelViewed,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: TeamTimeOffPanelProps) {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [outToday, setOutToday] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Everything this panel needs to do for "team X is now showing" lives in
  // one effect - it grew by accretion as features landed on top of the
  // original month-fetch. Works fine in manual QA; keep an eye on it if we
  // start leaning on the view-tracking numbers for anything load-bearing.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchTimeOffRequests(teamId, selectedMonth).then((data) => {
      if (!cancelled) {
        setRequests(data);
        setLoading(false);
      }
    });

    // Leadership wants "panel views per team" for the quarterly usage review.
    trackPanelViewed(teamId);

    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (viewMode === "manager") {
      const pollWhosOut = () => {
        fetchWhosOutToday(teamId).then((names) => {
          if (!cancelled) setOutToday(names);
        });
      };
      pollWhosOut();
      intervalId = setInterval(pollWhosOut, pollIntervalMs);
    } else {
      setOutToday([]);
    }

    return () => {
      cancelled = true;
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, [
    teamId,
    selectedMonth,
    viewMode,
    fetchTimeOffRequests,
    fetchWhosOutToday,
    trackPanelViewed,
    pollIntervalMs,
  ]);

  if (loading) {
    return <div role="status">Loading time off…</div>;
  }

  return (
    <div>
      <h2>Time off — {selectedMonth}</h2>
      <ul data-testid="requests-list">
        {requests.map((r) => (
          <li key={r.id}>
            {r.employeeName}: {r.startDate} – {r.endDate} ({r.status})
          </li>
        ))}
      </ul>
      {viewMode === "manager" && (
        <div data-testid="out-today">
          Out today: {outToday.length > 0 ? outToday.join(", ") : "nobody"}
        </div>
      )}
    </div>
  );
}
