import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pin the dev port so it matches the Discord redirect URI
    port: 5173,
    // Proxy API calls to the auth backend (avoids CORS in dev)
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    // Enable code splitting with simpler configuration
    rollupOptions: {
      output: {
        // Simple manual chunk splitting
        manualChunks: (id) => {
          // Vendor chunks for third-party libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            return 'vendor';
          }
        }
      }
    },
    // CSS code splitting
    cssCodeSplit: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})