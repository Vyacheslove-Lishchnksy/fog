import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

// base './' — працює з будь-якого шляху (Render, підпапки, file:// превʼю).
export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify((pkg as { version: string }).version),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
  },
});
