import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // R3F frame loops mutate memoized three.js objects in useFrame on purpose —
  // allocation-free per-frame updates are the whole point. The React Compiler
  // rules below assume render-time purity and don't apply to that pattern.
  {
    files: ["components/stage/**/*.tsx"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/globals": "off",
      "react-hooks/use-memo": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
