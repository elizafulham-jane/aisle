import react from '@aisle/config/eslint/react';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  ...react,
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  { ignores: ['.next/**', 'playwright-report/**', 'test-results/**', 'next-env.d.ts'] },
];
