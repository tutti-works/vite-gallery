import React, { useState, useEffect } from 'react';
import { multiplayerManager } from './MultiplayerManager';

const DebugPanel = ({ enabled = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [databaseSnapshot, setDatabaseSnapshot] = useState({});
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      // デバッグ情報を更新
      setUpdateCount(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !isOpen) return;

    // Firebaseデータベースの監視（デバッグ用）
    const { database } = require('./firebase');
    const { ref, onValue } = require('firebase/database');
    
    const playersRef = ref(database, 'players');
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setDatabaseSnapshot(data);
    });

    return () => unsubscribe();
  }, [enabled, isOpen]);

  if (!enabled) return null;

  const debugInfo = multiplayerManager.getDebugInfo();
  const playerCount = Object.keys(databaseSnapshot).length;

  return (
    <>
      {/* トグルボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          padding: '10px',
          backgroundColor: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        {isOpen ? 'Hide' : 'Show'} Debug
      </button>

      {/* デバッグパネル */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '50px',
          left: '10px',
          width: '400px',
          maxHeight: '60vh',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: '#0f0',
          padding: '15px',
          borderRadius: '5px',
          zIndex: 999,
          fontFamily: 'monospace',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#0f0' }}>🔧 Multiplayer Debug Panel</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#ff0', margin: '5px 0' }}>Local State:</h4>
            <div>My Player ID: <span style={{ color: '#0f0' }}>{debugInfo.playerId || 'Not connected'}</span></div>
            <div>Connected: {debugInfo.isConnected ? '✅' : '❌'}</div>
            <div>Has Listener: {debugInfo.hasListener ? '✅' : '❌'}</div>
            <div>Has Player Ref: {debugInfo.hasPlayerRef ? '✅' : '❌'}</div>
            <div>Total Players: {debugInfo.totalPlayers}</div>
            <div>Other Players: {debugInfo.otherPlayers}</div>
            <div>Update Count: {updateCount}</div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#ff0', margin: '5px 0' }}>Database State:</h4>
            <div>Total Players in DB: {playerCount}</div>
            <div style={{ marginTop: '10px' }}>
              <strong>Players:</strong>
              {Object.entries(databaseSnapshot).map(([id, data]) => (
                <div key={id} style={{ 
                  marginLeft: '10px', 
                  marginTop: '5px',
                  padding: '5px',
                  backgroundColor: id === debugInfo.playerId ? '#003300' : 'transparent',
                  border: id === debugInfo.playerId ? '1px solid #0f0' : 'none'
                }}>
                  <div style={{ color: id === debugInfo.playerId ? '#0f0' : '#999' }}>
                    {id === debugInfo.playerId ? '👤 ' : ''}ID: {id}
                  </div>
                  <div style={{ marginLeft: '20px', fontSize: '11px' }}>
                    Pos: ({data.position?.x?.toFixed(2)}, {data.position?.y?.toFixed(2)}, {data.position?.z?.toFixed(2)})
                  </div>
                  <div style={{ marginLeft: '20px', fontSize: '11px' }}>
                    Animation: {data.animation}
                  </div>
                  <div style={{ marginLeft: '20px', fontSize: '11px' }}>
                    Last Update: {data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ color: '#ff0', margin: '5px 0' }}>Instructions:</h4>
            <div style={{ fontSize: '11px', color: '#999' }}>
              • Each tab should have a unique Player ID<br/>
              • Opening a new tab should add exactly 1 player<br/>
              • Closing a tab should remove exactly 1 player<br/>
              • Check Firebase Emulator UI at http://localhost:4000
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel;