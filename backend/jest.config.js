export default {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  clearMocks: true,
  restoreMocks: true,
  detectOpenHandles: true,
  testTimeout: 5000
};
