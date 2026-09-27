export type PreferenceState = {
  theme: "light" | "dark";
  pageSize: 10 | 25 | 50;
  compactMode: boolean;
};

export type PreferenceKey = keyof PreferenceState;
export type PreferenceValue = PreferenceState[PreferenceKey];

export type PreferenceChange = {
  key: PreferenceKey;
  value: PreferenceValue;
};

function isKnownPreferenceValue(value: unknown): value is PreferenceValue {
  return (
    value === "light" ||
    value === "dark" ||
    value === 10 ||
    value === 25 ||
    value === 50 ||
    typeof value === "boolean"
  );
}

export function readPreference(
  state: PreferenceState,
  key: PreferenceKey,
): PreferenceValue {
  return state[key];
}

export function applyPreferenceChange(
  state: PreferenceState,
  change: PreferenceChange,
): PreferenceState {
  switch (change.key) {
    case "theme":
      if (change.value !== "light" && change.value !== "dark") {
        throw new TypeError("Invalid value for theme");
      }
      return { ...state, theme: change.value };

    case "pageSize":
      if (change.value !== 10 && change.value !== 25 && change.value !== 50) {
        throw new TypeError("Invalid value for pageSize");
      }
      return { ...state, pageSize: change.value };

    case "compactMode":
      if (typeof change.value !== "boolean") {
        throw new TypeError("Invalid value for compactMode");
      }
      return { ...state, compactMode: change.value };
  }
}

export function applyPreferenceChanges(
  state: PreferenceState,
  changes: readonly PreferenceChange[],
): PreferenceState {
  return changes.reduce(applyPreferenceChange, state);
}

export function applyStoredPreferenceChange(
  state: PreferenceState,
  input: unknown,
): PreferenceState {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError("Stored preference change must be an object");
  }

  const record: Record<string, unknown> = { ...input };
  const { key, value } = record;

  if (key !== "theme" && key !== "pageSize" && key !== "compactMode") {
    throw new TypeError("Unknown preference key");
  }

  if (!isKnownPreferenceValue(value)) {
    throw new TypeError(`Invalid value for ${key}`);
  }

  return applyPreferenceChange(state, { key, value });
}
