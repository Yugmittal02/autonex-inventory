import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  plugins: [react()],
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
  },
})