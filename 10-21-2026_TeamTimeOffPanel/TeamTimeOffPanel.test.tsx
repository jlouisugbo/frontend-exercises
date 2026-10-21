import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TeamTimeOffPanel, type TimeOffRequest } from "./TeamTimeOffPanel";

// ---- Test seam ----------------------------------------------------------
// Wraps construction of the panel plus its mocked collaborators, and
// re-rendering it with changed props. This shape is expected to change if
// the component's effect(s) get split apart during a refactor - every test
// below goes through renderPanel()/rerenderWith() rather than calling
// render() or mocking a collaborator directly, inline, anywhere else in
// this file.
type ViewMode = "member" | "manager";

interface PanelOverrides {
  teamId?: string;
  selectedMonth?: string;
  viewMode?: ViewMode;
  requestsByMonth?: Record<string, TimeOffRequest[]>;
  whosOut?: string[];
  pollIntervalMs?: number;
}

function renderPanel(overrides: PanelOverrides = {}) {
  const state = {
    teamId: overrides.teamId ?? "team-1",
    selectedMonth: overrides.selectedMonth ?? "2026-10",
    viewMode: overrides.viewMode ?? ("member" as ViewMode),
    pollIntervalMs: overrides.pollIntervalMs ?? 20,
  };
  const requestsByMonth = overrides.requestsByMonth ?? { "2026-10": [] };
  const whosOut = overrides.whosOut ?? [];

  const fetchTimeOffRequests = vi.fn((_teamId: string, month: string) =>
    Promise.resolve(requestsByMonth[month] ?? [])
  );
  const fetchWhosOutToday = vi.fn((_teamId: string) => Promise.resolve(whosOut));
  const trackPanelViewed = vi.fn((_teamId: string) => {});

  const utils = render(
    <TeamTimeOffPanel
      {...state}
      fetchTimeOffRequests={fetchTimeOffRequests}
      fetchWhosOutToday={fetchWhosOutToday}
      trackPanelViewed={trackPanelViewed}
    />
  );

  function rerenderWith(next: Partial<typeof state> = {}) {
    Object.assign(state, next);
    utils.rerender(
      <TeamTimeOffPanel
        {...state}
        fetchTimeOffRequests={fetchTimeOffRequests}
        fetchWhosOutToday={fetchWhosOutToday}
        trackPanelViewed={trackPanelViewed}
      />
    );
  }

  return {
    ...utils,
    fetchTimeOffRequests,
    fetchWhosOutToday,
    trackPanelViewed,
    rerenderWith,
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// --------------------------------------------------------------------------

describe("TeamTimeOffPanel", () => {
  it("shows a loading state before the first fetch resolves", async () => {
    renderPanel();
    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    // Let the pending fetch settle before the test exits, so its state
    // update doesn't land outside act() and bleed into the next test.
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("renders the fetched time-off requests for the given team and month", async () => {
    const requests: TimeOffRequest[] = [
      {
        id: "1",
        employeeName: "Amara Okafor",
        startDate: "2026-10-05",
        endDate: "2026-10-09",
        status: "approved",
      },
    ];
    renderPanel({ requestsByMonth: { "2026-10": requests } });

    await waitFor(() =>
      expect(screen.getByTestId("requests-list")).toHaveTextContent("Amara Okafor")
    );
  });

  it("refetches requests when the selected month changes", async () => {
    const { fetchTimeOffRequests, rerenderWith } = renderPanel({
      requestsByMonth: { "2026-10": [], "2026-11": [] },
    });

    await waitFor(() => expect(fetchTimeOffRequests).toHaveBeenCalledTimes(1));
    expect(fetchTimeOffRequests).toHaveBeenLastCalledWith("team-1", "2026-10");

    rerenderWith({ selectedMonth: "2026-11" });

    await waitFor(() => expect(fetchTimeOffRequests).toHaveBeenCalledTimes(2));
    expect(fetchTimeOffRequests).toHaveBeenLastCalledWith("team-1", "2026-11");
  });

  it("tracks a panel view on first mount", async () => {
    const { trackPanelViewed } = renderPanel();
    await waitFor(() => expect(trackPanelViewed).toHaveBeenCalledTimes(1));
    expect(trackPanelViewed).toHaveBeenCalledWith("team-1");
  });

  it("tracks another panel view when only the month changes and the team stays the same", async () => {
    const { trackPanelViewed, rerenderWith } = renderPanel({
      requestsByMonth: { "2026-10": [], "2026-11": [] },
    });
    await waitFor(() => expect(trackPanelViewed).toHaveBeenCalledTimes(1));

    rerenderWith({ selectedMonth: "2026-11" });

    await waitFor(() => expect(trackPanelViewed).toHaveBeenCalledTimes(2));
  });

  it("in member view, never polls who's out and renders no out-today section", async () => {
    const { fetchWhosOutToday } = renderPanel({ viewMode: "member" });

    await waitFor(() =>
      expect(screen.getByTestId("requests-list")).toBeInTheDocument()
    );
    expect(fetchWhosOutToday).not.toHaveBeenCalled();
    expect(screen.queryByTestId("out-today")).not.toBeInTheDocument();
  });

  it("in manager view, fetches and shows who's out today", async () => {
    renderPanel({ viewMode: "manager", whosOut: ["Priya Nair"] });

    await waitFor(() =>
      expect(screen.getByTestId("out-today")).toHaveTextContent("Priya Nair")
    );
  });

  it("in manager view with nobody out, says so explicitly", async () => {
    renderPanel({ viewMode: "manager", whosOut: [] });

    await waitFor(() =>
      expect(screen.getByTestId("out-today")).toHaveTextContent("nobody")
    );
  });

  it("polls who's-out again on a later tick while in manager view", async () => {
    const { fetchWhosOutToday } = renderPanel({
      viewMode: "manager",
      pollIntervalMs: 20,
    });

    await waitFor(() => expect(fetchWhosOutToday).toHaveBeenCalledTimes(1));
    // Exact tick counts are timing-sensitive under real timers - assert the
    // interval is actually firing more than the initial immediate call,
    // not a specific count.
    await waitFor(
      () => expect(fetchWhosOutToday.mock.calls.length).toBeGreaterThanOrEqual(2),
      { timeout: 1000 }
    );
  });

  it("stops polling once unmounted", async () => {
    const { fetchWhosOutToday, unmount } = renderPanel({
      viewMode: "manager",
      pollIntervalMs: 20,
    });

    await waitFor(() => expect(fetchWhosOutToday).toHaveBeenCalledTimes(1));
    const callsAtUnmount = fetchWhosOutToday.mock.calls.length;

    unmount();
    await wait(120);

    expect(fetchWhosOutToday).toHaveBeenCalledTimes(callsAtUnmount);
  });
});
