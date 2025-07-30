import { 
  ref, 
  onValue, 
  onDisconnect, 
  set, 
  remove, 
  serverTimestamp,
  push,
  child,
  off
} from 'firebase/database';
import { database } from './firebase';

class MultiplayerManager {
  constructor() {
    this.playerId = null;
    this.playerRef = null;
    this.playersRef = ref(database, 'players');
    this.unsubscribe = null;
    this.onPlayersUpdate = null;
    this.isConnected = false;
    this.connectionPromise = null;
    this.allPlayers = {}; // 全プレイヤーのデータを保持
  }

  // プレイヤーIDの生成
  generatePlayerId() {
    // タイムスタンプとランダム値を組み合わせてユニークなIDを生成
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `player_${timestamp}_${random}`;
  }

  // 接続の初期化
  async connect(initialData = {}) {
    // 既に接続中または接続処理中の場合は既存の接続を返す
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.isConnected) {
      console.log('Already connected with player ID:', this.playerId);
      return this.playerId;
    }

    this.connectionPromise = this._doConnect(initialData);
    
    try {
      const result = await this.connectionPromise;
      return result;
    } catch (error) {
      this.connectionPromise = null;
      throw error;
    }
  }

  async _doConnect(initialData) {
    try {
      // 新しいプレイヤーIDを生成
      this.playerId = this.generatePlayerId();
      this.playerRef = ref(database, `players/${this.playerId}`);

      console.log('🎮 Connecting with new player ID:', this.playerId);

      // プレイヤーデータの初期設定
      const playerData = {
        id: this.playerId,
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        animation: 'Idle',
        timestamp: serverTimestamp(),
        connectedAt: Date.now(), // デバッグ用
        ...initialData
      };

      // データベースに登録
      await set(this.playerRef, playerData);

      // 切断時の処理を設定
      await onDisconnect(this.playerRef).remove().catch((error) => {
        console.error('Failed to set onDisconnect:', error);
      });

      // 全プレイヤーの更新を監視
      this.startListeningToPlayers();

      this.isConnected = true;
      console.log('✅ Successfully connected to multiplayer as:', this.playerId);

      return this.playerId;
    } catch (error) {
      console.error('❌ Failed to connect to multiplayer:', error);
      this.isConnected = false;
      this.playerId = null;
      this.playerRef = null;
      throw error;
    }
  }

  // プレイヤーリストの監視開始
  startListeningToPlayers() {
    // 既存のリスナーがあれば削除
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // 新しいリスナーを設定
    this.unsubscribe = onValue(this.playersRef, (snapshot) => {
      const allPlayersData = {};
      const otherPlayersData = {};
      
      snapshot.forEach((childSnapshot) => {
        const playerId = childSnapshot.key;
        const playerData = childSnapshot.val();
        
        // データにIDが含まれていることを確認
        const completePlayerData = {
          ...playerData,
          id: playerId
        };
        
        // 全プレイヤーデータに追加
        allPlayersData[playerId] = completePlayerData;
        
        // 自分以外のプレイヤーを他プレイヤーデータに追加
        if (playerId !== this.playerId) {
          otherPlayersData[playerId] = completePlayerData;
        }
      });

      // 全プレイヤーデータを保存
      this.allPlayers = allPlayersData;

      console.log('👥 Players update:', {
        myId: this.playerId,
        totalPlayers: Object.keys(allPlayersData).length,
        otherPlayers: Object.keys(otherPlayersData).length,
        playerIds: Object.keys(allPlayersData)
      });

      // コールバック関数を呼び出し（他プレイヤーのみ）
      if (this.onPlayersUpdate) {
        this.onPlayersUpdate(otherPlayersData);
      }
    }, (error) => {
      console.error('❌ Error listening to players:', error);
    });
  }

  // 自分の位置情報を更新
  updatePlayerPosition(position, rotation, animation) {
    if (!this.isConnected || !this.playerRef || !this.playerId) {
      return;
    }

    const updates = {
      id: this.playerId, // IDを常に含める
      position: {
        x: position.x,
        y: position.y,
        z: position.z
      },
      rotation: {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
        w: rotation.w
      },
      animation: animation,
      timestamp: serverTimestamp(),
      lastUpdate: Date.now() // デバッグ用
    };

    set(this.playerRef, updates).catch((error) => {
      console.error('Failed to update player position:', error);
    });
  }

  // 切断処理
  async disconnect() {
    if (!this.isConnected && !this.connectionPromise) {
      console.log('Already disconnected');
      return;
    }

    console.log('🔌 Disconnecting player:', this.playerId);

    try {
      // リスナーを削除
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }

      // プレイヤーデータを削除
      if (this.playerRef && this.isConnected) {
        await remove(this.playerRef);
      }

      // 状態をリセット
      this.playerId = null;
      this.playerRef = null;
      this.isConnected = false;
      this.connectionPromise = null;
      this.onPlayersUpdate = null;
      this.allPlayers = {};

      console.log('✅ Successfully disconnected from multiplayer');
    } catch (error) {
      console.error('❌ Error during disconnect:', error);
      // エラーが発生しても状態はリセット
      this.playerId = null;
      this.playerRef = null;
      this.isConnected = false;
      this.connectionPromise = null;
      this.allPlayers = {};
    }
  }

  // プレイヤー更新のコールバックを設定
  setOnPlayersUpdate(callback) {
    this.onPlayersUpdate = callback;
  }

  // 現在のプレイヤーIDを取得
  getPlayerId() {
    return this.playerId;
  }

  // 接続状態を取得
  getIsConnected() {
    return this.isConnected;
  }

  // 全プレイヤーデータを取得
  getAllPlayers() {
    return this.allPlayers;
  }

  // デバッグ情報を取得
  getDebugInfo() {
    return {
      playerId: this.playerId,
      isConnected: this.isConnected,
      hasListener: !!this.unsubscribe,
      hasPlayerRef: !!this.playerRef,
      totalPlayers: Object.keys(this.allPlayers).length,
      otherPlayers: Object.keys(this.allPlayers).filter(id => id !== this.playerId).length
    };
  }
}

// シングルトンインスタンスをエクスポート
export const multiplayerManager = new MultiplayerManager();