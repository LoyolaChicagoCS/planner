import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Custom domain serves the app from the root: https://advising.cs.luc.edu/
  base: '/',
})
