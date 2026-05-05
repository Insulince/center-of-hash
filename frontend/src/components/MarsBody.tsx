import { MARS_POSITION, MARS_RADIUS } from '../lib/bodies';
import { TexturedPlanet } from './TexturedPlanet';

export function MarsBody() {
  return (
    <TexturedPlanet
      texturePath="/mars.jpg"
      radius={MARS_RADIUS}
      position={MARS_POSITION}
      roughness={0.9}
      fallbackColor="#c1440e"
    />
  );
}
