import { useGLTF, useAnimations, useKeyboardControls } from "@react-three/drei";
import { useEffect, useRef, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";

export const Character = forwardRef((props, ref) => {
  const group = useRef();
  const { scene, animations } = useGLTF("/models/player/character.gltf");
  const { actions } = useAnimations(animations, group);
  
  // キーボード入力の状態を取得
  const [sub, get] = useKeyboardControls();
  const currentAnimation = useRef("Idle");
  
  // キーボード入力に基づいてアニメーションを制御
  useFrame(() => {
    const { forward, backward, leftward, rightward, run, jump } = get();
    
    let newAnimation = "Idle";
    
    // デバッグ: 入力状態をログ出力
    if (forward || backward || leftward || rightward) {
      console.log("移動入力:", { forward, backward, leftward, rightward, run });
    }
    
    // アニメーション優先度：ジャンプ > 移動 > アイドル
    if (jump) {
      newAnimation = "Jump";
    } else if (forward || backward || leftward || rightward) {
      newAnimation = run ? "Run" : "Walk";
    }
    
    // アニメーションが変わった場合のみ切り替え
    if (newAnimation !== currentAnimation.current) {
      console.log(`アニメーション切り替え: ${currentAnimation.current} → ${newAnimation}`);
      
      // 前のアニメーションをフェードアウト
      if (actions[currentAnimation.current]) {
        actions[currentAnimation.current].fadeOut(0.2);
      }
      
      // 新しいアニメーションをフェードイン
      if (actions[newAnimation]) {
        const action = actions[newAnimation];
        action.reset().fadeIn(0.2).play();
        
        // アニメーション速度を調整
        if (newAnimation === "Walk") {
          action.timeScale = 1.5; // 歩行アニメーションを1.5倍速
        } else if (newAnimation === "Run") {
          action.timeScale = 1.2; // 走行アニメーションを1.2倍速
        } else if (newAnimation === "Idle") {
          action.timeScale = 1.0; // アイドルは標準速度
        } else if (newAnimation === "Jump") {
          action.timeScale = 1.0; // ジャンプは標準速度
        }
      }
      
      currentAnimation.current = newAnimation;
    }
  });
  
  // 初期アニメーション設定
  useEffect(() => {
    if (actions.Idle) {
      actions.Idle.play();
      console.log("初期アニメーション(Idle)を開始");
    }
  }, [actions]);
  
  return (
    <group ref={group}>
      <primitive 
        object={scene} 
        {...props} 
        dispose={null} 
        castShadow 
        position={[0, -0.9, 0]} // キャラクターの中心座標を調整
      />
    </group>
  );
});

useGLTF.preload("/models/player/character.gltf");