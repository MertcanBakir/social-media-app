import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,     // <-- 3000
    host: true,     // ağda da erişmek istersen
    strictPort: true // port doluysa hata ver, başka porta geçme
  }
})