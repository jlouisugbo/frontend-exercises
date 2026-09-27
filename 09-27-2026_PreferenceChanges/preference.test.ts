import { describe, expect, it } from "vitest";
import {
  applyPreferenceChange,
  applyPreferenceChanges,
  applyStoredPreferenceChange,
  readPreference,
  type PreferenceChange,
  type PreferenceState,
} from "./starter";

// -----------------------------------------------------------------------------
// Public API seam: adapt construction here if your type-safe API changes shape.
const initialState = (): PreferenceState => ({
  theme: "light",
  pageSize: 25,
  compactMode: false,
});

const change = (input: PreferenceChange): PreferenceChange => input;
// -----------------------------------------------------------------------------

describe("preference changes", () => {
  it("reads the selected preference", () => {
    expect(readPreference(initialState(), "theme")).toBe("light");
    expect(readPreference(initialState(), "pageSize")).toBe(25);
  });

  it("updates the theme", () => {
    expect(
      applyPreferenceChange(
        initialState(),
        change({ key: "theme", value: "dark" }),
      ).theme,
    ).toBe("dark");
  });

  it("updates the page size", () => {
    expect(
      applyPreferenceChange(
        initialState(),
        change({ key: "pageSize", value: 50 }),
      ).pageSize,
    ).toBe(50);
  });

  it("updates compact mode", () => {
    expect(
      applyPreferenceChange(
        initialState(),
        change({ key: "compactMode", value: true }),
      ).compactMode,
    ).toBe(true);
  });

  it("does not mutate the previous state", () => {
    const state = initialState();
    const next = applyPreferenceChange(
      state,
      change({ key: "theme", value: "dark" }),
    );

    expect(next).not.toBe(state);
    expect(state.theme).toBe("light");
  });

  it("applies a batch in order", () => {
    const next = applyPreferenceChanges(initialState(), [
      change({ key: "theme", value: "dark" }),
      change({ key: "pageSize", value: 10 }),
      change({ key: "compactMode", value: true }),
    ]);

    expect(next).toEqual({ theme: "dark", pageSize: 10, compactMode: true });
  });

  it("accepts a valid change from storage", () => {
    const next = applyStoredPreferenceChange(initialState(), {
      key: "pageSize",
      value: 50,
    });

    expect(next.pageSize).toBe(50);
  });

  it("rejects a stored value belonging to another key", () => {
    expect(() =>
      applyStoredPreferenceChange(initialState(), {
        key: "pageSize",
        value: "dark",
      }),
    ).toThrow("Invalid value for pageSize");
  });

  it("rejects an unknown stored key", () => {
    expect(() =>
      applyStoredPreferenceChange(initialState(), {
        key: "animations",
        value: true,
      }),
    ).toThrow("Unknown preference key");
  });

  it("rejects a non-object stored change", () => {
    expect(() => applyStoredPreferenceChange(initialState(), null)).toThrow(
      "Stored preference change must be an object",
    );
  });

  it("rejects an unsupported stored value type", () => {
    expect(() =>
      applyStoredPreferenceChange(initialState(), {
        key: "compactMode",
        value: { enabled: true },
      }),
    ).toThrow("Invalid value for compactMode");
  });
});
