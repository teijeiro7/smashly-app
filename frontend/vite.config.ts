import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(({ mode }) => ({
  esbuild: {
    drop: mode === 'production' ? ['debugger'] : [],
    minifyIdentifiers: mode === 'production',
    minifySyntax: mode === 'production',
    minifyWhitespace: mode === 'production',
  },
  plugins: [
    react({
      // React compiler for better optimization
      babel: {
        parserOpts: {
          plugins: ['styled-components'],
        },
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['robots.txt', 'images/icons/smashly-icon.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Smashly',
        short_name: 'Smashly',
        lang: 'es',
        description:
          'Encuentra tu pala de pádel perfecta. Compara especificaciones, precios y reseñas de todas las principales marcas.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        categories: ['shopping', 'sports'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  publicDir: path.resolve(__dirname, '../public'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@types': path.resolve(__dirname, './src/types'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 5173,
    host: true,
    // In production: /api/* handled by Vercel serverless functions
    // For local dev with Vercel functions: run `vercel dev` instead of `vite`
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/backend/**',
        '**/testing/**',
        '**/.git/**',
        '**/public/videos/**',
        '**/public/images/readme-images/**',
      ],
    },
  },
  build: {
    // Use terser to drop ALL console.* statements in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Drops console.log, console.error, console.warn, console.info
        drop_debugger: mode === 'production',
      },
    },
    // No sourcemaps in production
    sourcemap: false,
    // Minify output
    target: 'es2020',
    // Reduce chunk size limit to force more splitting
    chunkSizeWarningLimit: 500,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Generate manifest
    manifest: true,
    // Report written size for debugging
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-is', '@tanstack/react-router'],
          'vendor-motion': ['framer-motion'],
          'vendor-styled': ['styled-components'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['react-icons'],
          'vendor-query': ['@tanstack/react-query', '@tanstack/react-virtual'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-router',
      '@tanstack/react-query',
    ],
    // Exclude heavy libs from optimization to load on demand
    exclude: [
      'jspdf',
      'html2canvas',
      '@dnd-kit/core',
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text', 'json'],
      reportsDirectory: './coverage',
    },
  },
}));