import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 개발 중에 프론트에서 '/ask'로 호출하면
    // Vite가 백엔드('http://127.0.0.1:8000')로 대신 전달해 줍니다.
    // 이렇게 하면 프론트 코드는 주소가 단순해지고, CORS 문제도 줄어듭니다.
    proxy: {
      '/ask': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
