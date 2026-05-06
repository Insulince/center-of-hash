import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group, MeshStandardMaterial } from 'three';

const FADE_START = 150_000_000; // 150 Mm — camera distance where indicator begins to appear
const FADE_END = 3_000_000_000; // 3 Gm — fully visible beyond this distance
const ANGULAR_SIZE = 0.008;

interface Props { position: Vector3 }

export function EarthIndicator({ position }: Props) {
  const groupRef = useRef<Group>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const posRef = useRef(position);
  posRef.current = position;

  useFrame(({ camera, clock }) => {
    if (!groupRef.current || !matRef.current) return;

    const dist = camera.position.distanceTo(posRef.current);
    const t = (dist - FADE_START) / (FADE_END - FADE_START);
    matRef.current.emissiveIntensity = Math.max(0, Math.min(1, t));

    const radius = ANGULAR_SIZE * dist;
    const pulse = 1 + 0.1 * Math.sin(clock.elapsedTime * 1.5);
    groupRef.current.scale.setScalar(radius * pulse);
  });

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]} renderOrder={10}>
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
