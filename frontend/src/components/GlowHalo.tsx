import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, ShaderMaterial } from 'three';

const GLOW_COLOR = '#F7931A';
const BASE_OPACITY = 0.7;
const PULSE_AMP = 0.2;
const LERP_K = 3;

const vertShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalMatrix * normal;
    vViewDir = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragShader = `
  uniform vec3 color;
  uniform float opacity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float rim = 1.0 - max(0.0, dot(normalize(vNormal), normalize(vViewDir)));
    float intensity = pow(rim, 2.5) * opacity;
    gl_FragColor = vec4(color, intensity);
  }
`;

export function GlowHalo({ radius, containsCentroid }: { radius: number; containsCentroid: boolean }) {
  const matRef = useRef<ShaderMaterial>(null);
  const intensityRef = useRef(containsCentroid ? 1 : 0);
  const containsRef = useRef(containsCentroid);
  containsRef.current = containsCentroid;

  const uniforms = useMemo(() => ({
    color:   { value: new Color(GLOW_COLOR) },
    opacity: { value: 0 },
  }), []);

  useFrame(({ clock }, delta) => {
    const mat = matRef.current;
    if (!mat) return;

    const target = containsRef.current ? 1 : 0;
    intensityRef.current += (target - intensityRef.current) * (1 - Math.exp(-LERP_K * delta));
    const pulse = BASE_OPACITY + PULSE_AMP * Math.sin(clock.elapsedTime * 1.7);
    mat.uniforms.opacity.value = Math.max(0, intensityRef.current * pulse);
  });

  return (
    <mesh renderOrder={3} frustumCulled={false}>
      <sphereGeometry args={[radius * 1.18, 24, 24]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertShader}
        fragmentShader={fragShader}
        uniforms={uniforms}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
