import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within, fireEvent, act } from "@testing-library/react";
import { MatchQueue, cardRenderCounts, type Profile } from "./MatchQueue";

// ---- Test seam ------------------------------------------------------------
// Wraps building the profile fixtures, rendering the queue, and reading the
// render-count telemetry, so every test below goes through one narrow
// surface instead of constructing profiles or touching cardRenderCounts
// directly, inline, anywhere else in this file. Expected to change shape if
// MatchQueue's props or ProfileCard's internals change during a refactor.
function buildProfiles(count: number): Profile[] {
  const now = Date.now();
  const templates: Omit<Profile, "id">[] = [
    { name: "Avery", age: 29, bio: "Likes hiking", compatibilityScore: 88, lastActiveAt: now },
    {
      name: "Jules",
      age: 31,
      bio: "Coffee enthusiast",
      compatibilityScore: 72,
      lastActiveAt: now - 2 * 60_000,
    },
    {
      name: "Rowan",
      age: 26,
      bio: "Plays bass",
      compatibilityScore: 65,
      lastActiveAt: now - 90 * 60_000,
    },
    {
      name: "Sage",
      age: 34,
      bio: "Runs a bakery",
      compatibilityScore: 54,
      lastActiveAt: now - 2 * 24 * 60 * 60_000,
    },
  ];
  return templates.slice(0, count).map((t, i) => ({ id: `p${i + 1}`, ...t }));
}

function renderQueue(profiles: Profile[], presenceTickMs = 1000) {
  Object.keys(cardRenderCounts).forEach((id) => delete cardRenderCounts[id]);
  const onDecision = vi.fn();
  const utils = render(
    <MatchQueue profiles={profiles} onDecision={onDecision} presenceTickMs={presenceTickMs} />
  );
  return { ...utils, onDecision };
}

function renderCountFor(id: string): number {
  return cardRenderCounts[id] ?? 0;
}

function clickDecision(id: string, label: "Like" | "Pass") {
  const card = screen.getByTestId(`card-${id}`);
  fireEvent.click(within(card).getByText(label));
}
// -----------------------------------------------------------------------------

afterEach(() => {
  vi.useRealTimers();
});

describe("MatchQueue", () => {
  it("shows 'Online now' for a profile active in the last minute", () => {
    const profiles = buildProfiles(1);
    renderQueue(profiles);
    expect(screen.getByTestId(`presence-${profiles[0].id}`)).toHaveTextContent("Online now");
  });

  it("shows minutes-ago presence for a profile active within the last hour", () => {
    const profiles = buildProfiles(2);
    renderQueue(profiles);
    expect(screen.getByTestId(`presence-${profiles[1].id}`)).toHaveTextContent(/Active 2m ago/);
  });

  it("shows hours-ago presence for a profile active within the last day", () => {
    const profiles = buildProfiles(3);
    renderQueue(profiles);
    expect(screen.getByTestId(`presence-${profiles[2].id}`)).toHaveTextContent(/Active 1h ago/);
  });

  it("shows 'Offline' for a profile inactive for over a day", () => {
    const profiles = buildProfiles(4);
    renderQueue(profiles);
    expect(screen.getByTestId(`presence-${profiles[3].id}`)).toHaveTextContent("Offline");
  });

  it("removes a profile and reports a 'like' decision", () => {
    const profiles = buildProfiles(2);
    const { onDecision } = renderQueue(profiles);

    clickDecision(profiles[0].id, "Like");

    expect(screen.queryByTestId(`card-${profiles[0].id}`)).not.toBeInTheDocument();
    expect(onDecision).toHaveBeenCalledWith(profiles[0].id, "like");
  });

  it("removes a profile and reports a 'pass' decision", () => {
    const profiles = buildProfiles(2);
    const { onDecision } = renderQueue(profiles);

    clickDecision(profiles[1].id, "Pass");

    expect(screen.queryByTestId(`card-${profiles[1].id}`)).not.toBeInTheDocument();
    expect(onDecision).toHaveBeenCalledWith(profiles[1].id, "pass");
  });

  it("shows an empty-queue message once every profile has been decided", () => {
    const profiles = buildProfiles(1);
    renderQueue(profiles);

    clickDecision(profiles[0].id, "Pass");

    expect(screen.getByTestId("empty-queue")).toHaveTextContent(/no more profiles/i);
  });

  it("re-renders every visible card's body on each presence tick", () => {
    vi.useFakeTimers();
    const profiles = buildProfiles(3);
    renderQueue(profiles, 1000);

    profiles.forEach((p) => expect(renderCountFor(p.id)).toBe(1));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    profiles.forEach((p) => expect(renderCountFor(p.id)).toBe(2));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    profiles.forEach((p) => expect(renderCountFor(p.id)).toBe(3));
  });
});
