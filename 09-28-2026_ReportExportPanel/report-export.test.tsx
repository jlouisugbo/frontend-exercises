// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ReportExportPanel,
  type CreateExport,
  type ExportResult,
} from "./starter";

afterEach(() => cleanup());

// -----------------------------------------------------------------------------
// Public API seam: adapt construction here if you change component boundaries.
function renderPanel(createExport: CreateExport) {
  return render(
    <ReportExportPanel reportId="report-42" createExport={createExport} />,
  );
}

function submitExport() {
  fireEvent.click(screen.getByRole("button", { name: "Export report" }));
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
// -----------------------------------------------------------------------------

describe("ReportExportPanel", () => {
  it("starts with CSV selected and no request feedback", () => {
    renderPanel(vi.fn());

    expect(screen.getByRole("combobox", { name: "File format" })).toHaveValue("csv");
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("submits the selected format and report ID", async () => {
    const createExport = vi.fn<CreateExport>().mockResolvedValue({
      downloadUrl: "/exports/report-42.csv",
    });
    renderPanel(createExport);

    submitExport();

    expect(createExport).toHaveBeenCalledWith({
      reportId: "report-42",
      format: "csv",
    });
    await screen.findByRole("link", { name: "Download CSV" });
  });

  it("allows PDF to be selected before exporting", async () => {
    const createExport = vi.fn<CreateExport>().mockResolvedValue({
      downloadUrl: "/exports/report-42.pdf",
    });
    renderPanel(createExport);

    fireEvent.change(screen.getByRole("combobox", { name: "File format" }), {
      target: { value: "pdf" },
    });
    submitExport();

    expect(createExport).toHaveBeenCalledWith({
      reportId: "report-42",
      format: "pdf",
    });
    await screen.findByRole("link", { name: "Download PDF" });
  });

  it("shows progress and disables controls while exporting", () => {
    const request = deferred<ExportResult>();
    renderPanel(() => request.promise);

    submitExport();

    expect(screen.getByRole("status")).toHaveTextContent("Preparing export…");
    expect(screen.getByRole("button", { name: "Exporting…" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "File format" })).toBeDisabled();
  });

  it("shows the download link after success", async () => {
    renderPanel(async () => ({ downloadUrl: "/exports/ready.csv" }));
    submitExport();

    const link = await screen.findByRole("link", { name: "Download CSV" });
    expect(link).toHaveAttribute("href", "/exports/ready.csv");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows an error and allows retry after failure", async () => {
    const createExport = vi
      .fn<CreateExport>()
      .mockRejectedValueOnce(new Error("service unavailable"))
      .mockResolvedValueOnce({ downloadUrl: "/exports/retry.csv" });
    renderPanel(createExport);

    submitExport();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Export failed. Try again.",
    );
    expect(screen.getByRole("button", { name: "Export report" })).toBeEnabled();

    submitExport();
    expect(await screen.findByRole("link", { name: "Download CSV" })).toHaveAttribute(
      "href",
      "/exports/retry.csv",
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clears an old error as soon as a retry starts", async () => {
    const retry = deferred<ExportResult>();
    const createExport = vi
      .fn<CreateExport>()
      .mockRejectedValueOnce(new Error("service unavailable"))
      .mockImplementationOnce(() => retry.promise);
    renderPanel(createExport);

    submitExport();
    await screen.findByRole("alert");
    submitExport();

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("clears a completed download when the format changes", async () => {
    renderPanel(async () => ({ downloadUrl: "/exports/ready.csv" }));
    submitExport();
    await screen.findByRole("link", { name: "Download CSV" });

    fireEvent.change(screen.getByRole("combobox", { name: "File format" }), {
      target: { value: "pdf" },
    });

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("combobox", { name: "File format" })).toHaveValue("pdf");
  });
});
