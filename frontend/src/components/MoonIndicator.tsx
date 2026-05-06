import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group, MeshBasicMaterial } from 'three';
import { MOON_POSITION } from '../lib/bodies';

// Indicator fades OUT when close to Moon (sphere is visible) and
// fades IN when far away (where the Moon would otherwise be invisible).
const FADE_NEAR = 5_000_000;   // 5 Mm: within this, Moon sphere is clearly visible
const FADE_FAR  = 50_000_000;  // 50 Mm: beyond this, indicator fully visible
const ANGULAR_SIZE = 0.008;

const MOON_VEC = new Vector3(MOON_POSITION[0], MOON_POSITION[1], MOON_POSITION[2]);

export function MoonIndicator() {
  const groupRef = useRef<Group>(null);
  const matRef = useRef<MeshBasicMaterial>(null);

  useFrame(({ camera, clock }) => {
    if (!groupRef.current || !matRef.current) return;

    const dist = camera.position.distanceTo(MOON_VEC);

    const t = (dist - FADE_NEAR) / (FADE_FAR - FADE_NEAR);
    matRef.current.opacity = Math.max(0, Math.min(1, t));

    const radius = ANGULAR_SIZE * dist;
    const pulse = 1 + 0.1 * Math.sin(clock.elapsedTime * 1.5);
    groupRef.current.scale.setScalar(radius * pulse);
  });

  return (
    <group ref={groupRef} position={MOON_POSITION} renderOrder={10}>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          ref={matRef}
          color="#a8a8c0"
          transparent
          opacity={0}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
