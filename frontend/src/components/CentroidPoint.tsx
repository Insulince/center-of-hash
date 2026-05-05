import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group } from 'three';
import type { Centroid } from '../types';

interface Props {
  centroid: Centroid;
  color?: string;
}

const ANGULAR_SIZE = 0.01; // constant apparent angular radius (~0.57°) at any camera distance
const MIN_RADIUS = 150_000; // 150 km floor when camera is very close

export function CentroidPoint({ centroid, color = '#f97316' }: Props) {
  const groupRef = useRef<Group>(null);
  // Ref avoids stale closure — always reads latest centroid in useFrame
  const centroidRef = useRef(centroid);
  centroidRef.current = centroid;
  const worldPos = useRef(new Vector3());

  useFrame(({ camera, clock }) => {
    if (!groupRef.current) return;
    const c = centroidRef.current;
    // Compute world position from prop data to avoid matrixWorld staleness
    worldPos.current.set(c.x, c.z, -c.y);
    const dist = camera.position.distanceTo(worldPos.current);
    const radius = Math.max(MIN_RADIUS, ANGULAR_SIZE * dist);
    const pulse = 1 + 0.15 * Math.sin(clock.elapsedTime * 2);
    groupRef.current.scale.setScalar(radius * pulse);
  });

  return (
    // renderOrder=20 ensures centroid renders after all indicators (Earth=10, Mars=10)
    <group ref={groupRef} position={[centroid.x, centroid.z, -centroid.y]} renderOrder={20}>
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
