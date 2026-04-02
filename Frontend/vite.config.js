import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/logo': {
          target: 'https://img.logo.dev',
          changeOrigin: true,
          rewrite: (path) => {
            // Extract symbol from path like /api/logo/btc
            const symbol = path.replace('/api/logo/', '')
            const apiKey = env.VITE_LOGO_DEV_API_KEY
            if (!apiKey) {
              console.warn('Warning: VITE_LOGO_DEV_API_KEY not set in environment')
            }
            return `/crypto/${symbol}?token=${apiKey || ''}`
          },
        },
      },
    },
    build: {
      // Optimize chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks - rarely change, cached well
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Chart libraries - heavy, separate chunk
            'chart-vendor': ['lightweight-charts'],
          },
        },
      },
      // Enable minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.logs in production
          drop_debugger: true,
        },
      },
      // Generate smaller chunks
      chunkSizeWarningLimit: 500,
    },
  }
})