import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/core/__tests__/**/*.test.{ts,tsx}', 'src/charts/**/*.test.tsx', 'src/components/**/*.test.tsx', 'src/inputs/**/*.test.tsx', 'src/a2ui/**/*.test.ts', 'src/fusion/**/*.test.ts', 'src/native-core/**/*.test.ts', 'src/agent-helper/**/*.test.ts'],
  },
})
