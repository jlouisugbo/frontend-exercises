import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensure each test starts from a clean DOM - several tests here pick a
// semester, await its grades resolving, then pick a different tab, and
// stray nodes from a previous test would make failures very confusing to
// read.
afterEach(() => {
  cleanup();
});
