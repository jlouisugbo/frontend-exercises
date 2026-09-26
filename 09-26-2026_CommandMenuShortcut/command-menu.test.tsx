// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CommandMenuShortcut } from "./starter";

afterEach(() => cleanup());

// -----------------------------------------------------------------------------
// Public API seam: change construction here if your refactor changes props.
function renderShortcut(enabled = true) {
  return render(<CommandMenuShortcut enabled={enabled} />);
}

function pressShortcut(options: { metaKey?: boolean; repeat?: boolean } = {}) {
  const event = new KeyboardEvent("keydown", {
    key: "k",
    ctrlKey: options.metaKey !== true,
    metaKey: options.metaKey === true,
    repeat: options.repeat ?? false,
    bubbles: true,
    cancelable: true,
  });

  fireEvent(document, event);
  return event;
}
// -----------------------------------------------------------------------------

describe("CommandMenuShortcut", () => {
  it("opens with Ctrl+K", () => {
    renderShortcut();
    pressShortcut();
    expect(screen.getByRole("dialog", { name: "Command menu" })).toBeInTheDocument();
  });

  it("opens with Command+K", () => {
    renderShortcut();
    pressShortcut({ metaKey: true });
    expect(screen.getByRole("dialog", { name: "Command menu" })).toBeInTheDocument();
  });

  it("prevents the browser default when it handles the shortcut", () => {
    renderShortcut();
    expect(pressShortcut().defaultPrevented).toBe(true);
  });

  it("ignores key repeat", () => {
    renderShortcut();
    pressShortcut({ repeat: true });
    expect(screen.queryByRole("dialog", { name: "Command menu" })).toBeNull();
  });

  it("ignores the shortcut while an input has focus", () => {
    renderShortcut();
    const input = screen.getByRole("textbox", { name: "Search page" });
    fireEvent.keyDown(input, { key: "k", ctrlKey: true });
    expect(screen.queryByRole("dialog", { name: "Command menu" })).toBeNull();
  });

  it("closes from the dialog button", () => {
    renderShortcut();
    pressShortcut();
    fireEvent.click(screen.getByRole("button", { name: "Close command menu" }));
    expect(screen.queryByRole("dialog", { name: "Command menu" })).toBeNull();
  });

  it("does nothing when initially disabled", () => {
    renderShortcut(false);
    pressShortcut();
    expect(screen.queryByRole("dialog", { name: "Command menu" })).toBeNull();
  });

  it("stops handling the shortcut after enabled changes to false", () => {
    const view = renderShortcut(true);
    view.rerender(<CommandMenuShortcut enabled={false} />);
    pressShortcut();
    expect(screen.queryByRole("dialog", { name: "Command menu" })).toBeNull();
  });

  it("starts handling the shortcut after enabled changes to true", () => {
    const view = renderShortcut(false);
    view.rerender(<CommandMenuShortcut enabled />);
    pressShortcut();
    expect(screen.getByRole("dialog", { name: "Command menu" })).toBeInTheDocument();
  });

  it("stops handling the shortcut after a rerender and unmount", () => {
    const view = renderShortcut(true);
    view.rerender(<CommandMenuShortcut enabled />);
    view.unmount();
    expect(pressShortcut().defaultPrevented).toBe(false);
  });
});
