import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensure each test starts from a clean DOM - several tests here pick an
// origin/destination, await the fare resolving, then change a selection
// again, and stray nodes from a previous test would make failures very
// confusing to read.
afterEach(() => {
  cleanup();
});
