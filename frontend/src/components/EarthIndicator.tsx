import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, MeshBasicMaterial } from 'three';

// Camera distance at which the indicator starts fading in (well past the Moon).
const FADE_START = 150_000_000; // 150 Mm
// Camera distance at which it reaches full opacity.
const FADE_END = 3_000_000_000; // 3 Gm
// Slightly smaller apparent size than the orange centroid dot.
const ANGULAR_SIZE = 0.008;

export function EarthIndicator() {
  const groupRef = useRef<Group>(null);
  const matRef = useRef<MeshBasicMaterial>(null);

  useFrame(({ camera, clock }) => {
    if (!groupRef.current || !matRef.current) return;

    const dist = camera.position.length(); // distance from Earth at origin

    // Linear fade between FADE_START and FADE_END
    const t = (dist - FADE_START) / (FADE_END - FADE_START);
    matRef.current.opacity = Math.max(0, Math.min(1, t));

    // Scale-invariant: same apparent angular size regardless of camera distance
    const radius = ANGULAR_SIZE * dist;
    const pulse = 1 + 0.1 * Math.sin(clock.elapsedTime * 1.5);
    groupRef.current.scale.setScalar(radius * pulse);
  });

  return (
    // renderOrder + depthTest:false keeps the indicator visible in front of all scene geometry.
    // opacity starts at 0, so it's invisible near Earth even though it renders on top.
    <group ref={groupRef} renderOrder={10}>
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          ref={matRef}
          color="#3b82f6"
          transparent
          opacity={0}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
