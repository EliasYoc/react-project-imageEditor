import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

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
      // Fase 0: las reglas de hooks/React Compiler se dejan en "warn" para listar
      // las malas prácticas actuales sin bloquear. En la Fase 1 (reescritura del
      // estado y los componentes) se vuelven "error".
      ...Object.fromEntries(
        Object.keys(reactHooks.configs.flat.recommended.rules).map((rule) => [
          rule,
          "warn",
        ])
      ),
      // Los contextos y constantes viven junto a los componentes; se separan en la Fase 1.
      "react-refresh/only-export-components": "warn",
    },
  },
  {
    // Código nuevo en TypeScript (núcleo del editor). Aquí las reglas de hooks
    // van en "error" desde el principio.
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
    files: ["**/*.test.{js,jsx,ts,tsx}", "src/setupTests.js"],
    languageOptions: { globals: { ...globals.browser, ...globals.vitest } },
  },
  {
    files: ["vite.config.js", "eslint.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
]);
