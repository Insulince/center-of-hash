import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group, MeshStandardMaterial } from 'three';
import { MARS_POSITION } from '../lib/bodies';

// Indicator fades OUT when close to Mars (sphere is visible) and IN when far away.
const FADE_NEAR = 20_000_000;  // 20 Mm: within this, Mars sphere is clearly visible
const FADE_FAR = 200_000_000;  // 200 Mm: beyond this, indicator fully visible
const ANGULAR_SIZE = 0.008;

const MARS_VEC = new Vector3(MARS_POSITION[0], MARS_POSITION[1], MARS_POSITION[2]);

export function MarsIndicator() {
  const groupRef = useRef<Group>(null);
  const matRef = useRef<MeshStandardMaterial>(null);

  useFrame(({ camera, clock }) => {
    if (!groupRef.current || !matRef.current) return;

    const dist = camera.position.distanceTo(MARS_VEC);
    const t = (dist - FADE_NEAR) / (FADE_FAR - FADE_NEAR);
    matRef.current.emissiveIntensity = Math.max(0, Math.min(1, t));

    const radius = ANGULAR_SIZE * dist;
    const pulse = 1 + 0.1 * Math.sin(clock.elapsedTime * 1.5);
    groupRef.current.scale.setScalar(radius * pulse);
  });

  return (
    <group ref={groupRef} position={MARS_POSITION} renderOrder={10}>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          ref={matRef}
          color="#000000"
          emissive="#ef4444"
          emissiveIntensity={0}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
