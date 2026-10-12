// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // docs/ har Figma-skript som körs i Figma, inte i appen
    ignores: ["dist/*", ".expo/*", "docs/*"],
  },
]);
