import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensure each test starts from a clean DOM - several tests here click a
// listing, await its detail resolving, then click another, and stray
// nodes from a previous test would make failures very confusing to read.
afterEach(() => {
  cleanup();
});
