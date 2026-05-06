import { Vector3 } from 'three';
import { MARS_RADIUS } from '../lib/bodies';
import { TexturedPlanet } from './TexturedPlanet';

interface Props { position: Vector3 }

export function MarsBody({ position }: Props) {
  return (
    <TexturedPlanet
      texturePath="/mars.jpg"
      radius={MARS_RADIUS}
      position={[position.x, position.y, position.z]}
      roughness={0.9}
      fallbackColor="#c1440e"
    />
  );
}
