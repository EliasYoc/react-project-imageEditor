import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // Lo que genera Playwright (informes y resultados) no se revisa.
  globalIgnores(["build", "coverage", "playwright-report", "test-results"]),
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
    files: ["**/*.test.{js,jsx,ts,tsx}", "src/setupTests.ts"],
    languageOptions: { globals: { ...globals.browser, ...globals.vitest } },
  },
  {
    // Se ejecutan en Node, no en el navegador.
    files: ["vite.config.js", "eslint.config.js", "scripts/**/*.js"],
    languageOptions: { globals: { ...globals.node } },
  },
]);
