import { useRef, Component, Suspense, type ReactNode } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { MeshStandardMaterial, TextureLoader, type Mesh } from 'three';
import { GlowHalo } from './GlowHalo';

const LERP_K = 3;
const TRANSLUCENT_OPACITY = 0.6;

interface PlanetProps {
  texturePath: string;
  radius: number;
  position: [number, number, number];
  roughness: number;
  fallbackColor: string;
  rotationSpeed?: number;
  containsCentroid?: boolean;
}

function SolidSphere({ radius, position, roughness, color, rotationSpeed = 0, containsCentroid = false }: {
  radius: number; position: [number, number, number]; roughness: number; color: string;
  rotationSpeed?: number; containsCentroid?: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const intensityRef = useRef(containsCentroid ? 1 : 0);
  const containsRef = useRef(containsCentroid);
  containsRef.current = containsCentroid;
  const wasTransparent = useRef(false);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    mesh.rotation.y += rotationSpeed * delta;

    const target = containsRef.current ? 1 : 0;
    intensityRef.current += (target - intensityRef.current) * (1 - Math.exp(-LERP_K * delta));
    const intensity = intensityRef.current;

    mat.opacity = 1 - (1 - TRANSLUCENT_OPACITY) * intensity;

    const isTransparent = intensity > 0.001;
    if (isTransparent !== wasTransparent.current) {
      mat.transparent = isTransparent;
      mat.depthWrite = !isTransparent;
      mat.needsUpdate = true;
      wasTransparent.current = isTransparent;
    }
    mesh.renderOrder = isTransparent ? 2 : 0;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial ref={matRef} color={color} roughness={roughness} metalness={0} />
      </mesh>
      <GlowHalo radius={radius} containsCentroid={containsCentroid} />
    </group>
  );
}

function LoadedSphere({ texturePath, radius, position, roughness, rotationSpeed = 0, containsCentroid = false }: Omit<PlanetProps, 'fallbackColor'>) {
  const texture = useLoader(TextureLoader, texturePath);
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const intensityRef = useRef(containsCentroid ? 1 : 0);
  const containsRef = useRef(containsCentroid);
  containsRef.current = containsCentroid;
  const wasTransparent = useRef(false);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    mesh.rotation.y += rotationSpeed * delta;

    const target = containsRef.current ? 1 : 0;
    intensityRef.current += (target - intensityRef.current) * (1 - Math.exp(-LERP_K * delta));
    const intensity = intensityRef.current;

    mat.opacity = 1 - (1 - TRANSLUCENT_OPACITY) * intensity;

    const isTransparent = intensity > 0.001;
    if (isTransparent !== wasTransparent.current) {
      mat.transparent = isTransparent;
      mat.depthWrite = !isTransparent;
      mat.needsUpdate = true;
      wasTransparent.current = isTransparent;
    }
    mesh.renderOrder = isTransparent ? 2 : 0;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial ref={matRef} map={texture} roughness={roughness} metalness={0} />
      </mesh>
      <GlowHalo radius={radius} containsCentroid={containsCentroid} />
    </group>
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

export function TexturedPlanet({ texturePath, radius, position, roughness, fallbackColor, rotationSpeed, containsCentroid }: PlanetProps) {
  const solid = (
    <SolidSphere
      radius={radius}
      position={position}
      roughness={roughness}
      color={fallbackColor}
      rotationSpeed={rotationSpeed}
      containsCentroid={containsCentroid}
    />
  );
  return (
    <TexErrorBoundary fallback={solid}>
      <Suspense fallback={solid}>
        <LoadedSphere
          texturePath={texturePath}
          radius={radius}
          position={position}
          roughness={roughness}
          rotationSpeed={rotationSpeed}
          containsCentroid={containsCentroid}
        />
      </Suspense>
    </TexErrorBoundary>
  );
}
