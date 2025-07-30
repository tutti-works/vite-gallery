import { useState, useEffect, useRef, useCallback } from 'react';
import { multiplayerManager } from './MultiplayerManager';

// マルチプレイヤー機能を管理するカスタムフック
export const useMultiplayer = (enabled = true) => {
  const [isConnected, setIsConnected] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState({});
  const [playerId, setPlayerId] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const connectionRef = useRef(false);
  const mountedRef = useRef(true);

  // 接続処理
  const connect = useCallback(async () => {
    if (!enabled || connectionRef.current) {
      console.log('Connection skipped:', { enabled, connecting: connectionRef.current });
      return;
    }

    console.log('Starting multiplayer connection...');
    connectionRef.current = true;
    setConnectionError(null);

    try {
      // コールバックを設定
      multiplayerManager.setOnPlayersUpdate((players) => {
        if (mountedRef.current) {
          console.log('Players updated:', Object.keys(players).length, 'other players');
          setOtherPlayers(players);
        }
      });

      // ランダムな初期位置で接続
      const initialPosition = {
        x: Math.random() * 6 - 3,
        y: 1,
        z: Math.random() * 6 - 3
      };

      const id = await multiplayerManager.connect({
        position: initialPosition,
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        animation: 'Idle'
      });

      if (mountedRef.current) {
        setPlayerId(id);
        setIsConnected(true);
        console.log('✅ Multiplayer connected with ID:', id);
      }
    } catch (error) {
      console.error('❌ Multiplayer connection failed:', error);
      connectionRef.current = false;
      if (mountedRef.current) {
        setIsConnected(false);
        setConnectionError(error.message);
      }
    }
  }, [enabled]);

  // 切断処理
  const disconnect = useCallback(async () => {
    console.log('Disconnecting from multiplayer...');
    try {
      await multiplayerManager.disconnect();
      connectionRef.current = false;
      
      if (mountedRef.current) {
        setIsConnected(false);
        setOtherPlayers({});
        setPlayerId(null);
        setConnectionError(null);
      }
      console.log('✅ Disconnected from multiplayer');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
    }
  }, []);

  // 位置更新
  const updatePosition = useCallback((position, rotation, animation) => {
    if (isConnected && playerId) {
      multiplayerManager.updatePlayerPosition(position, rotation, animation);
    }
  }, [isConnected, playerId]);

  // マウント時の処理
  useEffect(() => {
    mountedRef.current = true;

    // 少し遅延させてFirebaseの初期化を待つ
    const timer = setTimeout(() => {
      if (enabled && mountedRef.current) {
        connect();
      }
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      
      // 切断処理を実行
      multiplayerManager.disconnect().catch(console.error);
      connectionRef.current = false;
    };
  }, [enabled]); // connectは依存配列に含めない

  // ブラウザ終了時の処理
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (connectionRef.current && multiplayerManager.playerRef) {
        // sendBeacon APIを使用して非同期でクリーンアップを試みる
        if (navigator.sendBeacon && playerId) {
          const cleanupUrl = `/api/cleanup-player/${playerId}`;
          navigator.sendBeacon(cleanupUrl);
        }
        
        // ローカルストレージにクリーンアップフラグを設定
        if (playerId) {
          localStorage.setItem('cleanup_player_' + playerId, Date.now().toString());
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
    };
  }, [playerId]);

  // クリーンアップチェック（他のタブが閉じられた場合）
  useEffect(() => {
    if (!isConnected) return;

    const checkCleanup = () => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cleanup_player_')) {
          const timestamp = parseInt(localStorage.getItem(key));
          const age = Date.now() - timestamp;
          
          // 5秒以上古いクリーンアップフラグは削除
          if (age > 5000) {
            localStorage.removeItem(key);
          }
        }
      });
    };

    const interval = setInterval(checkCleanup, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    isConnected,
    otherPlayers,
    playerId,
    updatePosition,
    connect,
    disconnect,
    connectionError,
    debugInfo: multiplayerManager.getDebugInfo()
  };
};