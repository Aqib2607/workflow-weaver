import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',

  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})