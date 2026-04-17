import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/mviz-bridge/**/*.test.tsx', 'src/components/**/*.test.tsx', 'src/inputs/**/*.test.tsx'],
  },
})
