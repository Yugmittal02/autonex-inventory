import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const extensions = [
  '.web.tsx', 
  '.tsx', 
  '.web.ts', 
  '.ts', 
  '.web.jsx', 
  '.jsx', 
  '.web.js', 
  '.js', 
  '.css', 
  '.json',
]

export default defineConfig({
  define: {
    global: 'window',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      includeAssets: [
        'myicon.png',
        'myicon_large.png',
        'myicon_maskable.png',
        'apple-touch-icon.png',
        'favicon-32x32.png',
        'favicon-16x16.png',
        'myicon.svg',
        'myicon-maskable.svg',
        'robots.txt',
      ],
      manifest: {
        name: 'AutoHub ERP System',
        short_name: 'AutoHub',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#000000',
        background_color: '#ffffff',
        icons: [
          {
            src: '/myicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/myicon_large.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/myicon_maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    extensions,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  // NEW STRATEGY: 
  // Hum keh rahe hain: "Sab kuch (JS/TS/JSX/TSX) ko 'tsx' ki tarah padho"
  // 'tsx' loader sabse powerful hai, wo Icons aur Code dono ko sambhal lega.
  esbuild: {
    loader: "tsx", 
    include: /src\/.*\.[tj]sx?$|node_modules\/.*\.[tj]sx?$/,
    exclude: [],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true, 
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('firebase/firestore')) return 'firebase-firestore';
          if (id.includes('firebase/auth')) return 'firebase-auth';
          if (id.includes('firebase/storage')) return 'firebase-storage';
          if (id.includes('firebase/app')) return 'firebase-app';
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('lucide-react')) return 'icons';

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/')
          ) {
            return 'react-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
})