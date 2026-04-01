import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // ✅ SockJS 브라우저 호환성 에러 해결을 위한 설정 추가
  define: {
    global: 'window',
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // ✅ 웹소켓 프록시 설정 (ws: true가 반드시 있어야 합니다!)
      '/ws': {
        target: 'http://localhost:8080',
        ws: true, // 👈 실시간 통신 허용 버튼
        changeOrigin: true,
      },
    },

  },
},
)