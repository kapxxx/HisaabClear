import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /** Required so JS/CSS paths resolve inside the Capacitor WebView */
  base: './',
})
