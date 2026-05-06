import { Vector3 } from 'three';
import { MOON_RADIUS } from '../lib/bodies';
import { TexturedPlanet } from './TexturedPlanet';

interface Props { position: Vector3 }

export function MoonBody({ position }: Props) {
  return (
    <TexturedPlanet
      texturePath="/moon.jpg"
      radius={MOON_RADIUS}
      position={[position.x, position.y, position.z]}
      roughness={0.95}
      fallbackColor="#a0a0a0"
    />
  );
}
