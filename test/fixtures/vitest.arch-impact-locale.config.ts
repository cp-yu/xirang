import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/fixtures/arch-impact-locale-process.fixture.ts'],
    pool: 'forks',
    maxWorkers: 1,
  },
});
