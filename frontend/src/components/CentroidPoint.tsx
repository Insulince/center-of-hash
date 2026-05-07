import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group } from 'three';
import type { Centroid } from '../types';

interface Props {
  centroid: Centroid; // heliocentric Three.js world space
  color?: string;
}

const ANGULAR_SIZE = 0.006;
const MIN_RADIUS = 100_000; // 100 km floor when camera is very close

export function CentroidPoint({ centroid, color = '#F7931A' }: Props) {
  const groupRef = useRef<Group>(null);
  const centroidRef = useRef(centroid);
  centroidRef.current = centroid;
  const worldPos = useRef(new Vector3());

  useFrame(({ camera, clock }) => {
    if (!groupRef.current) return;
    const c = centroidRef.current;
    worldPos.current.set(c.x, c.y, c.z);
    const dist = camera.position.distanceTo(worldPos.current);
    const radius = Math.max(MIN_RADIUS, ANGULAR_SIZE * dist);
    const pulse = 1 + 0.15 * Math.sin(clock.elapsedTime * 2);
    groupRef.current.scale.setScalar(radius * pulse);
  });

  return (
    <group ref={groupRef} position={[centroid.x, centroid.y, centroid.z]}>
      <mesh frustumCulled={false} renderOrder={1}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
          transparent
          depthTest={true}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
