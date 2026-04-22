import fs from 'fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const runtimeEnvKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']

const buildRuntimeEnvScript = (env) => {
  const runtimeEnv = Object.fromEntries(
    runtimeEnvKeys.map((key) => [key, env[key]?.trim() || ''])
  )

  return `window.__NEXUS_ENV__ = ${JSON.stringify(runtimeEnv, null, 2)};\n`
}

const runtimeEnvPlugin = () => {
  let runtimeEnvScript = buildRuntimeEnvScript({})
  let runtimeEnvOutputPath = ''

  return {
    name: 'runtime-env-plugin',
    configResolved(config) {
      const loadedEnv = loadEnv(config.mode, config.envDir || resolve(__dirname, '..'), '')
      const mergedEnv = {
        ...loadedEnv,
        ...process.env
      }

      runtimeEnvScript = buildRuntimeEnvScript(mergedEnv)
      runtimeEnvOutputPath = resolve(config.root, config.build.outDir, 'runtime-env.js')
    },
    configureServer(server) {
      server.middlewares.use('/runtime-env.js', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript')
        res.end(runtimeEnvScript)
      })
    },
    closeBundle() {
      fs.mkdirSync(resolve(runtimeEnvOutputPath, '..'), { recursive: true })
      fs.writeFileSync(runtimeEnvOutputPath, runtimeEnvScript)
    }
  }
}

export default defineConfig({
  plugins: [react(), runtimeEnvPlugin()],
  envDir: resolve(__dirname, '..'),
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@context': resolve(__dirname, './src/context'),
      '@utils': resolve(__dirname, './src/utils'),
      '@config': resolve(__dirname, './src/config')
    }
  },
  server: {
    port: 3000,
    open: false
  },
  preview: {
    allowedHosts: ['nexus-ipl2.onrender.com']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  }
})
