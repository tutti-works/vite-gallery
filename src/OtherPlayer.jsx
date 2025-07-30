import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import PlayerDebugHelper from './PlayerDebugHelper';

// 他プレイヤーのキャラクターコンポーネント
const OtherCharacter = ({ animationState, playerId }) => {
  const group = useRef();
  const { scene, animations } = useGLTF("/models/player/character.gltf");
  const [clonedScene, setClonedScene] = useState(null);
  const [actions, setActions] = useState({});
  const mixer = useRef();
  const currentAnimation = useRef("Idle");
  
  // シーンをクローン（SkeletonUtilsを使用してアニメーションも正しく複製）
  useEffect(() => {
    try {
      console.log(`🔄 Cloning scene for other player: ${playerId}`);
      
      // SkeletonUtilsを使用してアニメーション付きでクローン
      const cloned = SkeletonUtils.clone(scene);
      cloned.name = `other-player-scene-${playerId}`;
      
      // クローンしたシーンの全メッシュに他プレイヤー用の名前を設定
      cloned.traverse((child) => {
        if (child.isMesh) {
          child.name = `other-player-mesh-${playerId}`;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      setClonedScene(cloned);
      
      // アニメーションミキサーを作成
      if (animations && animations.length > 0) {
        const newMixer = new THREE.AnimationMixer(cloned);
        mixer.current = newMixer;
        
        // アクションを準備
        const newActions = {};
        animations.forEach((clip) => {
          const action = newMixer.clipAction(clip);
          newActions[clip.name] = action;
        });
        
        setActions(newActions);
        
        // 初期アニメーション
        if (newActions.Idle) {
          newActions.Idle.play();
          console.log(`▶️ Playing initial animation for ${playerId}: Idle`);
        }
      }
      
      console.log(`✅ Successfully cloned scene for other player: ${playerId}`);
    } catch (error) {
      console.error(`❌ Error cloning scene for ${playerId}:`, error);
    }
    
    return () => {
      // クリーンアップ
      if (mixer.current) {
        mixer.current.stopAllAction();
        mixer.current = null;
      }
    };
  }, [scene, animations, playerId]);

  // アニメーション更新
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;
    
    const newAnimation = animationState || "Idle";
    
    if (newAnimation !== currentAnimation.current) {
      console.log(`🎭 Changing animation for ${playerId}: ${currentAnimation.current} → ${newAnimation}`);
      
      // 現在のアニメーションをフェードアウト
      if (actions[currentAnimation.current]) {
        actions[currentAnimation.current].fadeOut(0.2);
      }
      
      // 新しいアニメーションをフェードイン
      if (actions[newAnimation]) {
        const action = actions[newAnimation];
        action.reset().fadeIn(0.2).play();
        
        // アニメーション速度の調整
        if (newAnimation === "Walk") {
          action.timeScale = 1.5;
        } else if (newAnimation === "Run") {
          action.timeScale = 1.2;
        } else {
          action.timeScale = 1.0;
        }
      } else {
        console.warn(`⚠️ Animation not found for ${playerId}: ${newAnimation}`);
      }
      
      currentAnimation.current = newAnimation;
    }
  }, [animationState, actions, playerId]);
  
  // アニメーションミキサーの更新
  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });
  
  if (!clonedScene) {
    console.log(`⏳ Waiting for scene clone for ${playerId}...`);
    return null;
  }
  
  return (
    <group ref={group} name={`other-character-${playerId}`}>
      <primitive 
        object={clonedScene} 
        position={[0, -0.9, 0]}
        dispose={null}
      />
    </group>
  );
};

// フォールバックキャラクター（より目立つデザイン）
const FallbackOtherCharacter = ({ playerId }) => {
  const group = useRef();
  
  useFrame(() => {
    if (group.current) {
      group.current.position.y = Math.sin(Date.now() * 0.002) * 0.05;
    }
  });
  
  console.log(`🔷 Rendering fallback character for ${playerId}`);
  
  return (
    <group ref={group} name={`fallback-character-${playerId}`}>
      <mesh castShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.3, 1.4]} />
        <meshStandardMaterial color="#FF6B6B" opacity={0.9} transparent />
      </mesh>
      <mesh position={[0, 0.5, -0.4]} castShadow>
        <sphereGeometry args={[0.1]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* 目 */}
      <mesh position={[-0.05, 0.55, -0.45]} castShadow>
        <sphereGeometry args={[0.02]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[0.05, 0.55, -0.45]} castShadow>
        <sphereGeometry args={[0.02]} />
        <meshStandardMaterial color="black" />
      </mesh>
      
      {/* プレイヤー名表示 */}
      <Html position={[0, 2.5, 0]} center>
        <div style={{
          backgroundColor: 'rgba(255, 107, 107, 0.9)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          👥 OTHER PLAYER
          <br />
          <span style={{ fontSize: '10px', opacity: 0.8 }}>
            {playerId ? playerId.substring(0, 8) + '...' : 'NO ID'}
          </span>
        </div>
      </Html>
    </group>
  );
};

// 他プレイヤーコンポーネント
const OtherPlayer = ({ playerData, playerId }) => {
  const groupRef = useRef();
  const [smoothPosition] = useState(() => new THREE.Vector3());
  const [smoothRotation] = useState(() => new THREE.Quaternion());
  const [currentAnimation, setCurrentAnimation] = useState('Idle');
  const [isVisible, setIsVisible] = useState(false);
  
  // 補間の速度
  const POSITION_LERP = 0.15;  // 少し早く
  const ROTATION_SLERP = 0.15;
  
  // デバッグログ
  useEffect(() => {
    console.log(`👥 OtherPlayer mounted: ${playerId}`, {
      hasPlayerData: !!playerData,
      position: playerData?.position,
      animation: playerData?.animation
    });
    
    return () => {
      console.log(`👥 OtherPlayer unmounted: ${playerId}`);
    };
  }, [playerId]);
  
  // 初期位置設定とvisibility管理
  useEffect(() => {
    if (playerData?.position) {
      const newPos = new THREE.Vector3(
        playerData.position.x || 0,
        playerData.position.y || 1,
        playerData.position.z || 0
      );
      
      console.log(`📍 Setting initial position for ${playerId}:`, newPos);
      smoothPosition.copy(newPos);
      setIsVisible(true);
    }
    
    if (playerData?.rotation) {
      smoothRotation.set(
        playerData.rotation.x || 0,
        playerData.rotation.y || 0,
        playerData.rotation.z || 0,
        playerData.rotation.w || 1
      );
    }
  }, [playerId]); // playerDataの変更では初期化しない

  // フレームごとの位置・回転更新
  useFrame(() => {
    if (!groupRef.current || !playerData || !isVisible) return;

    // 位置の補間
    if (playerData.position) {
      const targetPosition = new THREE.Vector3(
        playerData.position.x || 0,
        playerData.position.y || 1,
        playerData.position.z || 0
      );
      
      smoothPosition.lerp(targetPosition, POSITION_LERP);
      groupRef.current.position.copy(smoothPosition);
    }

    // 回転の補間
    if (playerData.rotation) {
      const targetRotation = new THREE.Quaternion(
        playerData.rotation.x || 0,
        playerData.rotation.y || 0,
        playerData.rotation.z || 0,
        playerData.rotation.w || 1
      );
      
      smoothRotation.slerp(targetRotation, ROTATION_SLERP);
      groupRef.current.quaternion.copy(smoothRotation);
    }
  });

  // アニメーション状態の更新
  useEffect(() => {
    if (playerData?.animation && playerData.animation !== currentAnimation) {
      console.log(`🎭 Animation change for ${playerId}: ${currentAnimation} → ${playerData.animation}`);
      setCurrentAnimation(playerData.animation);
    }
  }, [playerData?.animation, playerId]);

  if (!playerData) {
    console.warn(`⚠️ OtherPlayer: No player data for ${playerId}`);
    return null;
  }

  if (!isVisible) {
    console.log(`👻 OtherPlayer: Not yet visible for ${playerId}`);
    return null;
  }

  console.log(`🎨 Rendering OtherPlayer: ${playerId}`, {
    position: smoothPosition,
    animation: currentAnimation,
    hasData: !!playerData
  });

  return (
    <group ref={groupRef} name={`other-player-${playerId}`}>
      <React.Suspense 
        fallback={<FallbackOtherCharacter playerId={playerId} />}
      >
        <OtherCharacter 
          animationState={currentAnimation} 
          playerId={playerId}
        />
      </React.Suspense>
      
      {/* デバッグヘルパー */}
      <PlayerDebugHelper playerId={playerId} isLocal={false} />
      
      {/* 追加のデバッグ情報（開発環境のみ） */}
      {import.meta.env.DEV && (
        <Html position={[0, 4, 0]} center>
          <div style={{
            backgroundColor: 'rgba(0, 0, 255, 0.8)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap'
          }}>
            {currentAnimation} | {smoothPosition.x.toFixed(1)}, {smoothPosition.z.toFixed(1)}
          </div>
        </Html>
      )}
    </group>
  );
};

export default OtherPlayer;