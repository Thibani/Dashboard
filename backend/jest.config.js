/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  // Matches any *.test.ts under src, whether it sits in __tests__/ or next to the code
  testMatch: ["**/*.test.ts"],
  setupFiles: ["<rootDir>/jest.setup.ts"],
  clearMocks: true,
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        // Force CommonJS output and default-import interop, whatever your tsconfig says,
        // so `import bcrypt from "bcrypt"` and jest.mock() work.
        tsconfig: { module: "commonjs", esModuleInterop: true },
      },
    ],
  },
};