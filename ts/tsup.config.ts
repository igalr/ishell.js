import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/**/*.ts', '!src/__tests__/**', '!src/local.ts', '!src/localCLI.ts'],
    format: ['cjs', 'esm'],
    dts: false,
    minify: true,
  },
  {
    entry: ['src/local.ts', 'src/localCLI.ts'],
    format: ['esm'],
    dts: false,
    minify: true,
  },
])
