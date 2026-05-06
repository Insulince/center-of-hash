import { AdditiveBlending, Vector3 } from 'three';
import { SUN_RADIUS } from '../lib/bodies';

// Each corona shell additively contributes glow — they compound rather than clamp.
const CORONA_SHELLS = [
  { scale: 1.08, color: '#fff4cc', intensity: 0.9, opacity: 0.55 },
  { scale: 1.25, color: '#ffdd88', intensity: 0.7, opacity: 0.30 },
  { scale: 1.7,  color: '#ffbb44', intensity: 0.5, opacity: 0.14 },
  { scale: 2.6,  color: '#ff8800', intensity: 0.3, opacity: 0.07 },
  { scale: 4.5,  color: '#ff4400', intensity: 0.2, opacity: 0.03 },
  { scale: 8.0,  color: '#ff2200', intensity: 0.1, opacity: 0.012 },
];

interface Props { position: Vector3 }

export function SunBody({ position }: Props) {
  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Corona shells — additive blending so each layer stacks the glow */}
      {CORONA_SHELLS.map(({ scale, color, intensity, opacity }) => (
        <mesh key={scale}>
          <sphereGeometry args={[SUN_RADIUS * scale, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={intensity}
            transparent
            opacity={opacity}
            blending={AdditiveBlending}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* Solar disc — fully opaque, very high emissive to blow out the centre */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <meshStandardMaterial
          color="#fffde0"
          emissive="#fff8c0"
          emissiveIntensity={12}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
