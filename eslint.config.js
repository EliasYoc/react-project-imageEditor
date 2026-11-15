import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

const hookRulesAsWarnings = Object.fromEntries(
  Object.keys(reactHooks.configs.flat.recommended.rules).map((rule) => [
    rule,
    "warn",
  ])
);

export default defineConfig([
  globalIgnores(["build", "coverage"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      // Desactiva las reglas de estilo que chocan con Prettier (el formato lo decide Prettier).
      prettier,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Las variables en PascalCase se usan como componentes JSX; ESLint core no las ve.
      "no-unused-vars": ["warn", { varsIgnorePattern: "^[A-Z_]" }],
    },
  },
  {
    // Código nuevo en TypeScript (núcleo del editor).
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.browser },
    },
  },
  {
    // Código que se va a reemplazar (hoy, los styled-components de
    // components/ui/legacy, que se quitan en la Fase 6): se toca lo mínimo, así
    // que sus avisos de hooks no bloquean. Desaparece con esas carpetas.
    files: ["**/legacy/**/*.{js,jsx}"],
    rules: hookRulesAsWarnings,
  },
  {
    files: ["**/*.test.{js,jsx,ts,tsx}", "src/setupTests.js"],
    languageOptions: { globals: { ...globals.browser, ...globals.vitest } },
  },
  {
    files: ["vite.config.js", "eslint.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
]);
