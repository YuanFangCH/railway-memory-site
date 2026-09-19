import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      "coverage/**",
      "public/media/**",
      "storage/**",
      "something/**"
    ]
  }
];

export default config;
