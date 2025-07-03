import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/temp/**']
    })
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
    lib: {
      entry: 'src/index.ts',
      name: 'ZkAccessCoinbase',
      fileName: 'index',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['@aztec/bb.js', '@noir-lang/noir_js'],
      output: {
        globals: {
          '@aztec/bb.js': 'AztecBB',
          '@noir-lang/noir_js': 'NoirJS'
        }
      },
    },
  },
})