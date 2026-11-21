import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  /* GitHub Pages serves this repo from a subpath; dev stays at the root. */
  base: command === 'build' ? '/Yet-Another-Typing-Practice/' : '/',
}))
