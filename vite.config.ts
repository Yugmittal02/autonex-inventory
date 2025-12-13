Set-Content vite.config.ts "import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// FINAL VERCEL FIX 2.0
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    extensions: ['.web.js', '.js', '.ts', '.tsx']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})"