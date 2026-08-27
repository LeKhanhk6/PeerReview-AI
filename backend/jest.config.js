export default {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  clearMocks: true,
  restoreMocks: true,
  detectOpenHandles: true,
  testTimeout: 5000
};
