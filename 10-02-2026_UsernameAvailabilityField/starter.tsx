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

export function UsernameField({
  checkAvailability,
  minLength = DEFAULT_MIN_LENGTH,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UsernameFieldProps) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [status, setStatus] = useState<AvailabilityStatus>('idle');
  const [suggestion, setSuggestion] = useState<string | null>(null);
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
      setErrorMessage(null);
      return;
    }

    if (debouncedValue.length < minLength) {
      setStatus('too-short');
      setSuggestion(null);
      setErrorMessage(null);
      return;
    }

    setStatus('checking');
    setErrorMessage(null);

    checkAvailability(debouncedValue)
      .then((result) => {
        setStatus(result.available ? 'available' : 'taken');
        setSuggestion(result.suggestion ?? null);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setStatus('error');
        setErrorMessage(message);
      });
  }, [debouncedValue, minLength, checkAvailability]);

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
          {suggestion && <p data-testid="suggestion">Try "{suggestion}" instead?</p>}
        </div>
      )}

      {status === 'error' && (
        <p data-testid="status-message" role="alert">
          Couldn't check that username: {errorMessage}
        </p>
      )}

      <button data-testid="continue-button" disabled={!canContinue}>
        Continue
      </button>
    </div>
  );
}
