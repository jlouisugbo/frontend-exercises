import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UsernameField, type AvailabilityResult, type CheckAvailability } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how UsernameField is constructed, how
// the debounce is driven, and how checkAvailability results get back into
// it. If you refactor the component's internals (a reducer, a request-id
// guard, whatever), update ONLY the helpers in this block - the test cases
// below should keep working unchanged as long as the component's public
// props and rendered output stay the same shape.

const TEST_DEBOUNCE_MS = 20;

function renderField(overrides: {
  checkAvailability: CheckAvailability;
  minLength?: number;
}) {
  return render(
    <UsernameField
      checkAvailability={overrides.checkAvailability}
      minLength={overrides.minLength}
      debounceMs={TEST_DEBOUNCE_MS}
    />
  );
}

function checkAvailabilityResolvingWith(
  result: Omit<AvailabilityResult, 'username'>
): CheckAvailability {
  return (username) => Promise.resolve({ username, ...result });
}

function checkAvailabilityRejectingWith(message: string): CheckAvailability {
  return () => Promise.reject(new Error(message));
}

function typeUsername(value: string) {
  fireEvent.change(screen.getByTestId('username-input'), { target: { value } });
}

// Flushes the component's debounce timer (and any microtasks it kicks off)
// inside act(), so state updates from the timer/promise chain are applied
// before assertions run.
async function settleDebounce() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, TEST_DEBOUNCE_MS + 20));
  });
}
// -------------------------------------------------------------------------

describe('UsernameField', () => {
  it('starts idle with Continue disabled before anything is typed', () => {
    const checkAvailability = vi.fn();
    renderField({ checkAvailability });

    expect(screen.queryByTestId('status-message')).not.toBeInTheDocument();
    expect(screen.getByTestId('continue-button')).toBeDisabled();
    expect(checkAvailability).not.toHaveBeenCalled();
  });

  it('shows a too-short message and skips the availability check below the minimum length', async () => {
    const checkAvailability = vi.fn();
    renderField({ checkAvailability, minLength: 4 });

    typeUsername('jo');
    await settleDebounce();

    expect(screen.getByTestId('status-message')).toHaveTextContent('at least 4 characters');
    expect(screen.getByTestId('continue-button')).toBeDisabled();
    expect(checkAvailability).not.toHaveBeenCalled();
  });

  it('shows a checking indicator while the availability check is in flight', async () => {
    const checkAvailability: CheckAvailability = () => new Promise(() => {}); // never resolves
    renderField({ checkAvailability });

    typeUsername('joelu');
    await settleDebounce();

    expect(screen.getByTestId('status-message')).toHaveTextContent('Checking availability');
    expect(screen.getByTestId('continue-button')).toBeDisabled();
  });

  it('shows the username is available and enables Continue once the check resolves', async () => {
    const checkAvailability = checkAvailabilityResolvingWith({ available: true });
    renderField({ checkAvailability });

    typeUsername('joelu');
    await settleDebounce();

    expect(screen.getByTestId('status-message')).toHaveTextContent('@joelu is available!');
    expect(screen.getByTestId('continue-button')).toBeEnabled();
  });

  it('shows the username is taken with a suggestion and keeps Continue disabled', async () => {
    const checkAvailability = checkAvailabilityResolvingWith({
      available: false,
      suggestion: 'joelu42',
    });
    renderField({ checkAvailability });

    typeUsername('joelu');
    await settleDebounce();

    expect(screen.getByTestId('status-message')).toHaveTextContent('@joelu is already taken');
    expect(screen.getByTestId('suggestion')).toHaveTextContent('joelu42');
    expect(screen.getByTestId('continue-button')).toBeDisabled();
  });

  it('shows taken without a suggestion block when the check returns none', async () => {
    const checkAvailability = checkAvailabilityResolvingWith({ available: false });
    renderField({ checkAvailability });

    typeUsername('joelu');
    await settleDebounce();

    expect(screen.getByTestId('status-message')).toHaveTextContent('@joelu is already taken');
    expect(screen.queryByTestId('suggestion')).not.toBeInTheDocument();
  });

  it('shows an error message and keeps Continue disabled when the check fails', async () => {
    const checkAvailability = checkAvailabilityRejectingWith('availability service unreachable');
    renderField({ checkAvailability });

    typeUsername('joelu');
    await settleDebounce();

    expect(screen.getByTestId('status-message')).toHaveTextContent(
      'availability service unreachable'
    );
    expect(screen.getByTestId('continue-button')).toBeDisabled();
  });

  it('returns to idle when the field is cleared back to empty', async () => {
    const checkAvailability = checkAvailabilityResolvingWith({ available: true });
    renderField({ checkAvailability });

    typeUsername('joelu');
    await settleDebounce();
    expect(screen.getByTestId('status-message')).toHaveTextContent('@joelu is available!');

    typeUsername('');
    await settleDebounce();

    expect(screen.queryByTestId('status-message')).not.toBeInTheDocument();
    expect(screen.getByTestId('continue-button')).toBeDisabled();
  });
});
