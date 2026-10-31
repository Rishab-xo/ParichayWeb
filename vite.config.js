import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all.
      // global: true,
      // process: true,
      // buffer: true,
      protocolImports: true,
    }),
  ],
  define: {
    // Some libraries use the global object, even though it is not supported in ES modules.
    // This is a workaround to make them work.
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api/chat-webhook': {
        target: 'https://rishab-19.app.n8n.cloud',
        changeOrigin: true,
        rewrite: (path) => '/webhook/ai-agent',
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
