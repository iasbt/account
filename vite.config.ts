import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const authTarget = env.VITE_AUTH_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react() as unknown as PluginOption],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: authTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
