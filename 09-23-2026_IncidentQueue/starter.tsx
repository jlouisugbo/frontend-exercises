import { useEffect, useState } from "react";

export type IncidentStatus = "open" | "investigating" | "resolved";
export type IncidentSeverity = 1 | 2 | 3 | 4;

export type Incident = {
  id: string;
  title: string;
  service: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  updatedAt: string;
};

type StatusFilter = "all" | IncidentStatus;
type SortMode = "recent" | "severity";

type Summary = {
  active: number;
  critical: number;
};

export type IncidentQueueProps = {
  incidents: readonly Incident[];
};

export function IncidentQueue({ incidents }: IncidentQueueProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null,
  );
  const [visibleIncidents, setVisibleIncidents] = useState<readonly Incident[]>(
    incidents,
  );
  const [summary, setSummary] = useState<Summary>({ active: 0, critical: 0 });

  useEffect(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nextVisible = incidents
      .filter((incident) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          incident.title.toLowerCase().includes(normalizedQuery) ||
          incident.service.toLowerCase().includes(normalizedQuery);
        const matchesStatus =
          statusFilter === "all" || incident.status === statusFilter;

        return matchesQuery && matchesStatus;
      })
      .slice()
      .sort((left, right) => {
        if (sortMode === "severity") {
          return left.severity - right.severity;
        }

        return right.updatedAt.localeCompare(left.updatedAt);
      });

    setVisibleIncidents(nextVisible);
  }, [incidents, query, sortMode, statusFilter]);

  useEffect(() => {
    setSummary({
      active: incidents.filter((incident) => incident.status !== "resolved")
        .length,
      critical: incidents.filter(
        (incident) =>
          incident.severity === 1 && incident.status !== "resolved",
      ).length,
    });
  }, [incidents]);

  const selectedIncident =
    incidents.find((incident) => incident.id === selectedIncidentId) ?? null;

  return (
    <section aria-labelledby="incident-queue-title">
      <h1 id="incident-queue-title">Incident queue</h1>

      <div aria-label="Incident summary">
        <span>Active: {summary.active}</span>
        <span>Critical: {summary.critical}</span>
      </div>

      <label>
        Search incidents
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Title or service"
        />
      </label>

      <label>
        Status
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as StatusFilter)
          }
        >
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>

      <label>
        Sort by
        <select
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value as SortMode)}
        >
          <option value="recent">Most recently updated</option>
          <option value="severity">Highest severity</option>
        </select>
      </label>

      <p aria-live="polite">{visibleIncidents.length} incidents shown</p>

      <ul aria-label="Incidents">
        {visibleIncidents.map((incident) => (
          <li key={incident.id}>
            <button
              type="button"
              aria-pressed={incident.id === selectedIncidentId}
              onClick={() => setSelectedIncidentId(incident.id)}
            >
              {incident.title} · {incident.service} · Severity {incident.severity}
            </button>
          </li>
        ))}
      </ul>

      {selectedIncident ? (
        <aside aria-label="Selected incident">
          <h2>{selectedIncident.title}</h2>
          <p>Service: {selectedIncident.service}</p>
          <p>Status: {selectedIncident.status}</p>
        </aside>
      ) : null}
    </section>
  );
}
