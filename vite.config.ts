import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/health-diary/', // GitHub Pages 배포를 위한 base 경로 (저장소 이름에 맞게 수정)
})
