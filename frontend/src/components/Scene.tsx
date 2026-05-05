import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Vector3 } from 'three';
import { Earth } from './Earth';
import { CentroidPoint } from './CentroidPoint';
import { EarthIndicator } from './EarthIndicator';
import { MarsIndicator } from './MarsIndicator';
import { LightLagSphere } from './LightLagSphere';
import { MoonBody } from './MoonBody';
import { MarsBody } from './MarsBody';
import { EARTH_RADIUS, MOON_DISTANCE, MARS_DISTANCE } from '../lib/bodies';
import type { Centroid } from '../types';

export type JumpTarget = 'earth' | 'moon' | 'mars' | 'centroid';

// Pre-built destinations for static bodies
const JUMP_PRESETS = {
  earth: {
    position: new Vector3(0, 0, 20_000_000),
    target: new Vector3(0, 0, 0),
  },
  moon: {
    // Camera 8 Mm past Moon along the +X axis, orbiting Moon center
    position: new Vector3(MOON_DISTANCE + 8_000_000, 0, 0),
    target: new Vector3(MOON_DISTANCE, 0, 0),
  },
  mars: {
    // Camera 30 Mm in front of Mars (toward Earth), orbiting Mars center
    position: new Vector3(0, 0, -MARS_DISTANCE + 30_000_000),
    target: new Vector3(0, 0, -MARS_DISTANCE),
  },
};

interface CameraRigProps {
  autoOrbit: boolean;
  jumpTarget: JumpTarget | null;
  centroid: Centroid | null;
  onJumpComplete: () => void;
}

function CameraRig({ autoOrbit, jumpTarget, centroid, onJumpComplete }: CameraRigProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const isJumping = useRef(false);
  const destPos = useRef(new Vector3());
  const destTarget = useRef(new Vector3());
  // Keep callback fresh without putting it in deps
  const onDoneRef = useRef(onJumpComplete);
  onDoneRef.current = onJumpComplete;

  useEffect(() => {
    if (!jumpTarget) return;

    if (jumpTarget === 'centroid') {
      if (!centroid) return;
      // ECEF → Three.js axis mapping: three.x=ecef.x, three.y=ecef.z, three.z=-ecef.y
      const cx = centroid.x;
      const cy = centroid.z;
      const cz = -centroid.y;
      const centroidVec = new Vector3(cx, cy, cz);
      const centLen = centroidVec.length();
      let camDist: number;
      if (centLen < EARTH_RADIUS) {
        // Inside Earth: park camera just outside the surface looking in
        camDist = EARTH_RADIUS * 2.5;
      } else {
        // Centroid is in space: hover 15% further out along the same ray so the
        // centroid fills the view and Earth is visible as a distant dot behind it.
        camDist = centLen * 1.15;
      }
      destPos.current.copy(centroidVec.clone().normalize().multiplyScalar(camDist));
      destTarget.current.copy(centroidVec);
    } else {
      const preset = JUMP_PRESETS[jumpTarget];
      destPos.current.copy(preset.position);
      destTarget.current.copy(preset.target);
    }

    isJumping.current = true;
  }, [jumpTarget, centroid]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    // Drive autoRotate directly on the controls instance to avoid React re-renders
    controlsRef.current.autoRotate = autoOrbit && !isJumping.current;

    if (!isJumping.current) return;

    // Frame-rate-independent exponential ease — covers ~99% in ~1.5 s at 60 fps
    const lerpFactor = 1 - Math.exp(-12 * delta);
    camera.position.lerp(destPos.current, lerpFactor);
    controlsRef.current.target.lerp(destTarget.current, lerpFactor);
    controlsRef.current.update();

    if (camera.position.distanceTo(destPos.current) < 1_000) {
      camera.position.copy(destPos.current);
      controlsRef.current.target.copy(destTarget.current);
      controlsRef.current.update();
      isJumping.current = false;
      onDoneRef.current();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotateSpeed={0.5}
      enableDamping
      dampingFactor={0.05}
      minDistance={7_000_000}
      maxDistance={280_000_000_000}
      onStart={() => {
        if (isJumping.current) {
          isJumping.current = false;
          onDoneRef.current();
        }
      }}
    />
  );
}

interface Props {
  centroid: Centroid | null;
  autoOrbit: boolean;
  jumpTarget: JumpTarget | null;
  onJumpComplete: () => void;
}

export function Scene({ centroid, autoOrbit, jumpTarget, onJumpComplete }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 20_000_000], fov: 45, near: 1_000, far: 500_000_000_000 }}
      gl={{ logarithmicDepthBuffer: true }}
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[15_000_000, 10_000_000, 5_000_000]} intensity={2.0} />
      {/* Stars span well beyond Mars so they surround the viewer at any jump destination */}
      <Stars radius={300_000_000_000} depth={50_000_000_000} count={5000} factor={4} />
      <Suspense fallback={null}><Earth /></Suspense>
      <MoonBody />
      <MarsBody />
      {centroid && <LightLagSphere centroid={centroid} />}
      <EarthIndicator />
      <MarsIndicator />
      {centroid && <CentroidPoint centroid={centroid} />}
      <CameraRig
        autoOrbit={autoOrbit}
        jumpTarget={jumpTarget}
        centroid={centroid}
        onJumpComplete={onJumpComplete}
      />
    </Canvas>
  );
}
