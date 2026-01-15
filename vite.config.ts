import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: "/", // 🔴 مهم جدًا لـ Vercel
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
