const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  roots: ['<rootDir>'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/stores/(.*)$': '<rootDir>/stores/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/services/(.*)$': '<rootDir>/services/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/models/(.*)$': '<rootDir>/models/$1',
    '^@/constants/(.*)$': '<rootDir>/constants/$1',
    '^@/repositories/(.*)$': '<rootDir>/repositories/$1',
    // Mock CSS modules
    '\\.css$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/public/workers/'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 