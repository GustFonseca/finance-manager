/**
 * Metro infers this preset on its own, but Babel-based tooling (jest) needs it
 * declared explicitly.
 */
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
