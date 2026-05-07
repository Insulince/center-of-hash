import { Vector3 } from 'three';
import { MARS_RADIUS } from '../lib/bodies';
import { TexturedPlanet } from './TexturedPlanet';

interface Props { position: Vector3; containsCentroid: boolean; }

export function MarsBody({ position, containsCentroid }: Props) {
  return (
    <TexturedPlanet
      texturePath="/mars.jpg"
      radius={MARS_RADIUS}
      position={[position.x, position.y, position.z]}
      roughness={0.9}
      fallbackColor="#c1440e"
      rotationSpeed={0.08}
      containsCentroid={containsCentroid}
    />
  );
}
