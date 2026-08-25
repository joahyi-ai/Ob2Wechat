import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores([
    "node_modules",
    "scripts",
    "test-vault",
    "main.js",
    "esbuild.config.mjs",
    "eslint.config.mjs",
    "versions.json",
    "package.json",
    "pnpm-lock.yaml",
    "tsconfig.json",
  ]),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ["manifest.json"],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".json"],
      },
    },
  },
  ...obsidianmd.configs.recommended,
  {
    files: ["tests/**/*.ts"],
    rules: {
      "@microsoft/sdl/no-inner-html": "off",
      "no-unsanitized/property": "off",
      "obsidianmd/no-global-this": "off",
      "obsidianmd/prefer-create-el": "off",
    },
  },
);
