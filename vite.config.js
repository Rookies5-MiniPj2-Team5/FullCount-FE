import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // KBO 공식 사이트 프록시 (CORS 우회, 서버사이드 렌더링 HTML 파싱)
      '/kbo-official': {
        target: 'https://www.koreabaseball.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kbo-official/, ''),
        headers: {
          'Referer': 'https://www.koreabaseball.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      },
      // 네이버 스포츠 (fallback용)
      '/naver-kbo': {
        target: 'https://sports.news.naver.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/naver-kbo/, ''),
        headers: {
          'Referer': 'https://sports.news.naver.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        },
      },
    },
  },
})
