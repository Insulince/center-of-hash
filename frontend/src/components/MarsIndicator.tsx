import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group, MeshBasicMaterial } from 'three';

// Thresholds derived from Mars's angular size at distance:
//   FADE_NEAR ≈ dist where Mars spans ~9 px (clearly a body, not a dot)
//   FADE_FAR  ≈ dist where Mars spans ~2 px (just a point, indicator needed)
const FADE_NEAR = 1_000_000_000; // 1 Gm
const FADE_FAR  = 4_000_000_000; // 4 Gm

const ANGULAR_SIZE = 0.008;

interface Props { position: Vector3 }

export function MarsIndicator({ position }: Props) {
  const groupRef = useRef<Group>(null);
  const matRef = useRef<MeshBasicMaterial>(null);
  const posRef = useRef(position);
  posRef.current = position;

  useFrame(({ camera, clock }) => {
    if (!groupRef.current || !matRef.current) return;

    const dist = camera.position.distanceTo(posRef.current);
    const t = (dist - FADE_NEAR) / (FADE_FAR - FADE_NEAR);
    const intensity = Math.max(0, Math.min(1, t));
    matRef.current.opacity = intensity;
    groupRef.current.visible = intensity > 0;

    const radius = ANGULAR_SIZE * dist;
    const pulse = 1 + 0.1 * Math.sin(clock.elapsedTime * 1.5);
    groupRef.current.scale.setScalar(radius * pulse);
  });

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          ref={matRef}
          color="#ef4444"
          toneMapped={false}
          transparent
          opacity={0}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
