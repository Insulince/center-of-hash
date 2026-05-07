import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group, MeshBasicMaterial } from 'three';

// Thresholds derived from Moon's angular size at distance:
//   FADE_NEAR ≈ dist where Moon spans ~10 px (clearly a body — visible from Earth)
//   FADE_FAR  ≈ dist where Moon spans ~2 px (just a point, indicator needed)
const FADE_NEAR = 500_000_000;   // 500 Mm
const FADE_FAR  = 2_000_000_000; // 2 Gm

const ANGULAR_SIZE = 0.008;

interface Props { position: Vector3 }

export function MoonIndicator({ position }: Props) {
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
          color="#a8a8c0"
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
