import { jest } from '@jest/globals';

// Fail fast on unhandled rejections
process.on("unhandledRejection", (err) => {
  throw err;
});

// Console Error Guard with Flexible Allow Mechanism
let isConsoleErrorAllowed = false;

beforeEach(() => {
  isConsoleErrorAllowed = false;
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  // 1. Check console guard FIRST (before restoring the spy)
  if (!isConsoleErrorAllowed) {
    expect(console.error).not.toHaveBeenCalled();
  }

  // 2. Clear usages (counts, args)
  jest.clearAllMocks();
  
  // 3. Restore original implementation of spies (essential to avoid leak)
  jest.restoreAllMocks();
});

// Helper for tests that intentionally throw/log errors
global.allowConsoleError = () => {
  isConsoleErrorAllowed = true;
};
