import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    // Ye ensure karega ki web extensions pehle pick hon
    extensions: ['.web.js', '.js', '.web.ts', '.ts', '.web.tsx', '.tsx', '.jsx'],
  },
  // YE WALA PART ERROR FIX KAREGA
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx', // .js files ko JSX ki tarah padho
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})