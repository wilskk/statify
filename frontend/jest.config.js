const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/$1',
  },
  maxWorkers: process.env.CI ? "50%" : 2,
  testPathIgnorePatterns: [
    "<rootDir>/components/Modals/Edit/FindReplace/hooks/__test__/useFindReplaceForm.test.ts",
    "<rootDir>/components/Modals/Edit/GoTo/__tests__/GoToContent.test.tsx",
    "<rootDir>/components/Modals/Data/DefineVarProps/__tests__/VariablesToScan.test.tsx",
    "<rootDir>/components/Modals/Data/DefineVarProps/__tests__/PropertiesEditor.test.tsx",
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 