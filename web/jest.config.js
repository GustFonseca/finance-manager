/**
 * The app only ships to the browser, so the web preset is the single platform
 * under test.
 */
module.exports = {
  preset: 'jest-expo/web',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
};
