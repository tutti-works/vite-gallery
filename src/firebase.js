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

// データベースURLの設定
if (import.meta.env.DEV) {
  // 開発環境：Emulator用のURL
  firebaseConfig.databaseURL = "http://127.0.0.1:9000?ns=demo-project";
} else {
  // 本番環境：環境変数からデータベースURLを取得
  // 重要：Firebase Realtime Databaseのリージョンに応じた正しいURLを設定する必要があります
  firebaseConfig.databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://demo-project.firebaseio.com";
  
  // エラーメッセージから、正しいURLは asia-southeast1 リージョンのものである必要があります
  // Vercelの環境変数に以下のURLを設定してください：
  // VITE_FIREBASE_DATABASE_URL=https://vite-gallery-backend-default-rtdb.asia-southeast1.firebasedatabase.app
}

console.log('🔥 Firebase Config:', {
  projectId: firebaseConfig.projectId,
  databaseURL: firebaseConfig.databaseURL,
  environment: import.meta.env.DEV ? 'development' : 'production'
});

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
      connectDatabaseEmulator(database, '127.0.0.1', 9000);
      window.__firebaseEmulatorConnected = true;
      console.log('✅ Connected to Firebase Emulator at 127.0.0.1:9000');
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
  console.log('🌐 Using production Firebase at:', firebaseConfig.databaseURL);
}

export { database };