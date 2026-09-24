import { useEffect, useRef, useState } from "react";

export type SaveDraftRequest = {
  documentId: string;
  content: string;
  revision: number;
};

export type SaveDraftResult = {
  revision: number;
};

export type SaveDraft = (
  request: SaveDraftRequest,
) => Promise<SaveDraftResult>;

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export type UseAutosaveDraftOptions = {
  documentId: string;
  content: string;
  saveDraft: SaveDraft;
  delayMs?: number;
};

export type AutosaveDraftState = {
  status: AutosaveStatus;
  lastSavedRevision: number | null;
};

export function useAutosaveDraft({
  documentId,
  content,
  saveDraft,
  delayMs = 500,
}: UseAutosaveDraftOptions): AutosaveDraftState {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedRevision, setLastSavedRevision] = useState<number | null>(
    null,
  );
  const nextRevision = useRef(0);

  useEffect(() => {
    if (!content) {
      setStatus("idle");
      return;
    }

    setStatus("idle");

    const timeoutId = window.setTimeout(async () => {
      setStatus("saving");
      nextRevision.current += 1;

      try {
        const result = await saveDraft({
          documentId,
          content,
          revision: nextRevision.current,
        });

        setLastSavedRevision(result.revision);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [content, delayMs, documentId, saveDraft]);

  return { status, lastSavedRevision };
}
