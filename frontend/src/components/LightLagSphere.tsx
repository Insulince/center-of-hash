import { DoubleSide } from 'three';
import type { Centroid } from '../types';

const LIGHT_SPEED = 299_792_458; // m/s
const BLOCK_TIME = 600;          // 10-minute BTC block time in seconds
export const LIGHT_LAG_RADIUS = LIGHT_SPEED * BLOCK_TIME; // ≈ 179.875 Gm

// Two-mode Fresnel shader that works from both inside and outside.
//
// gl_FrontFacing is true on outer faces (camera outside sphere) and false on
// inner faces (camera inside sphere) because WebGL derives it from triangle
// winding order as seen from the camera — it flips automatically when you
// cross the sphere boundary.
//
// Outside: transparent at center (cosAngle≈1 → fresnel≈0), opaque rim.
// Inside:  cosAngle≈1 everywhere (outward normals anti-parallel to viewDir),
//          so we invert to get a gentle constant inner glow.
const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3  viewDir  = normalize(vViewPosition);
    float cosAngle = abs(dot(viewDir, vNormal));
    float alpha;
    if (gl_FrontFacing) {
      // Outer surface: Fresnel rim — transparent center, glowing edge
      float fresnel = 1.0 - cosAngle;
      alpha = pow(fresnel, 3.0) * 0.40;
    } else {
      // Inner surface: inverted — subtle constant glow, slightly brighter
      // where the surface is most "directly" in front of the camera
      alpha = cosAngle * cosAngle * 0.14;
    }
    gl_FragColor = vec4(0.0, 0.88, 1.0, alpha);
  }
`;

interface Props {
  centroid: Centroid;
}

export function LightLagSphere({ centroid }: Props) {
  // ECEF → Three.js axis mapping: three.x=ecef.x, three.y=ecef.z, three.z=-ecef.y
  return (
    <mesh
      position={[centroid.x, centroid.z, -centroid.y]}
      renderOrder={1}
    >
      <sphereGeometry args={[LIGHT_LAG_RADIUS, 64, 32]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={DoubleSide}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
