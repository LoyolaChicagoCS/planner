import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import packageJson from './package.json' with { type: 'json' }

function getAppVersion() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return `v${packageJson.version.replace(/\.0$/, '')}`
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(getAppVersion()),
  },
  // Custom domain serves the app from the root: https://advising.cs.luc.edu/
  base: '/',
})
