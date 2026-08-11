// vite.config.ts - the build tool configuration.
// Vite is the tool that runs the dev server and bundles the app for production.
// We register two plugins: React (JSX support) and Tailwind (the CSS framework).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative asset paths so the site works under a subpath
  // (GitHub Pages serves it at /el-hadegel-quiz/).
  base: './',
})
