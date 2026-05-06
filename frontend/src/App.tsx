import { useState, useEffect, useCallback, useRef } from 'react';
import { Scene, type JumpTarget } from './components/Scene';
import { SceneOverlay } from './components/SceneOverlay';
import { TimeSlider } from './components/TimeSlider';
import { HashPanel } from './components/HashPanel';
import { HypotheticalMiner, type HypotheticalMinerConfig } from './components/HypotheticalMiner';
import { ScaleBar, type ScaleBarHandle, type ScaleInfo } from './components/ScaleBar';
import { useSnapshots } from './hooks/useSnapshots';
import { latLonToECEF } from './lib/ecef';
import { weightedCentroid, type Miner } from './lib/centroid';
import { countryLatLon } from './lib/countries';
import './index.css';

export default function App() {
  const { snapshots, loading, error } = useSnapshots();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hypothetical, setHypothetical] = useState<HypotheticalMinerConfig | null>(null);
  const [autoOrbit, setAutoOrbit] = useState(false);
  const [jumpTarget, setJumpTarget] = useState<JumpTarget | null>(null);
  const scaleBarRef = useRef<ScaleBarHandle>(null);
  // Stable callback: mutates the DOM ref directly, never triggers a React re-render.
  const handleScaleChange = useCallback((info: ScaleInfo) => scaleBarRef.current?.update(info), []);

  useEffect(() => {
    if (snapshots.length > 0) setSelectedIndex(snapshots.length - 1);
  }, [snapshots.length]);

  const snap = snapshots[selectedIndex] ?? null;

  const effectiveCentroid = (() => {
    if (!snap) return null;
    if (!hypothetical) return snap.centroid;

    const scale = 1 - hypothetical.hashrateFraction;
    const miners: Miner[] = snap.shares.flatMap((s) => {
      const coords = countryLatLon(s.country);
      if (!coords) return [];
      const [x, y, z] = latLonToECEF(coords[0], coords[1]);
      return [{ x, y, z, weight: s.share * scale }];
    });
    const [hx, hy, hz] = hypothetical.ecef ?? latLonToECEF(hypothetical.lat, hypothetical.lon);
    miners.push({ x: hx, y: hy, z: hz, weight: hypothetical.hashrateFraction });
    return weightedCentroid(miners);
  })();

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col">
      <header className="px-6 py-3 flex items-center justify-between border-b border-slate-800">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Center of Hash</h1>
          <p className="text-xs text-slate-400">Hashrate-weighted centroid of the Bitcoin network</p>
        </div>
        <a
          href="https://www.unchained.com/bitcoin-astronomy/the-law-of-hash-horizons"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Bitcoin Astronomy →
        </a>
      </header>

      <div className="flex flex-1 overflow-hidden">
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
              />
              <ScaleBar ref={scaleBarRef} />
            </>
          )}
          {!loading && !error && (
            <SceneOverlay
              autoOrbit={autoOrbit}
              onToggleAutoOrbit={() => setAutoOrbit((v) => !v)}
              onJumpTo={(t) => setJumpTarget(t)}
            />
          )}
        </div>

        <aside className="w-72 border-l border-slate-800 p-4 flex flex-col gap-6 overflow-y-auto">
          {snap && <HashPanel shares={snap.shares} />}
          <HypotheticalMiner value={hypothetical} onChange={setHypothetical} />
          <div className="text-xs text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-400 mb-1">What is this?</p>
            <p>
              Each Bitcoin miner occupies a real point in space. The center of hash is the
              hashrate-weighted centroid of all mining activity — analogous to a center of mass.
              Today, that point sits inside the Earth, offset toward whichever hemisphere mines
              more heavily.
            </p>
            <p className="mt-2 text-slate-600">
              Data:{' '}
              <a
                href="https://ccaf.io/cbeci/mining-map"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-slate-400 transition-colors"
              >
                Cambridge Centre for Alternative Finance (CCAF)
              </a>
              , monthly snapshots Sept 2019–Dec 2021.
            </p>
            <div className="mt-2 text-slate-600 space-y-1">
              <p>⚠ Sample coverage ~32–38% of global hashrate (cooperating pools only).</p>
              <p>⚠ IP geolocation can be spoofed; DE and IE shares may be inflated by VPN.</p>
              <p>⚠ Country-level granularity only — miners in Texas and Maine both map to the US centroid.</p>
            </div>
          </div>
        </aside>
      </div>

      <footer className="border-t border-slate-800 px-6 py-3">
        <TimeSlider
          snapshots={snapshots}
          selectedIndex={selectedIndex}
          onChange={setSelectedIndex}
        />
      </footer>
    </div>
  );
}
