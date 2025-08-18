import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "public/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: "readonly",
        JSX: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "unused-imports": unusedImportsPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React specific rules
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-sort-props": [
        "warn",
        {
          callbacksLast: true,
          shorthandFirst: true,
          ignoreCase: true,
          reservedFirst: true,
        },
      ],

      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // General rules
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-undef": "error",
      "no-unused-vars": "off", // Using TypeScript's no-unused-vars instead
      "prettier/prettier": [
        "error",
        {
          singleQuote: false,
          trailingComma: "es5",
          semi: true,
          tabWidth: 2,
          printWidth: 100,
        },
      ],

      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Unused imports
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];
