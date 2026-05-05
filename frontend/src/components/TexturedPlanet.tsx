import { Component, Suspense, type ReactNode } from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';

interface PlanetProps {
  texturePath: string;
  radius: number;
  position: [number, number, number];
  roughness: number;
  fallbackColor: string;
}

// Fallback solid-color sphere used while texture loads or if file is missing
function SolidSphere({ radius, position, roughness, color }: { radius: number; position: [number, number, number]; roughness: number; color: string }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={0} transparent opacity={0.7} />
    </mesh>
  );
}

function LoadedSphere({ texturePath, radius, position, roughness }: Omit<PlanetProps, 'fallbackColor'>) {
  const texture = useLoader(TextureLoader, texturePath);
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial map={texture} roughness={roughness} metalness={0} transparent opacity={0.7} />
    </mesh>
  );
}

// Class component required for React error boundaries
class TexErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { error: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: false };
  }
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}

export function TexturedPlanet({ texturePath, radius, position, roughness, fallbackColor }: PlanetProps) {
  const solid = <SolidSphere radius={radius} position={position} roughness={roughness} color={fallbackColor} />;
  return (
    <TexErrorBoundary fallback={solid}>
      <Suspense fallback={solid}>
        <LoadedSphere texturePath={texturePath} radius={radius} position={position} roughness={roughness} />
      </Suspense>
    </TexErrorBoundary>
  );
}
