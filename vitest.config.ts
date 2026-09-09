import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.ts', 'packages/**/src/**/*.{test,spec}.ts'],
    passWithNoTests: true,
  },
});
