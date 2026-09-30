import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensure each test starts from a clean DOM - several tests here rerender
// the panel with a new patientId, and stray nodes from a previous test
// would make failures very confusing to read.
afterEach(() => {
  cleanup();
});
