import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { Earth } from './Earth';
import { CentroidPoint } from './CentroidPoint';
import { EarthIndicator } from './EarthIndicator';
import { MarsIndicator } from './MarsIndicator';
import { MoonIndicator } from './MoonIndicator';
import { LightLagSphere } from './LightLagSphere';
import { MoonBody } from './MoonBody';
import { MarsBody } from './MarsBody';
import { SunBody } from './SunBody';
import { EARTH_RADIUS, SUN_RADIUS } from '../lib/bodies';
import { computeScale, type ScaleInfo } from './ScaleBar';
import type { PlanetaryPositions } from '../lib/ephemeris';
import type { Centroid } from '../types';
import type { AnchorTarget } from './SceneOverlay';

export type JumpTarget = 'earth' | 'moon' | 'mars' | 'sun' | 'centroid' | 'solar-system';

function buildJumpPresets(positions: PlanetaryPositions) {
  const { earth, mars, moon } = positions;
  // Sun is at origin; these dirs point away from the Sun toward each body
  const earthDir = earth.clone().normalize();
  const marsDir  = mars.clone().normalize();
  const moonDir  = moon.clone().normalize();

  // Solar-system view: bounding box of Sun (origin) + Earth + Mars in XZ plane
  const bbox = new Box3().setFromPoints([new Vector3(0, 0, 0), earth.clone(), mars.clone()]);
  const center = new Vector3();
  bbox.getCenter(center);
  center.y = 0;

  const centerXZ = new Vector3(center.x, 0, center.z);
  const maxHoriz = Math.max(
    new Vector3(0, 0, 0).distanceTo(centerXZ),         // Sun at origin
    earth.clone().setY(0).distanceTo(centerXZ),
    mars.clone().setY(0).distanceTo(centerXZ),
  );
  const HALF_FOV_RAD = (45 / 2) * (Math.PI / 180);
  const height = (maxHoriz / Math.tan(HALF_FOV_RAD)) * 1.2;

  return {
    earth: {
      // Approach from ecliptic north (Y-up) to get a classic globe view
      position: earth.clone().add(new Vector3(0, 20_000_000, 0)),
      target: earth.clone(),
    },
    moon: {
      position: moon.clone().addScaledVector(moonDir, 8_000_000),
      target: moon.clone(),
    },
    mars: {
      // Approach from Earth side: offset 30 Mm toward Earth from Mars
      position: mars.clone().addScaledVector(marsDir, -30_000_000),
      target: mars.clone(),
    },
    sun: {
      // 5 solar radii beyond Sun on the far side from Earth
      position: earthDir.clone().negate().multiplyScalar(5 * SUN_RADIUS),
      target: new Vector3(0, 0, 0),
    },
    'solar-system': {
      position: new Vector3(center.x, height, center.z),
      target: center.clone(),
    },
  };
}

// Speed base: 20% of distance-to-target per second feels right across all zoom levels.
const WASD_SPEED_FACTOR = 0.2;
const WASD_SHIFT_MULTIPLIER = 10;
const WASD_CTRL_MULTIPLIER = 0.1;

interface CameraRigProps {
  autoOrbit: boolean;
  jumpTarget: JumpTarget | null;
  centroid: Centroid | null;
  onJumpComplete: () => void;
  onScaleChange: (info: ScaleInfo) => void;
  positions: PlanetaryPositions;
  anchorBody: AnchorTarget | null;
}

function CameraRig({ autoOrbit, jumpTarget, centroid, onJumpComplete, onScaleChange, positions, anchorBody }: CameraRigProps) {
  const controlsRef = useRef<any>(null);
  const { camera, size } = useThree();
  const isJumping = useRef(false);
  const destPos = useRef(new Vector3());
  const destTarget = useRef(new Vector3());
  const onDoneRef = useRef(onJumpComplete);
  onDoneRef.current = onJumpComplete;
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const centroidRef = useRef(centroid);
  centroidRef.current = centroid;

  // Anchor tracking: remember where the anchored body was last frame so we can
  // apply the delta to the camera and orbit target.
  const prevAnchorPos = useRef<Vector3 | null>(null);
  const anchorBodyRef = useRef(anchorBody);
  anchorBodyRef.current = anchorBody;

  // Track currently held keys without triggering re-renders.
  const keys = useRef<Set<string>>(new Set());

  // Set the initial orbit target to Earth's heliocentric position.
  const didInit = useRef(false);
  useFrame(() => {
    if (!didInit.current && controlsRef.current) {
      controlsRef.current.target.copy(positionsRef.current.earth);
      controlsRef.current.update();
      didInit.current = true;
    }
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
      // Centroid is already in heliocentric Three.js world space.
      const centroidWorld = new Vector3(centroid.x, centroid.y, centroid.z);
      const distFromEarth = centroidWorld.distanceTo(positionsRef.current.earth);
      let camDist: number;
      if (distFromEarth < EARTH_RADIUS) {
        // Inside Earth: park camera just outside the surface looking in
        camDist = EARTH_RADIUS * 2.5;
      } else {
        // Centroid is in space: hover 15% further out
        camDist = distFromEarth * 1.15;
      }
      const towardCentroid = centroidWorld.clone().sub(positionsRef.current.earth).normalize();
      destPos.current.copy(positionsRef.current.earth.clone().add(towardCentroid.multiplyScalar(camDist)));
      destTarget.current.copy(centroidWorld);
    } else {
      const presets = buildJumpPresets(positionsRef.current);
      const preset = presets[jumpTarget];
      destPos.current.copy(preset.position);
      destTarget.current.copy(preset.target);
    }

    isJumping.current = true;
  }, [jumpTarget, centroid, positions]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    controlsRef.current.autoRotate = autoOrbit && !isJumping.current;

    // Anchor mode: each frame, shift camera + orbit target by the body's movement delta.
    const anchor = anchorBodyRef.current;
    if (anchor) {
      const pos = positionsRef.current;
      const c = centroidRef.current;
      const currentAnchorPos =
        anchor === 'earth'    ? pos.earth.clone()                               :
        anchor === 'moon'     ? pos.moon.clone()                                :
        anchor === 'mars'     ? pos.mars.clone()                                :
        anchor === 'sun'      ? pos.sun.clone()                                 :
        anchor === 'centroid' && c ? new Vector3(c.x, c.y, c.z)                :
                                null;

      if (currentAnchorPos) {
        if (prevAnchorPos.current) {
          const anchorDelta = currentAnchorPos.clone().sub(prevAnchorPos.current);
          camera.position.add(anchorDelta);
          controlsRef.current.target.add(anchorDelta);
          if (isJumping.current) {
            destPos.current.add(anchorDelta);
            destTarget.current.add(anchorDelta);
          }
          controlsRef.current.update();
        }
        prevAnchorPos.current = currentAnchorPos;
      }
    } else {
      prevAnchorPos.current = null;
    }

    // Scale bar
    if (camera instanceof PerspectiveCamera) {
      const distToTarget = camera.position.distanceTo(controlsRef.current.target);
      const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);
      const metersPerPixel = (2 * distToTarget * tanHalfFov) / size.height;
      const info = computeScale(metersPerPixel);
      if (info) onScaleChange(info);
    }

    // WASD / arrow key free movement
    const k = keys.current;
    const movingForward  = k.has('w') || k.has('arrowup');
    const movingBack     = k.has('s') || k.has('arrowdown');
    const movingLeft     = k.has('a') || k.has('arrowleft');
    const movingRight    = k.has('d') || k.has('arrowright');
    const movingUp       = k.has('q');
    const movingDown     = k.has('e');

    if (movingForward || movingBack || movingLeft || movingRight || movingUp || movingDown) {
      if (isJumping.current) {
        isJumping.current = false;
        onDoneRef.current();
      }

      const forward = new Vector3();
      camera.getWorldDirection(forward);
      const right = new Vector3();
      right.crossVectors(forward, camera.up).normalize();
      const up = new Vector3(0, 1, 0);

      const moveDir = new Vector3();
      if (movingForward) moveDir.add(forward);
      if (movingBack)    moveDir.sub(forward);
      if (movingLeft)    moveDir.sub(right);
      if (movingRight)   moveDir.add(right);
      if (movingUp)      moveDir.add(up);
      if (movingDown)    moveDir.sub(up);
      moveDir.normalize();

      const dist = camera.position.distanceTo(controlsRef.current.target);
      let speed = dist * WASD_SPEED_FACTOR;
      if (k.has('shift'))   speed *= WASD_SHIFT_MULTIPLIER;
      if (k.has('control')) speed *= WASD_CTRL_MULTIPLIER;

      const displacement = moveDir.multiplyScalar(speed * delta);
      camera.position.add(displacement);
      controlsRef.current.target.add(displacement);
      controlsRef.current.update();
    }

    if (!isJumping.current) return;

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
  positions: PlanetaryPositions;
  anchorBody: AnchorTarget | null;
}

export function Scene({ centroid, autoOrbit, jumpTarget, onJumpComplete, onScaleChange, positions, anchorBody }: Props) {
  // Capture Earth's position at mount time for the initial camera placement.
  // Canvas only reads the camera prop once; subsequent position changes move the
  // bodies, not the camera.
  const initialCamPos = useRef(
    new Vector3(positions.earth.x, positions.earth.y + 20_000_000, positions.earth.z)
  );

  return (
    <Canvas
      camera={{
        position: [initialCamPos.current.x, initialCamPos.current.y, initialCamPos.current.z],
        fov: 45,
        near: 1_000,
        far: 5_000_000_000_000,
      }}
      gl={{ logarithmicDepthBuffer: true }}
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.1} />
      {/* Directional light FROM the Sun (origin) toward Earth.
          Direction = normalize(target - position) = normalize(0 - (-earth)) = earth.normalize()
          Surfaces facing the Sun (toward origin) are lit correctly. */}
      <directionalLight
        position={[-positions.earth.x, -positions.earth.y, -positions.earth.z]}
        intensity={2.5}
        color="#fff8e7"
      />
      <Stars radius={1_500_000_000_000} depth={500_000_000_000} count={5000} factor={4} />
      <SunBody position={positions.sun} />
      <Suspense fallback={null}><Earth position={positions.earth} /></Suspense>
      <MoonBody position={positions.moon} />
      <MarsBody position={positions.mars} />
      {centroid && <LightLagSphere centroid={centroid} />}
      <EarthIndicator position={positions.earth} />
      <MoonIndicator position={positions.moon} />
      <MarsIndicator position={positions.mars} />
      {centroid && <CentroidPoint centroid={centroid} />}
      <CameraRig
        autoOrbit={autoOrbit}
        jumpTarget={jumpTarget}
        centroid={centroid}
        onJumpComplete={onJumpComplete}
        onScaleChange={onScaleChange}
        positions={positions}
        anchorBody={anchorBody}
      />
    </Canvas>
  );
}
