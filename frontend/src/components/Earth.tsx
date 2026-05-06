import { useLoader } from '@react-three/fiber';
import { TextureLoader, Vector3 } from 'three';

const EARTH_RADIUS = 6_371_000;

interface Props { position: Vector3 }

export function Earth({ position }: Props) {
  const texture = useLoader(TextureLoader, '/earth.jpg');
  return (
    <mesh position={[position.x, position.y, position.z]}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshPhongMaterial map={texture} transparent opacity={0.88} />
    </mesh>
  );
}
