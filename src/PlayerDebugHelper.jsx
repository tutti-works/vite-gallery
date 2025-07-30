import React from 'react';
import { Html } from '@react-three/drei';

// プレイヤーのデバッグ情報を3D空間に表示
const PlayerDebugHelper = ({ playerId, isLocal = false }) => {
  if (!import.meta.env.DEV) return null; // 開発環境でのみ表示

  return (
    <Html position={[0, 3, 0]} center>
      <div style={{
        backgroundColor: isLocal ? 'rgba(0, 255, 0, 0.8)' : 'rgba(0, 100, 255, 0.8)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        pointerEvents: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap'
      }}>
        {isLocal ? '🎮 LOCAL' : '👥 REMOTE'}<br/>
        {playerId ? playerId.substring(0, 15) + '...' : 'NO ID'}
      </div>
    </Html>
  );
};

export default PlayerDebugHelper;