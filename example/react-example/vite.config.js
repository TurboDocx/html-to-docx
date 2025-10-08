import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use xmlbuilder2's browser-specific bundle
      'xmlbuilder2': path.resolve(__dirname, '../../node_modules/xmlbuilder2/lib/xmlbuilder2.min.js'),
    },
  },
})
