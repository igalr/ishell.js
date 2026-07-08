import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/**/*.ts', '!src/__tests__/**', '!src/local.ts', '!src/localCLI.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    minify: false,  // true
    splitting: true,
  },
  {
    entry: ['src/local.ts', 'src/localCLI.ts'],
    format: ['esm'],
    dts: true,
    minify: false,  // true
    splitting: false,
  },
])
