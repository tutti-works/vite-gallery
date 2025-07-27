import React, { useState, useEffect, useCallback, useRef } from 'react';

// キーボード入力フック
export const useKeyboardInput = () => {
  const [inputState, setInputState] = useState({
    forward: false,
    backward: false,
    leftward: false,
    rightward: false,
    jump: false,
    run: false
  });

  useEffect(() => {
    const keysPressed = {};

    const handleKeyDown = (event) => {
      const key = event.code;
      if (keysPressed[key]) return; // キーリピート防止
      
      keysPressed[key] = true;

      setInputState(prev => {
        const newState = { ...prev };
        
        switch (key) {
          case 'KeyW':
          case 'ArrowUp':
            newState.forward = true;
            break;
          case 'KeyS':
          case 'ArrowDown':
            newState.backward = true;
            break;
          case 'KeyA':
          case 'ArrowLeft':
            newState.leftward = true;
            break;
          case 'KeyD':
          case 'ArrowRight':
            newState.rightward = true;
            break;
          case 'Space':
            newState.jump = true;
            event.preventDefault();
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            newState.run = true;
            break;
        }
        
        return newState;
      });
    };

    const handleKeyUp = (event) => {
      const key = event.code;
      keysPressed[key] = false;

      setInputState(prev => {
        const newState = { ...prev };
        
        switch (key) {
          case 'KeyW':
          case 'ArrowUp':
            newState.forward = false;
            break;
          case 'KeyS':
          case 'ArrowDown':
            newState.backward = false;
            break;
          case 'KeyA':
          case 'ArrowLeft':
            newState.leftward = false;
            break;
          case 'KeyD':
          case 'ArrowRight':
            newState.rightward = false;
            break;
          case 'Space':
            newState.jump = false;
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            newState.run = false;
            break;
        }
        
        return newState;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return inputState;
};

// バーチャルジョイスティック
export const VirtualJoystick = ({ onMove, onJump, isMobile }) => {
  const [joystickData, setJoystickData] = useState({ x: 0, y: 0, active: false });
  const joystickRef = useRef();
  const isActiveRef = useRef(false);

  const calculatePosition = useCallback((clientX, clientY) => {
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2 - 15;
    
    let normalizedX = deltaX / maxDistance;
    let normalizedY = deltaY / maxDistance;
    
    if (distance > maxDistance) {
      normalizedX = (deltaX / distance);
      normalizedY = (deltaY / distance);
    }

    return {
      x: Math.max(-1, Math.min(1, normalizedX)),
      y: Math.max(-1, Math.min(1, -normalizedY))
    };
  }, []);

  const handleStart = useCallback((clientX, clientY) => {
    isActiveRef.current = true;
    setJoystickData(prev => ({ ...prev, active: true }));
    
    const position = calculatePosition(clientX, clientY);
    setJoystickData({ x: position.x, y: position.y, active: true });
    onMove(position.x, position.y);
  }, [calculatePosition, onMove]);

  const handleMove = useCallback((clientX, clientY) => {
    if (!isActiveRef.current) return;
    
    const position = calculatePosition(clientX, clientY);
    setJoystickData({ x: position.x, y: position.y, active: true });
    onMove(position.x, position.y);
  }, [calculatePosition, onMove]);

  const handleEnd = useCallback(() => {
    isActiveRef.current = false;
    setJoystickData({ x: 0, y: 0, active: false });
    onMove(0, 0);
  }, [onMove]);

  // グローバルイベントリスナー
  useEffect(() => {
    const handleGlobalTouchMove = (e) => {
      if (!isActiveRef.current) return;
      e.preventDefault();
      const touch = e.touches?.[0];
      if (touch) {
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const handleGlobalTouchEnd = (e) => {
      if (!isActiveRef.current) return;
      e.preventDefault();
      handleEnd();
    };

    const handleGlobalMouseMove = (e) => {
      if (!isActiveRef.current) return;
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };

    const handleGlobalMouseUp = (e) => {
      if (!isActiveRef.current) return;
      e.preventDefault();
      handleEnd();
    };

    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleGlobalTouchEnd, { passive: false });
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchEnd);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleMove, handleEnd]);

  if (!isMobile) return null;

  return (
    <>
      {/* ジョイスティック（左下） */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '60px',
        zIndex: 1000
      }}>
        <div
          ref={joystickRef}
          style={{
            width: '120px',
            height: '120px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: '3px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
            position: 'relative',
            cursor: 'pointer',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            const touch = e.touches[0];
            if (touch) {
              handleStart(touch.clientX, touch.clientY);
            }
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleStart(e.clientX, e.clientY);
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) translate(${joystickData.x * 35}px, ${-joystickData.y * 35}px)`,
              transition: joystickData.active ? 'none' : 'transform 0.2s ease',
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>
      
      {/* ジャンプボタン（右下） */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '60px',
        zIndex: 1000
      }}>
        <button
          onTouchStart={(e) => {
            e.stopPropagation();
            onJump(true);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            onJump(false);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onJump(true);
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            onJump(false);
          }}
          style={{
            width: '70px',
            height: '70px',
            backgroundColor: 'rgba(255, 100, 100, 0.8)',
            border: '3px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            touchAction: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            outline: 'none'
          }}
        >
          JUMP
        </button>
      </div>
    </>
  );
};

// モバイル入力管理フック
export const useMobileInput = (isMobile) => {
  const [inputState, setInputState] = useState({
    forward: false,
    backward: false,
    leftward: false,
    rightward: false,
    jump: false,
    run: false
  });

  const handleMove = useCallback((x, y) => {
    const threshold = 0.2;
    
    const newState = {
      forward: y > threshold,
      backward: y < -threshold,
      leftward: x < -threshold,
      rightward: x > threshold,
      run: Math.abs(x) > 0.7 || Math.abs(y) > 0.7,
      jump: inputState.jump
    };
    
    if (JSON.stringify(newState) !== JSON.stringify(inputState)) {
      setInputState(newState);
    }
  }, [inputState]);

  const handleJump = useCallback((jumping) => {
    setInputState(prev => ({ ...prev, jump: jumping }));
  }, []);

  return {
    inputState: isMobile ? inputState : null,
    handleMove,
    handleJump
  };
};