import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { MeshPhongMaterial, TextureLoader, Vector3, type Mesh } from 'three';
import { GlowHalo } from './GlowHalo';

const EARTH_RADIUS = 6_371_000;
const LERP_K = 3;
const TRANSLUCENT_OPACITY = 0.6;

interface Props { position: Vector3; containsCentroid: boolean; }

export function Earth({ position, containsCentroid }: Props) {
  const texture = useLoader(TextureLoader, '/earth.jpg');
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshPhongMaterial>(null);
  const intensityRef = useRef(containsCentroid ? 1 : 0);
  const containsRef = useRef(containsCentroid);
  containsRef.current = containsCentroid;
  const wasTransparent = useRef(false);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    mesh.rotation.y += 0.1 * delta;

    const target = containsRef.current ? 1 : 0;
    intensityRef.current += (target - intensityRef.current) * (1 - Math.exp(-LERP_K * delta));
    const intensity = intensityRef.current;

    mat.opacity = 1 - (1 - TRANSLUCENT_OPACITY) * intensity;

    const isTransparent = intensity > 0.001;
    if (isTransparent !== wasTransparent.current) {
      mat.transparent = isTransparent;
      mat.depthWrite = !isTransparent;
      mat.needsUpdate = true;
      wasTransparent.current = isTransparent;
    }
    mesh.renderOrder = isTransparent ? 2 : 0;
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshPhongMaterial ref={matRef} map={texture} />
      </mesh>
      <GlowHalo radius={EARTH_RADIUS} containsCentroid={containsCentroid} />
    </group>
  );
}
