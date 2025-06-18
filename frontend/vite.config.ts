import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react(), nodePolyfills()],
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        format: 'esm',
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3001,
    allowedHosts: ['coinbase-attestation.zk-access.xyz'],
  },
})