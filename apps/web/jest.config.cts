const { createCjsPreset } = require('jest-preset-angular/build/presets/create-cjs-preset');

const preset = createCjsPreset({
  tsconfig: '<rootDir>/tsconfig.spec.json',
});

module.exports = {
  ...preset,
  displayName: 'web',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  moduleNameMapper: {
    '^@angular/common/http/testing$':
      '<rootDir>/../../node_modules/@angular/common/fesm2022/http-testing.mjs',
    '^@angular/common/http$':
      '<rootDir>/../../node_modules/@angular/common/fesm2022/http.mjs',
    '^@angular/common/testing$':
      '<rootDir>/../../node_modules/@angular/common/fesm2022/testing.mjs',
    '^@angular/core/testing$':
      '<rootDir>/../../node_modules/@angular/core/fesm2022/testing.mjs',
    '^@angular/platform-browser-dynamic/testing$':
      '<rootDir>/../../node_modules/@angular/platform-browser-dynamic/fesm2022/testing.mjs',
    '^@angular/platform-browser/testing$':
      '<rootDir>/../../node_modules/@angular/platform-browser/fesm2022/testing.mjs',
  },
  coverageDirectory: '../../coverage/apps/web',
};
