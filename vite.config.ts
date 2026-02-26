import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const authTarget = env.VITE_AUTH_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react() as any],
    test: {
      environment: "node",
      include: ["src/lib/__tests__/**/*.test.ts", "tests/**/*.test.{js,ts}"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"]
      }
    },
    server: {
      proxy: {
        '/api': {
          target: authTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
