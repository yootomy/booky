import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends("next/core-web-vitals", "plugin:@typescript-eslint/recommended", "prettier"),
  {
    ignores: [
      ".next/**/*",
      "node_modules/**/*",
      "dist/**/*",
      "build/**/*",
      "coverage/**/*",
      ".vercel/**/*",
      "prisma/generated/**/*",
      "*.config.js",
      "*.config.ts",
      "next-env.d.ts"
    ]
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx", "!next-env.d.ts"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
      prettier,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "prettier/prettier": "off", // Temporarily disable for build check
      "@typescript-eslint/no-unused-vars": "off", // Disable for placeholder routes
      "@typescript-eslint/no-explicit-any": "off", // Allow any for now
      "@typescript-eslint/triple-slash-reference": "off", // Allow Next.js references
    },
  },
];
