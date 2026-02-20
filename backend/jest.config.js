module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/migrations/**',
    '!src/seeders/**'
  ],
  coverageThreshold: {
    global: {
      branches: 18,
      functions: 45,
      lines: 54,
      statements: 53
    }
  },
  globalTeardown: '<rootDir>/tests/teardown.js'
};
