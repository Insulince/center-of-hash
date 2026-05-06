import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group, MeshStandardMaterial } from 'three';

// Indicator fades OUT when close to Moon (sphere is visible) and IN when far away.
const FADE_NEAR = 5_000_000;   // 5 Mm: within this, Moon sphere is clearly visible
const FADE_FAR  = 50_000_000;  // 50 Mm: beyond this, indicator fully visible
const ANGULAR_SIZE = 0.008;

interface Props { position: Vector3 }

export function MoonIndicator({ position }: Props) {
  const groupRef = useRef<Group>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const posRef = useRef(position);
  posRef.current = position;

  useFrame(({ camera, clock }) => {
    if (!groupRef.current || !matRef.current) return;

    const dist = camera.position.distanceTo(posRef.current);
    const t = (dist - FADE_NEAR) / (FADE_FAR - FADE_NEAR);
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
          emissive="#a8a8c0"
          emissiveIntensity={0}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
