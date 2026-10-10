import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Disable automatic browser refresh, but keep file watching so a manual
// refresh receives the latest code without repeating paid API calls by itself.
export default defineConfig({
  plugins: [react()],
  server: { hmr: false },
})
