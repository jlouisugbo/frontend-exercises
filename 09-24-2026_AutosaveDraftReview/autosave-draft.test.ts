// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useAutosaveDraft,
  type SaveDraft,
  type SaveDraftRequest,
} from "./starter";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// -----------------------------------------------------------------------------
// This helper is expected to change as you improve the hook's public contract.
// Keep tests below focused on behavior rather than hook construction details.
function renderAutosave(
  saveDraft: SaveDraft,
  initial: { documentId: string; content: string; delayMs?: number },
) {
  return renderHook(
    (props: { documentId: string; content: string; delayMs?: number }) =>
      useAutosaveDraft({
        documentId: props.documentId,
        content: props.content,
        saveDraft,
        ...(props.delayMs === undefined ? {} : { delayMs: props.delayMs }),
      }),
    { initialProps: initial },
  );
}

function successfulSave(
  requests: SaveDraftRequest[],
): SaveDraft {
  return async (request) => {
    requests.push(request);
    return { revision: request.revision };
  };
}
// -----------------------------------------------------------------------------

describe("useAutosaveDraft", () => {
  it("waits for the configured delay before saving", async () => {
    vi.useFakeTimers();
    const requests: SaveDraftRequest[] = [];
    renderAutosave(successfulSave(requests), {
      documentId: "doc-1",
      content: "First draft",
      delayMs: 300,
    });

    await act(async () => vi.advanceTimersByTimeAsync(299));
    expect(requests).toHaveLength(0);

    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(requests).toHaveLength(1);
  });

  it("saves only the latest content when typing continues", async () => {
    vi.useFakeTimers();
    const requests: SaveDraftRequest[] = [];
    const hook = renderAutosave(successfulSave(requests), {
      documentId: "doc-1",
      content: "First",
      delayMs: 300,
    });

    await act(async () => vi.advanceTimersByTimeAsync(200));
    hook.rerender({
      documentId: "doc-1",
      content: "First draft",
      delayMs: 300,
    });
    await act(async () => vi.advanceTimersByTimeAsync(300));

    expect(requests).toEqual([
      { documentId: "doc-1", content: "First draft", revision: 1 },
    ]);
  });

  it("reports the server revision after a successful save", async () => {
    vi.useFakeTimers();
    const saveDraft: SaveDraft = async () => ({ revision: 42 });
    const hook = renderAutosave(saveDraft, {
      documentId: "doc-1",
      content: "Ready",
      delayMs: 100,
    });

    await act(async () => vi.advanceTimersByTimeAsync(100));

    expect(hook.result.current).toEqual({
      status: "saved",
      lastSavedRevision: 42,
    });
  });

  it("reports a failed save", async () => {
    vi.useFakeTimers();
    const saveDraft: SaveDraft = async () => {
      throw new Error("network unavailable");
    };
    const hook = renderAutosave(saveDraft, {
      documentId: "doc-1",
      content: "Ready",
      delayMs: 100,
    });

    await act(async () => vi.advanceTimersByTimeAsync(100));

    expect(hook.result.current.status).toBe("error");
  });
});
