import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Firebase設定（環境変数から取得）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// 開発環境の場合、Emulator用の設定を追加
if (import.meta.env.DEV) {
  // EmulatorのデータベースURLを明示的に設定
  firebaseConfig.databaseURL = "http://192.168.50.59:9000?ns=demo-project";
}

// Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);

// Realtime Databaseの取得
const database = getDatabase(app);

// 開発環境でエミュレータに接続
if (import.meta.env.DEV) {
  // グローバル変数でエミュレータ接続状態を管理
  if (!window.__firebaseEmulatorConnected) {
    try {
      // localhostではなく127.0.0.1を使用（Viteでの互換性向上）
      connectDatabaseEmulator(database, '192.168.50.59', 9000);
      window.__firebaseEmulatorConnected = true;
      console.log('✅ Connected to Firebase Emulator at 192.168.50.59:9000');
    } catch (error) {
      // 既に接続されている場合のエラーは無視
      if (error.message.includes('already been called')) {
        console.log('ℹ️ Firebase Emulator already connected');
        window.__firebaseEmulatorConnected = true;
      } else {
        console.error('❌ Firebase Emulator connection failed:', error);
      }
    }
  }
} else {
  console.log('🌐 Using production Firebase');
}

export { database };