import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/**/*.ts', '!src/__tests__/**', '!src/local.ts', '!src/localCLI.ts'],
    format: ['cjs', 'esm'],
    dts: false,
    minify: false,  // true
    splitting: false,
  },
  {
    entry: ['src/local.ts', 'src/localCLI.ts'],
    format: ['esm'],
    dts: false,
    minify: false,  // true
    splitting: false,
  },
])
