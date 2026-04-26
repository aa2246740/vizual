import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/core/__tests__/**/*.test.ts', 'src/charts/**/*.test.tsx', 'src/components/**/*.test.tsx', 'src/inputs/**/*.test.tsx', 'src/docview/**/*.test.{ts,tsx}'],
    alias: {
      'marked': path.resolve(__dirname, 'src/docview/__tests__/mocks/marked.ts'),
    },
  },
})
