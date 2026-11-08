import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    env: { SKIP_ENV_VALIDATION: '1', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' },
  },
});
