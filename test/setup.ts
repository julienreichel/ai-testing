/**
 * Global test setup for IndexedDB mocking
 * This prevents "indexedDB is not defined" errors in component tests
 */

import { vi } from "vitest";

// Mock IndexedDB globally for all tests
const mockDB = {
  transaction: vi.fn(() => ({
    objectStore: vi.fn(() => ({
      add: vi.fn(() => Promise.resolve("mock-id")),
      get: vi.fn(() => Promise.resolve(undefined)),
      getAll: vi.fn(() => Promise.resolve([])),
      put: vi.fn(() => Promise.resolve("mock-id")),
      delete: vi.fn(() => Promise.resolve()),
      openCursor: vi.fn(() => Promise.resolve(null)),
    })),
  })),
  add: vi.fn(() => Promise.resolve("mock-id")),
  get: vi.fn(() => Promise.resolve(undefined)),
  getAll: vi.fn(() => Promise.resolve([])),
  put: vi.fn(() => Promise.resolve("mock-id")),
  delete: vi.fn(() => Promise.resolve()),
  getAllFromIndex: vi.fn(() => Promise.resolve([])),
};

// Mock the idb library globally
vi.mock("idb", () => ({
  openDB: vi.fn(() => Promise.resolve(mockDB)),
}));

// Mock indexedDB global if not available
if (typeof global.indexedDB === "undefined") {
  Object.defineProperty(global, "indexedDB", {
    value: {
      open: vi.fn(() => Promise.resolve(mockDB)),
      deleteDatabase: vi.fn(() => Promise.resolve()),
    },
    writable: true,
  });
}
