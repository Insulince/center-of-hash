import { SUN_POSITION, SUN_RADIUS } from '../lib/bodies';

export function SunBody() {
  return (
    <group position={SUN_POSITION}>
      {/* Outer corona — very faint wide glow */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS * 2.8, 32, 32]} />
        <meshStandardMaterial
          color="#ff7700"
          emissive="#ff5500"
          emissiveIntensity={0.6}
          transparent
          opacity={0.06}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      {/* Inner corona */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS * 1.5, 32, 32]} />
        <meshStandardMaterial
          color="#ffcc00"
          emissive="#ffbb00"
          emissiveIntensity={1.2}
          transparent
          opacity={0.18}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      {/* Solar disc */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#ffee88"
          emissive="#ffffaa"
          emissiveIntensity={4}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
