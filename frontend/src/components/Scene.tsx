import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { PerspectiveCamera, Vector3 } from 'three';
import { Earth } from './Earth';
import { CentroidPoint } from './CentroidPoint';
import { EarthIndicator } from './EarthIndicator';
import { MarsIndicator } from './MarsIndicator';
import { MoonIndicator } from './MoonIndicator';
import { LightLagSphere } from './LightLagSphere';
import { MoonBody } from './MoonBody';
import { MarsBody } from './MarsBody';
import { SunBody } from './SunBody';
import { EARTH_RADIUS, MOON_DISTANCE, MARS_DISTANCE, SUN_DISTANCE, SUN_RADIUS, SUN_POSITION } from '../lib/bodies';
import { computeScale, type ScaleInfo } from './ScaleBar';
import type { Centroid } from '../types';

export type JumpTarget = 'earth' | 'moon' | 'mars' | 'sun' | 'centroid' | 'solar-system';

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
  sun: {
    // Camera 5 solar radii from Sun center — disc fills ~half the FOV
    position: new Vector3(0, 0, SUN_DISTANCE + 5 * SUN_RADIUS),
    target: new Vector3(...SUN_POSITION),
  },
  'solar-system': {
    // Top-down ecliptic view from +Y: Sun (+Z at 149.6 Gm) and Mars (-Z at 225 Gm) both within FOV=45.
    // Center target splits the Sun-Mars Z range; camera height chosen so each body sits at ~19° from axis.
    position: new Vector3(0, 550_000_000_000, 50_000_000_000),
    target: new Vector3(0, 0, (SUN_DISTANCE - MARS_DISTANCE) / 2),
  },
};

interface CameraRigProps {
  autoOrbit: boolean;
  jumpTarget: JumpTarget | null;
  centroid: Centroid | null;
  onJumpComplete: () => void;
  onScaleChange: (info: ScaleInfo) => void;
}

// Speed base: 20% of distance-to-target per second feels right across all zoom levels.
const WASD_SPEED_FACTOR = 0.2;
const WASD_SHIFT_MULTIPLIER = 10;
const WASD_CTRL_MULTIPLIER = 0.1;

function CameraRig({ autoOrbit, jumpTarget, centroid, onJumpComplete, onScaleChange }: CameraRigProps) {
  const controlsRef = useRef<any>(null);
  const { camera, size } = useThree();
  const isJumping = useRef(false);
  const destPos = useRef(new Vector3());
  const destTarget = useRef(new Vector3());
  // Keep callback fresh without putting it in deps
  const onDoneRef = useRef(onJumpComplete);
  onDoneRef.current = onJumpComplete;

  // Track currently held keys without triggering re-renders.
  const keys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't hijack keys when user is typing in an input.
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Prevent page scroll on arrow keys.
      if (e.key.startsWith('Arrow')) e.preventDefault();
      keys.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

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

    // Scale bar ——————————————————————————————————————————————————————————————
    if (camera instanceof PerspectiveCamera) {
      const distToTarget = camera.position.distanceTo(controlsRef.current.target);
      const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360); // tan(fov/2 in rad)
      const metersPerPixel = (2 * distToTarget * tanHalfFov) / size.height;
      const info = computeScale(metersPerPixel);
      if (info) onScaleChange(info);
    }
    // ————————————————————————————————————————————————————————————————————————

    // WASD / arrow key free movement —————————————————————————————————————————
    const k = keys.current;
    const movingForward  = k.has('w') || k.has('arrowup');
    const movingBack     = k.has('s') || k.has('arrowdown');
    const movingLeft     = k.has('a') || k.has('arrowleft');
    const movingRight    = k.has('d') || k.has('arrowright');
    const movingUp       = k.has('q');
    const movingDown     = k.has('e');

    if (movingForward || movingBack || movingLeft || movingRight || movingUp || movingDown) {
      // Cancel any in-progress jump — user is taking manual control.
      if (isJumping.current) {
        isJumping.current = false;
        onDoneRef.current();
      }

      // Build move direction in camera-local space then transform to world space.
      const forward = new Vector3();
      camera.getWorldDirection(forward); // unit vector toward look target

      const right = new Vector3();
      right.crossVectors(forward, camera.up).normalize();

      const up = new Vector3(0, 1, 0); // world Y — "up/down" in scene space

      const moveDir = new Vector3();
      if (movingForward) moveDir.add(forward);
      if (movingBack)    moveDir.sub(forward);
      if (movingLeft)    moveDir.sub(right);
      if (movingRight)   moveDir.add(right);
      if (movingUp)      moveDir.add(up);
      if (movingDown)    moveDir.sub(up);
      moveDir.normalize();

      // Speed is proportional to distance from orbit target so movement feels
      // consistent whether you're hovering over Earth or viewing from Mars.
      const dist = camera.position.distanceTo(controlsRef.current.target);
      let speed = dist * WASD_SPEED_FACTOR;
      if (k.has('shift'))   speed *= WASD_SHIFT_MULTIPLIER;
      if (k.has('control')) speed *= WASD_CTRL_MULTIPLIER;

      const displacement = moveDir.multiplyScalar(speed * delta);
      // Translate both camera AND orbit target so OrbitControls doesn't fight back.
      camera.position.add(displacement);
      controlsRef.current.target.add(displacement);
      controlsRef.current.update();
    }
    // ————————————————————————————————————————————————————————————————————————

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
      maxDistance={2_000_000_000_000}
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
  onScaleChange: (info: ScaleInfo) => void;
}

export function Scene({ centroid, autoOrbit, jumpTarget, onJumpComplete, onScaleChange }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 20_000_000], fov: 45, near: 1_000, far: 5_000_000_000_000 }}
      gl={{ logarithmicDepthBuffer: true }}
    >
      <color attach="background" args={['#000000']} />
      {/* Low ambient so night sides are dark but not pitch black */}
      <ambientLight intensity={0.1} />
      {/* Directional light from the Sun — parallel rays illuminate all planets uniformly */}
      <directionalLight position={SUN_POSITION} intensity={2.5} color="#fff8e7" />
      {/* Stars radius 1.5 Tm keeps them in background even at solar-system view distance */}
      <Stars radius={1_500_000_000_000} depth={500_000_000_000} count={5000} factor={4} />
      <SunBody />
      <Suspense fallback={null}><Earth /></Suspense>
      <MoonBody />
      <MarsBody />
      {centroid && <LightLagSphere centroid={centroid} />}
      <EarthIndicator />
      <MoonIndicator />
      <MarsIndicator />
      {centroid && <CentroidPoint centroid={centroid} />}
      <CameraRig
        autoOrbit={autoOrbit}
        jumpTarget={jumpTarget}
        centroid={centroid}
        onJumpComplete={onJumpComplete}
        onScaleChange={onScaleChange}
      />
    </Canvas>
  );
}
