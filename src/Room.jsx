import { useGLTF } from "@react-three/drei";

export function Room(props) {
  // あなたの部屋モデルのパスに合わせてください
  const { scene } = useGLTF("/models/room/room.gltf");
  return <primitive object={scene} {...props} dispose={null} />;
}

useGLTF.preload("/models/room/room.gltf");