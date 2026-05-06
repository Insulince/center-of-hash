import { useState, useEffect, useRef } from 'react';

const MS_PER_DAY  = 86_400_000;
// astronomy-engine is reliable from ~100 CE to ~17000 CE; use 200–4999 for safety
const MIN_DATE_MS = new Date('0200-01-01').getTime();
const MAX_DATE_MS = new Date('4999-01-01').getTime();
const RANGE_DAYS  = (MAX_DATE_MS - MIN_DATE_MS) / MS_PER_DAY;

// days per real second at each speed
const SPEEDS = [
  { label: '1d/s',   dps: 1 },
  { label: '1wk/s',  dps: 7 },
  { label: '1mo/s',  dps: 30 },
  { label: '1yr/s',  dps: 365 },
  { label: '10yr/s', dps: 3_650 },
  { label: '100yr/s',dps: 36_500 },
];

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

interface Props {
  value: Date;
  onChange: (d: Date) => void;
}

export function SimDateControls({ value, onChange }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [dps, setDps] = useState(30);

  // Keep a mutable ref so the interval always reads the latest date without
  // needing to be in the dependency array (which would restart it constantly).
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  // Advance the date at ~30fps. setInterval rather than rAF keeps the loop
  // outside the Three.js render cycle and avoids fighting with R3F's useFrame.
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      const curr = valueRef.current;
      const delta = (dps * direction * MS_PER_DAY) / 30; // advance per frame at 30fps
      const next = Math.max(MIN_DATE_MS, Math.min(MAX_DATE_MS, curr.getTime() + delta));
      onChange(new Date(next));
      if (next === MIN_DATE_MS || next === MAX_DATE_MS) setIsPlaying(false);
    }, 33);
    return () => clearInterval(id);
  }, [isPlaying, direction, dps, onChange]);

  const sliderDay = Math.round((value.getTime() - MIN_DATE_MS) / MS_PER_DAY);

  const handlePlay = () => {
    setDirection(1);
    setIsPlaying(v => !v || direction !== 1);
  };
  const handleRewind = () => {
    setDirection(-1);
    setIsPlaying(v => !v || direction !== -1);
  };

  const playingForward  = isPlaying && direction === 1;
  const playingBackward = isPlaying && direction === -1;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">Planetary Date</span>
        <span className="text-xs tabular-nums text-slate-300">{fmt(value)}</span>
      </div>

      <input
        type="range"
        min={0}
        max={RANGE_DAYS}
        value={sliderDay}
        onChange={(e) => {
          setIsPlaying(false);
          onChange(new Date(MIN_DATE_MS + Number(e.target.value) * MS_PER_DAY));
        }}
        className="w-full"
        style={{ '--thumb-color': '#3b82f6' } as React.CSSProperties}
      />

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleRewind}
          title="Play backward"
          className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
            playingBackward ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          ◀
        </button>
        <button
          onClick={handlePlay}
          title={playingForward ? 'Pause' : 'Play forward'}
          className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
            playingForward ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {playingForward ? '⏸' : '▶'}
        </button>
        <select
          value={dps}
          onChange={(e) => setDps(Number(e.target.value))}
          className="ml-auto bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-1 py-0.5 cursor-pointer"
        >
          {SPEEDS.map((s) => (
            <option key={s.dps} value={s.dps}>{s.label}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-600 leading-tight">
        2018-07-31: Mars opposition (~58 Gm, inside sphere) · 2019-09-02: ~370 Gm, outside
      </p>
    </div>
  );
}
