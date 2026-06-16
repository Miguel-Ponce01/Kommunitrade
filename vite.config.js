import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pre-bundle Firebase sub-packages so Vite doesn't scan them on every HMR
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/functions',
      'firebase/app-check',
    ],
  },
  build: {
    // Warn when any individual chunk exceeds 500KB
    chunkSizeWarningLimit: 500,
    // Use esbuild (default, very fast) for minification
    minify: 'esbuild',
    // Split CSS per chunk so only the needed styles load per page
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React core — tiny, cache separately
            if (id.includes('react-dom') || id.includes('react/')) return 'react-vendor';
            // React Router
            if (id.includes('react-router')) return 'router-vendor';
            // Firebase — split by sub-SDK so unused ones aren't loaded
            if (id.includes('firebase/auth')) return 'firebase-auth';
            if (id.includes('firebase/firestore')) return 'firebase-firestore';
            if (id.includes('firebase/functions')) return 'firebase-functions';
            if (id.includes('firebase/storage')) return 'firebase-storage';
            if (id.includes('firebase')) return 'firebase-core';
            // Icons — large but static, cache long-term
            if (id.includes('lucide-react')) return 'lucide-vendor';
            // Everything else
            return 'vendor';
          }
        }
      }
    }
  }
})

