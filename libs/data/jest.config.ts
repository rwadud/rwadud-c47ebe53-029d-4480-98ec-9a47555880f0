export default {
  testEnvironment: 'node',
  displayName: 'data',
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
  coverageDirectory: '../../coverage/libs/data',
  moduleNameMapper: {
    '^@stms/data$': '<rootDir>/src/index.ts',
    '^@stms/auth$': '<rootDir>/../auth/src/index.ts',
  },
};
