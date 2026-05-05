import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';

const EARTH_RADIUS = 6_371_000;

export function Earth() {
  const texture = useLoader(TextureLoader, '/earth.jpg');
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshPhongMaterial map={texture} transparent opacity={0.88} />
    </mesh>
  );
}
