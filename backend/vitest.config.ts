import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // SWC emits the decorator metadata NestJS needs for dependency injection.
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['src/**/*.spec.ts', 'tests/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'tests/architecture/fixtures/**'],
    environment: 'node',
  },
});
