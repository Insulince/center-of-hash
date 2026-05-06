import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, MeshStandardMaterial } from 'three';

const FADE_START = 150_000_000; // 150 Mm — camera distance where indicator begins to appear
const FADE_END = 3_000_000_000; // 3 Gm — fully visible beyond this distance
const ANGULAR_SIZE = 0.008;

export function EarthIndicator() {
  const groupRef = useRef<Group>(null);
  const matRef = useRef<MeshStandardMaterial>(null);

  useFrame(({ camera, clock }) => {
    if (!groupRef.current || !matRef.current) return;

    const dist = camera.position.length(); // distance from Earth at origin
    const t = (dist - FADE_START) / (FADE_END - FADE_START);
    matRef.current.emissiveIntensity = Math.max(0, Math.min(1, t));

    const radius = ANGULAR_SIZE * dist;
    const pulse = 1 + 0.1 * Math.sin(clock.elapsedTime * 1.5);
    groupRef.current.scale.setScalar(radius * pulse);
  });

  return (
    <group ref={groupRef} renderOrder={10}>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          ref={matRef}
          color="#000000"
          emissive="#3b82f6"
          emissiveIntensity={0}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
