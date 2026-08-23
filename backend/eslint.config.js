import jestPlugin from "eslint-plugin-jest";

export default [
  {
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: {
        jest: true,
        describe: true,
        it: true,
        expect: true,
        beforeAll: true,
        afterAll: true,
        beforeEach: true,
        afterEach: true,
        console: true,
        process: true
      },
    },
    rules: {
      "jest/expect-expect": "error",
      "jest/no-disabled-tests": "warn",
      "jest/valid-expect": "error",
      "jest/no-done-callback": "error",
      "jest/no-focused-tests": "error",
      "jest/no-conditional-expect": "error",
      "jest/prefer-to-be": "warn"
    },
  },
];
