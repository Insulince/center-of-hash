import { useState, useRef } from 'react';
import { MOON_DISTANCE, MARS_DISTANCE } from '../lib/bodies';

export interface HypotheticalMinerConfig {
  label: string;
  lat: number;
  lon: number;
  distanceFromSunAU: number;
  hashrateFraction: number;
  // When set, bypasses latLonToECEF and uses these ECEF coords directly.
  // Required for off-Earth bodies where surface lat/lon would wrongly snap to Earth's surface.
  ecef?: [number, number, number];
}

const PRESETS: HypotheticalMinerConfig[] = [
  {
    label: 'Mars Surface',
    lat: 18.65,
    lon: 77.58,
    distanceFromSunAU: 1.52,
    hashrateFraction: 0.05,
    // Three.js Mars position is [0,0,-MARS_DISTANCE]; ECEF mapping: ecef.y = -three.z
    ecef: [0, MARS_DISTANCE, 0],
  },
  {
    label: 'Moon (Mare Serenitatis)',
    lat: 28.0,
    lon: 17.5,
    distanceFromSunAU: 1.0,
    hashrateFraction: 0.05,
    // Three.js Moon position is [MOON_DISTANCE,0,0]; ECEF mapping is identical here
    ecef: [MOON_DISTANCE, 0, 0],
  },
];

interface Props {
  value: HypotheticalMinerConfig | null;
  onChange: (config: HypotheticalMinerConfig | null) => void;
}

export function HypotheticalMiner({ value, onChange }: Props) {
  const [fraction, setFraction] = useState(5);
  const [inputStr, setInputStr] = useState('5.000');
  const inputFocused = useRef(false);

  const applyFraction = (f: number) => {
    const clamped = Math.max(0, Math.min(100, f));
    setFraction(clamped);
    setInputStr(clamped.toFixed(3));
    if (value) onChange({ ...value, hashrateFraction: clamped / 100 });
  };

  const commitInput = () => {
    const parsed = parseFloat(inputStr.replace('%', '').trim());
    if (!isNaN(parsed)) {
      applyFraction(parsed);
    } else {
      setInputStr(fraction.toFixed(3));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs uppercase tracking-widest text-slate-400">Hypothetical Miner</h3>
      <div className="flex flex-col gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => onChange({ ...p, hashrateFraction: fraction / 100 })}
            className={`text-left px-3 py-2 rounded text-xs border transition-colors ${
              value?.label === p.label
                ? 'border-orange-500 bg-orange-500/10 text-orange-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => onChange(null)}
          className="text-left px-3 py-2 rounded text-xs border border-slate-800 text-slate600 hover:text-slate-400 transition-colors"
        >
          Remove hypothetical miner
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Hashrate:</span>
          <input
            type="text"
            value={inputStr}
            onFocus={() => { inputFocused.current = true; }}
            onBlur={() => { inputFocused.current = false; commitInput(); }}
            onChange={(e) => setInputStr(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
            className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-xs font-mono text-white text-right focus:outline-none focus:border-orange-500"
          />
          <span className="text-xs text-slate-400">% of global</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={fraction}
          onChange={(e) => {
            const f = Number(e.target.value);
            setFraction(f);
            if (!inputFocused.current) setInputStr(f.toFixed(3));
            if (value) onChange({ ...value, hashrateFraction: f / 100 });
          }}
          className="w-full accent-orange-500 cursor-pointer"
        />
      </div>
    </div>
  );
}
