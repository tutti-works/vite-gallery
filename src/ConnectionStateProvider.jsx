import React, { createContext, useContext, useEffect, useState } from 'react';
import { multiplayerManager } from './MultiplayerManager';

// 接続状態を管理するコンテキスト
const ConnectionStateContext = createContext({
  localPlayerId: null,
  allPlayers: {},
  otherPlayers: {},
  isConnected: false
});

export const useConnectionState = () => useContext(ConnectionStateContext);

export const ConnectionStateProvider = ({ children }) => {
  const [localPlayerId, setLocalPlayerId] = useState(null);
  const [allPlayers, setAllPlayers] = useState({});
  const [otherPlayers, setOtherPlayers] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 定期的に状態を更新
    const updateState = () => {
      const currentId = multiplayerManager.getPlayerId();
      const currentIsConnected = multiplayerManager.getIsConnected();
      const currentAllPlayers = multiplayerManager.getAllPlayers();
      
      setLocalPlayerId(currentId);
      setIsConnected(currentIsConnected);
      setAllPlayers(currentAllPlayers);
      
      // 他プレイヤーのみをフィルタリング
      const others = {};
      Object.keys(currentAllPlayers).forEach(id => {
        if (id !== currentId) {
          others[id] = currentAllPlayers[id];
        }
      });
      setOtherPlayers(others);
      
      // デバッグログ
      if (currentIsConnected) {
        console.log('📊 Connection State Update:', {
          localPlayerId: currentId,
          totalPlayers: Object.keys(currentAllPlayers).length,
          otherPlayersCount: Object.keys(others).length,
          playerIds: Object.keys(currentAllPlayers)
        });
      }
    };

    // 初回実行
    updateState();

    // 定期的に更新（500msごと）
    const interval = setInterval(updateState, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <ConnectionStateContext.Provider value={{
      localPlayerId,
      allPlayers,
      otherPlayers,
      isConnected
    }}>
      {children}
    </ConnectionStateContext.Provider>
  );
};