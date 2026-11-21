import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  /* Relative paths keep assets working on both the custom domain and the Pages subpath. */
  base: './',
})
