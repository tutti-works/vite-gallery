import React, { useEffect, useState } from 'react';
import { multiplayerManager } from './MultiplayerManager';

// シンプルなテストアプリケーション（3Dを使わずに接続テスト）
export default function TestApp() {
  const [playerId, setPlayerId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [allPlayers, setAllPlayers] = useState({});
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      try {
        addLog('🔄 Connecting to multiplayer...');
        
        // プレイヤー更新のコールバックを設定
        multiplayerManager.setOnPlayersUpdate((otherPlayers) => {
          if (mounted) {
            const all = multiplayerManager.getAllPlayers();
            setAllPlayers(all);
            addLog(`👥 Players updated: ${Object.keys(all).length} total, ${Object.keys(otherPlayers).length} others`);
          }
        });

        // 接続
        const id = await multiplayerManager.connect({
          position: { x: 0, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          animation: 'Idle'
        });

        if (mounted) {
          setPlayerId(id);
          setIsConnected(true);
          addLog(`✅ Connected with ID: ${id}`);
        }
      } catch (error) {
        addLog(`❌ Connection failed: ${error.message}`);
      }
    };

    // 少し遅延させて接続
    setTimeout(connect, 100);

    return () => {
      mounted = false;
      addLog('🔌 Disconnecting...');
      multiplayerManager.disconnect();
    };
  }, []);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1>Multiplayer Connection Test</h1>
      
      <div style={{
        backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
        color: isConnected ? '#155724' : '#721c24',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        Status: {isConnected ? 'Connected' : 'Disconnected'}
        {playerId && <span> - ID: {playerId}</span>}
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h3>All Players ({Object.keys(allPlayers).length})</h3>
        {Object.entries(allPlayers).map(([id, data]) => (
          <div key={id} style={{
            padding: '5px',
            backgroundColor: id === playerId ? '#fff3cd' : '#e9ecef',
            marginBottom: '5px',
            borderRadius: '3px'
          }}>
            {id === playerId && '👤 '}{id}
            <div style={{ fontSize: '12px', color: '#666' }}>
              Last update: {data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString() : 'N/A'}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '5px',
        height: '300px',
        overflow: 'auto'
      }}>
        <h3>Logs</h3>
        {logs.map((log, index) => (
          <div key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
            {log}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        Open this page in multiple tabs to test multiplayer connection.
      </div>
    </div>
  );
}