import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // CORS設定を追加してFirebase Emulatorとの通信を許可
    cors: true,
    // ホスト設定
    host: true,
    // HMRの設定
    hmr: {
      overlay: true
    }
  },
  // 最適化設定
  optimizeDeps: {
    // Firebaseモジュールを事前バンドルに含める
    include: ['firebase/app', 'firebase/database']
  },
  // 環境変数のプレフィックス
  envPrefix: 'VITE_'
})