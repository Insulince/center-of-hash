import { MOON_POSITION, MOON_RADIUS } from '../lib/bodies';
import { TexturedPlanet } from './TexturedPlanet';

export function MoonBody() {
  return (
    <TexturedPlanet
      texturePath="/moon.jpg"
      radius={MOON_RADIUS}
      position={MOON_POSITION}
      roughness={0.95}
      fallbackColor="#a0a0a0"
    />
  );
}
