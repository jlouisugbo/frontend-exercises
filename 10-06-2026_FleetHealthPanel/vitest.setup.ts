import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensure each test starts from a clean DOM - several tests here select a
// device, await its health resolving, then select a different device, and
// stray nodes from a previous test would make failures very confusing to
// read.
afterEach(() => {
  cleanup();
});
