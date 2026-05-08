import { useState, useEffect, useCallback, useRef } from 'react';
import { Scene, type JumpTarget } from './components/Scene';
import { SceneOverlay, type AnchorTarget } from './components/SceneOverlay';
import { BodyStatusPanel, type BodyStatuses } from './components/BodyStatusPanel';
import { TimeSlider } from './components/TimeSlider';
import { HashPanel } from './components/HashPanel';
import { SpaceMiners, type SpaceMinersConfig, DEFAULT_SPACE_MINERS } from './components/HypotheticalMiner';
import { ScaleBar, type ScaleBarHandle, type ScaleInfo } from './components/ScaleBar';
import { SimDateControls } from './components/SimDateControls';
import { useSnapshots } from './hooks/useSnapshots';
import { usePlanetaryPositions } from './hooks/usePlanetaryPositions';
import { LIGHT_LAG_RADIUS } from './components/LightLagSphere';
import { latLonToECEF } from './lib/ecef';
import { weightedCentroid, type Miner } from './lib/centroid';
import { countryLatLon } from './lib/countries';
import { Vector3 } from 'three';
import type { Snapshot } from './types/index';
import './index.css';

// Extracted so the same content renders in both the desktop sidebar and the mobile sheet.
function SidebarContent({
  snap,
  spaceMiners,
  onSpaceMinersChange,
}: {
  snap: Snapshot | null;
  spaceMiners: SpaceMinersConfig;
  onSpaceMinersChange: (cfg: SpaceMinersConfig) => void;
}) {
  return (
    <>
      {snap && <HashPanel shares={snap.shares} />}
      <SpaceMiners value={spaceMiners} onChange={onSpaceMinersChange} />
      <div className="text-xs leading-relaxed border-t border-slate-800 pt-3">
        <p className="text-slate-500 mb-2">
          The <span className="text-slate-300">center of hash</span> is the hashrate-weighted
          centroid of all mining — analogous to a center of mass.
        </p>
        <p className="text-slate-700 mb-1.5">
          Data:{' '}
          <a
            href="https://ccaf.io/cbeci/mining-map"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-slate-500 transition-colors"
          >
            CCAF
          </a>
          , monthly snapshots Sept 2019–Dec 2021.
        </p>
        <div className="text-slate-700 space-y-0.5">
          <p>⚠ ~32–38% sample coverage (cooperating pools only).</p>
          <p>⚠ DE/IE shares may be inflated by VPN geolocation.</p>
          <p>⚠ Country-level only — all US miners map to one point.</p>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const { snapshots, loading, error } = useSnapshots();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [spaceMiners, setSpaceMiners] = useState<SpaceMinersConfig>(DEFAULT_SPACE_MINERS);
  const [autoOrbit, setAutoOrbit] = useState(false);
  const [jumpTarget, setJumpTarget] = useState<JumpTarget | null>(null);
  const [anchorTarget, setAnchorTarget] = useState<AnchorTarget | null>(null);
  const [simDate, setSimDate] = useState<Date>(() => new Date());
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const positions = usePlanetaryPositions(simDate);
  const scaleBarRef = useRef<ScaleBarHandle>(null);
  const handleScaleChange = useCallback((info: ScaleInfo) => scaleBarRef.current?.update(info), []);

  useEffect(() => {
    if (snapshots.length > 0) setSelectedIndex(snapshots.length - 1);
  }, [snapshots.length]);

  const snap = snapshots[selectedIndex] ?? null;

  const effectiveCentroid = (() => {
    if (!snap) return null;

    const { earth, mars, moon, sun } = positions;

    // ECEF → Three.js axis: three.x=ecef.x, three.y=ecef.z, three.z=-ecef.y
    const ecefToWorld = (ex: number, ey: number, ez: number): [number, number, number] =>
      [earth.x + ex, earth.y + ez, earth.z - ey];

    if (spaceMiners.earth === 1) {
      const [wx, wy, wz] = ecefToWorld(snap.centroid.x, snap.centroid.y, snap.centroid.z);
      return { x: wx, y: wy, z: wz };
    }

    const miners: Miner[] = snap.shares.flatMap((s) => {
      const coords = countryLatLon(s.country);
      if (!coords) return [];
      const [ex, ey, ez] = latLonToECEF(coords[0], coords[1]);
      const [wx, wy, wz] = ecefToWorld(ex, ey, ez);
      return [{ x: wx, y: wy, z: wz, weight: s.share * spaceMiners.earth }];
    });

    if (spaceMiners.moon > 0) miners.push({ x: moon.x, y: moon.y, z: moon.z, weight: spaceMiners.moon });
    if (spaceMiners.mars > 0) miners.push({ x: mars.x, y: mars.y, z: mars.z, weight: spaceMiners.mars });
    if (spaceMiners.sun > 0)  miners.push({ x: sun.x,  y: sun.y,  z: sun.z,  weight: spaceMiners.sun  });

    return weightedCentroid(miners);
  })();

  const bodyStatuses: BodyStatuses | null = effectiveCentroid
    ? (() => {
        const cv = new Vector3(effectiveCentroid.x, effectiveCentroid.y, effectiveCentroid.z);
        const status = (v: Vector3) => {
          const d = v.distanceTo(cv);
          return { distanceToCentroid: d, inLightSphere: d < LIGHT_LAG_RADIUS };
        };
        return {
          earth: status(positions.earth),
          moon:  status(positions.moon),
          mars:  status(positions.mars),
          sun:   status(positions.sun),
        };
      })()
    : null;

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col">

      {/* ── Header ── compact on mobile, fuller on desktop */}
      <header className="px-4 md:px-6 py-2 md:py-3 flex items-center justify-between border-b border-slate-800 flex-none">
        <div>
          <h1 className="text-base md:text-lg font-semibold tracking-tight">Center of Hash</h1>
          <p className="hidden md:block text-xs text-slate-400">Hashrate-weighted centroid of the Bitcoin network</p>
        </div>
        <a
          href="https://www.unchained.com/bitcoin-astronomy/the-law-of-hash-horizons"
          target="_blank"
          rel="noreferrer"
          className="hidden md:inline text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Bitcoin Astronomy →
        </a>
      </header>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Canvas (always full flex-1, sidebar sits beside it on desktop) */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
              Loading hashrate data…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm">
              {error}
            </div>
          )}
          {!loading && !error && (
            <>
              <Scene
                centroid={effectiveCentroid}
                autoOrbit={autoOrbit}
                jumpTarget={jumpTarget}
                onJumpComplete={() => setJumpTarget(null)}
                onScaleChange={handleScaleChange}
                positions={positions}
                anchorBody={anchorTarget}
              />
              <ScaleBar ref={scaleBarRef} />
            </>
          )}
          {!loading && !error && (
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              <SceneOverlay
                autoOrbit={autoOrbit}
                onToggleAutoOrbit={() => setAutoOrbit((v) => !v)}
                onJumpTo={(t) => setJumpTarget(t)}
                anchorTarget={anchorTarget}
                onAnchor={setAnchorTarget}
              />
              {bodyStatuses && (
                <BodyStatusPanel
                  bodyStatuses={bodyStatuses}
                  spaceMiners={spaceMiners}
                />
              )}
            </div>
          )}

          {/* Mobile FAB — opens the bottom sheet */}
          {!loading && !error && (
            <button
              className="md:hidden absolute bottom-3 right-3 z-20 h-10 px-4 rounded-full bg-slate-800/90 backdrop-blur-sm border border-slate-700/40 text-slate-300 text-xs font-medium shadow-lg active:bg-slate-700"
              onClick={() => setMobilePanelOpen(true)}
            >
              ☰ Data
            </button>
          )}
        </div>

        {/* Desktop sidebar — hidden on mobile */}
        <aside className="hidden md:flex flex-col w-72 border-l border-slate-800 p-4 gap-4 overflow-y-auto flex-none">
          <SidebarContent snap={snap} spaceMiners={spaceMiners} onSpaceMinersChange={setSpaceMiners} />
        </aside>
      </div>

      {/* ── Footer ── compact on mobile */}
      <footer className="border-t border-slate-800 px-4 md:px-6 py-2 md:py-3 flex-none flex flex-col gap-2 md:gap-3">
        <SimDateControls value={simDate} onChange={setSimDate} />
        <TimeSlider
          snapshots={snapshots}
          selectedIndex={selectedIndex}
          onChange={setSelectedIndex}
        />
      </footer>

      {/* ── Mobile bottom sheet ── */}

      {/* Backdrop: tap to dismiss */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          mobilePanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobilePanelOpen(false)}
      />

      {/* Sheet itself */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-out ${
          mobilePanelOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-slate-900 border-t border-slate-700/50 rounded-t-2xl max-h-[72vh] flex flex-col">

          {/* Handle + header row */}
          <div className="flex-none pt-2.5 pb-0 flex justify-center">
            <div className="w-9 h-1 bg-slate-600 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800 flex-none">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Data & Controls
            </span>
            <button
              onClick={() => setMobilePanelOpen(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-2 -mr-2"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex flex-col gap-4 p-4 pb-8">
            <SidebarContent snap={snap} spaceMiners={spaceMiners} onSpaceMinersChange={setSpaceMiners} />
          </div>
        </div>
      </div>
    </div>
  );
}
