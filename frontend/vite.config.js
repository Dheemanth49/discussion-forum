import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  build: {
    // The markdown editor is route-isolated and intentionally shipped as a larger lazy chunk.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('@uiw/react-md-editor')) {
            return 'editor'
          }

          if (
            id.includes('react-markdown') ||
            id.includes('remark-gfm') ||
            id.includes('react-syntax-highlighter') ||
            id.includes('prismjs') ||
            id.includes('refractor')
          ) {
            return 'markdown'
          }

          if (
            id.includes('react-router-dom') ||
            id.includes('react-dom') ||
            id.includes('react/')
          ) {
            return 'react-vendor'
          }
        },
      },
    },
  },
})
