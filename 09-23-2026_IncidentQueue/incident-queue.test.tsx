// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { IncidentQueue, type Incident } from "./starter";

afterEach(cleanup);

// -----------------------------------------------------------------------------
// This helper is expected to change as you refactor. Update it if the component
// construction boundary changes. Behavioral assertions below should not need to.
const incidents: readonly Incident[] = [
  {
    id: "api-errors",
    title: "Elevated API error rate",
    service: "Checkout API",
    status: "open",
    severity: 1,
    updatedAt: "2026-09-23T11:55:00.000Z",
  },
  {
    id: "delayed-jobs",
    title: "Delayed settlement jobs",
    service: "Payments Worker",
    status: "investigating",
    severity: 2,
    updatedAt: "2026-09-23T11:58:00.000Z",
  },
  {
    id: "stale-cache",
    title: "Stale catalog cache",
    service: "Catalog",
    status: "resolved",
    severity: 3,
    updatedAt: "2026-09-23T11:59:00.000Z",
  },
];

function renderQueue(items: readonly Incident[] = incidents) {
  const user = userEvent.setup();
  const view = render(<IncidentQueue incidents={items} />);

  return { user, ...view };
}

function incidentButtons(): HTMLButtonElement[] {
  return within(screen.getByRole("list", { name: "Incidents" })).getAllByRole(
    "button",
  );
}
// -----------------------------------------------------------------------------

describe("IncidentQueue", () => {
  it("shows active and critical totals for the complete collection", async () => {
    renderQueue();

    expect(await screen.findByLabelText("Incident summary")).toHaveTextContent(
      "Active: 2Critical: 1",
    );
  });

  it("orders incidents by most recent update by default", async () => {
    renderQueue();

    expect((await screen.findAllByRole("button")).map((button) => button.textContent)).toEqual([
      "Stale catalog cache · Catalog · Severity 3",
      "Delayed settlement jobs · Payments Worker · Severity 2",
      "Elevated API error rate · Checkout API · Severity 1",
    ]);
  });

  it("searches titles and services without case sensitivity", async () => {
    const { user } = renderQueue();

    await user.type(screen.getByRole("textbox", { name: "Search incidents" }), "  PAYMENTS  ");

    expect(incidentButtons()).toHaveLength(1);
    expect(incidentButtons()[0]).toHaveTextContent("Delayed settlement jobs");
  });

  it("filters incidents by status", async () => {
    const { user } = renderQueue();

    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "resolved");

    expect(incidentButtons()).toHaveLength(1);
    expect(incidentButtons()[0]).toHaveTextContent("Stale catalog cache");
  });

  it("sorts lower severity numbers first", async () => {
    const { user } = renderQueue();

    await user.selectOptions(screen.getByRole("combobox", { name: "Sort by" }), "severity");

    expect(incidentButtons().map((button) => button.textContent)).toEqual([
      "Elevated API error rate · Checkout API · Severity 1",
      "Delayed settlement jobs · Payments Worker · Severity 2",
      "Stale catalog cache · Catalog · Severity 3",
    ]);
  });

  it("opens the selected incident details", async () => {
    const { user } = renderQueue();

    await user.click(await screen.findByRole("button", { name: /Elevated API error rate/ }));

    expect(screen.getByRole("complementary", { name: "Selected incident" })).toHaveTextContent(
      "Elevated API error rateService: Checkout APIStatus: open",
    );
  });

  it("keeps details open when filtering the selected row out", async () => {
    const { user } = renderQueue();

    await user.click(await screen.findByRole("button", { name: /Elevated API error rate/ }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "resolved");

    expect(screen.getByRole("complementary", { name: "Selected incident" })).toHaveTextContent(
      "Elevated API error rate",
    );
  });

  it("updates rows and summary when a new incident snapshot arrives", async () => {
    const { rerender } = renderQueue();
    const next: readonly Incident[] = [
      ...incidents,
      {
        id: "login-outage",
        title: "Login outage",
        service: "Identity",
        status: "open",
        severity: 1,
        updatedAt: "2026-09-23T12:01:00.000Z",
      },
    ];

    rerender(<IncidentQueue incidents={next} />);

    expect(await screen.findByText("4 incidents shown")).toBeInTheDocument();
    expect(screen.getByLabelText("Incident summary")).toHaveTextContent(
      "Active: 3Critical: 2",
    );
  });
});
