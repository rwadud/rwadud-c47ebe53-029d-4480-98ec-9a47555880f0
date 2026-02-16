export default {
  testEnvironment: 'node',
  displayName: 'auth',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        diagnostics: false,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/auth',
  moduleNameMapper: {
    '^@stms/data$': '<rootDir>/../data/src/index.ts',
    '^@stms/auth$': '<rootDir>/src/index.ts',
  },
};
