import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const authTarget = env.VITE_AUTH_PROXY_TARGET || 'http://localhost:3000'
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://119.91.71.30:8080'

  return {
    plugins: [react()],
    test: {
      environment: "node",
      include: ["src/lib/__tests__/**/*.test.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"]
      }
    },
    server: {
      proxy: {
        '/api/rest': {
          target: apiTarget,
          changeOrigin: true
        },
        '/api': {
          target: authTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
