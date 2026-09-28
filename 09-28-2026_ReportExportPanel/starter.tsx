import { useState, type FormEvent } from "react";

export type ExportFormat = "csv" | "pdf";

export type ExportRequest = {
  reportId: string;
  format: ExportFormat;
};

export type ExportResult = {
  downloadUrl: string;
};

export type CreateExport = (request: ExportRequest) => Promise<ExportResult>;

export type ReportExportPanelProps = {
  reportId: string;
  createExport: CreateExport;
};

export function ReportExportPanel({
  reportId,
  createExport,
}: ReportExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleFormatChange(nextFormat: ExportFormat) {
    setFormat(nextFormat);
    setDownloadUrl(null);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsExporting(true);
    setDownloadUrl(null);
    setErrorMessage(null);

    try {
      const result = await createExport({ reportId, format });
      setDownloadUrl(result.downloadUrl);
    } catch {
      setErrorMessage("Export failed. Try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section aria-labelledby="report-export-title">
      <h2 id="report-export-title">Export report</h2>

      <form onSubmit={handleSubmit}>
        <label>
          File format
          <select
            value={format}
            disabled={isExporting}
            onChange={(event) =>
              handleFormatChange(event.target.value as ExportFormat)
            }
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </label>

        <button type="submit" disabled={isExporting}>
          {isExporting ? "Exporting…" : "Export report"}
        </button>
      </form>

      {isExporting ? <p role="status">Preparing export…</p> : null}

      {downloadUrl ? (
        <a href={downloadUrl}>Download {format.toUpperCase()}</a>
      ) : null}

      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </section>
  );
}
