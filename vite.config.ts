import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 开发模式:vite 跑在 5174,API 代理到本地服务(先另开终端运行 `npm run server`)
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3002'
    }
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200
  }
})
