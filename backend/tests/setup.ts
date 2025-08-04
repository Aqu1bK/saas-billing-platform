import { initGlobalPool } from '../src/config/db';

// Initialize DB connection before tests
beforeAll(async () => {
  await initGlobalPool();
});

// Clean up after tests
afterAll(async () => {
  await (global as any).__db__.close();
});

// Add type declaration for global Jest functions
declare global {
  function beforeAll(fn: () => Promise<void>): void;
  function afterAll(fn: () => Promise<void>): void;
}

export {};