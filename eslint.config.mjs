import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Add security-conscious linting rules
  {
    rules: {
      // Security-focused rules
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      // Prevent potential XSS in dangerouslySetInnerHTML
      "react/no-danger": "error",
      // Warn about using dangerouslySetInnerHTML with dynamic content
      "react/no-danger-with-children": "error",
    },
  },
]);

export default eslintConfig;