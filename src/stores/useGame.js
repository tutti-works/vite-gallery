import { create } from 'zustand';

export const useGame = create((set, get) => ({
  curAnimation: "Idle",
  animationSet: {},
  
  // アニメーションセットを初期化
  initializeAnimationSet: (animSet) => {
    set({ animationSet: animSet });
  },
  
  // アニメーションを変更
  setAnimation: (animationName) => {
    const { animationSet } = get();
    if (animationSet[animationName]) {
      set({ curAnimation: animationSet[animationName] });
    }
  },
  
  // Ecctrlとの連携用
  updateAnimationFromInput: (inputState) => {
    const { forward, backward, leftward, rightward, run, jump } = inputState;
    
    if (jump) {
      set({ curAnimation: "Jump" });
    } else if (forward || backward || leftward || rightward) {
      set({ curAnimation: run ? "Run" : "Walk" });
    } else {
      set({ curAnimation: "Idle" });
    }
  }
}));