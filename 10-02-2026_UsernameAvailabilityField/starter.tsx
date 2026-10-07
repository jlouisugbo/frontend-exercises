// Live username availability check for Loopline's creator signup flow.
// Growth wants this to feel instant - no "check availability" button, just
// type and get feedback, with Continue only lighting up once we've actually
// confirmed the handle is free.

import { useEffect, useState } from 'react';

export interface AvailabilityResult {
  username: string;
  available: boolean;
  suggestion?: string;
}

export type CheckAvailability = (username: string) => Promise<AvailabilityResult>;

export type AvailabilityStatus =
  | 'idle'
  | 'too-short'
  | 'checking'
  | 'available'
  | 'taken'
  | 'error';

export interface UsernameFieldProps {
  checkAvailability: CheckAvailability;
  minLength?: number;
  debounceMs?: number;
}

const DEFAULT_MIN_LENGTH = 3;
export const DEFAULT_DEBOUNCE_MS = 300;
const VARIANT_SUFFIXES = ['1', '2', '3'] as const;

function variantUsernames(base: string): string[] {
  return VARIANT_SUFFIXES.map((suffix) => `${base}${suffix}`);
}

export function UsernameField({
  checkAvailability,
  minLength = DEFAULT_MIN_LENGTH,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UsernameFieldProps) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [status, setStatus] = useState<AvailabilityStatus>('idle');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [variantSuggestions, setVariantSuggestions] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Wait for typing to settle before bothering the availability service.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [inputValue, debounceMs]);

  // Run the actual check once the debounced value settles.
  useEffect(() => {
    if (debouncedValue.length === 0) {
      setStatus('idle');
      setSuggestion(null);
      setVariantSuggestions([]);
      setErrorMessage(null);
      return;
    }

    if (debouncedValue.length < minLength) {
      setStatus('too-short');
      setSuggestion(null);
      setVariantSuggestions([]);
      setErrorMessage(null);
      return;
    }

    setStatus('checking');
    setSuggestion(null);
    setVariantSuggestions([]);
    setErrorMessage(null);

    let canceled = false;
    checkAvailability(debouncedValue)
      .then((result) => {
        if (canceled || result.username !== debouncedValue) {
          return;
        }
        setStatus(result.available ? 'available' : 'taken');
        setSuggestion(result.available ? null : (result.suggestion ?? null));
      })
      .catch((err: unknown) => {
        if (canceled) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Unknown error';
        setStatus('error');
        setErrorMessage(message);
      });

    return () => {
      canceled = true;
    };
  }, [debouncedValue, minLength, checkAvailability]);

  // Bonus: probe generated variants when the settled username is taken.
  // Never touches main status — only variantSuggestions, with its own cancel guard.
  useEffect(() => {
    if (status !== 'taken' || debouncedValue.length < minLength) {
      setVariantSuggestions([]);
      return;
    }

    let canceled = false;
    setVariantSuggestions([]);

    const variants = variantUsernames(debouncedValue);
    for (const variant of variants) {
      checkAvailability(variant)
        .then((result) => {
          if (canceled || result.username !== variant) {
            return;
          }
          if (!result.available) {
            return;
          }
          setVariantSuggestions((previous) =>
            previous.includes(result.username) ? previous : [...previous, result.username]
          );
        })
        .catch(() => {
          // Variant probes are best-effort; main field already shows taken.
        });
    }

    return () => {
      canceled = true;
    };
  }, [debouncedValue, status, minLength, checkAvailability]);

  const canContinue = status === 'available';

  return (
    <div data-testid="username-field">
      <label htmlFor="username">Choose a username</label>
      <input
        id="username"
        data-testid="username-input"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
      />

      {status === 'too-short' && (
        <p data-testid="status-message" role="status">
          Username must be at least {minLength} characters.
        </p>
      )}

      {status === 'checking' && (
        <p data-testid="status-message" role="status">
          Checking availability…
        </p>
      )}

      {status === 'available' && (
        <p data-testid="status-message" role="status" className="status-available">
          @{debouncedValue} is available!
        </p>
      )}

      {status === 'taken' && (
        <div data-testid="status-message" role="alert" className="status-taken">
          <p>@{debouncedValue} is already taken.</p>
          {suggestion && <p data-testid="suggestion">Try &quot;{suggestion}&quot; instead?</p>}
          {variantSuggestions.length > 0 && (
            <div data-testid="suggestions-row">
              <p>Suggestions for you to try!</p>
              {variantSuggestions.map((name) => (
                <p data-testid="variant-suggestion" key={name}>@{name}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <p data-testid="status-message" role="alert">
          Couldn&apos;t check that username: {errorMessage}
        </p>
      )}

      <button data-testid="continue-button" disabled={!canContinue}>
        Continue
      </button>
    </div>
  );
}
