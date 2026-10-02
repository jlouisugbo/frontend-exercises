import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensure each test starts from a clean DOM and clears any pending debounce
// timers' effects - several tests here type, wait out the debounce, then
// type again, and stray nodes or timers from a previous test would make
// failures very confusing to read.
afterEach(() => {
  cleanup();
});
