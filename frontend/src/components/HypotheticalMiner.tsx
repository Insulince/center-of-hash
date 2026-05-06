export interface SpaceMinersConfig {
  earth: number;
  moon: number;
  mars: number;
  sun: number;
}

export const DEFAULT_SPACE_MINERS: SpaceMinersConfig = { earth: 1, moon: 0, mars: 0, sun: 0 };

const BODIES: { key: keyof SpaceMinersConfig; label: string; color: string }[] = [
  { key: 'earth', label: 'Earth', color: '#60a5fa' },
  { key: 'moon',  label: 'Moon',  color: '#a8a8c0' },
  { key: 'mars',  label: 'Mars',  color: '#ef4444' },
  { key: 'sun',   label: 'Sun',   color: '#fbbf24' },
];

const KEYS = BODIES.map((b) => b.key);

const PRESETS: { label: string; config: SpaceMinersConfig }[] = [
  { label: 'Earth',     config: { earth: 1,    moon: 0,    mars: 0,    sun: 0    } },
  { label: 'Moon',      config: { earth: 0,    moon: 1,    mars: 0,    sun: 0    } },
  { label: 'Mars',      config: { earth: 0,    moon: 0,    mars: 1,    sun: 0    } },
  { label: 'Sun',       config: { earth: 0,    moon: 0,    mars: 0,    sun: 1    } },
  { label: 'E + Moon',  config: { earth: 0.5,  moon: 0.5,  mars: 0,    sun: 0    } },
  { label: 'E + Mars',  config: { earth: 0.5,  moon: 0,    mars: 0.5,  sun: 0    } },
  { label: 'Near Future', config: { earth: 0.7, moon: 0.2, mars: 0.1,  sun: 0    } },
  { label: 'Equal',     config: { earth: 0.25, moon: 0.25, mars: 0.25, sun: 0.25 } },
  { label: 'Off-World', config: { earth: 0,    moon: 1/3,  mars: 1/3,  sun: 1/3  } },
];

function reallocate(
  key: keyof SpaceMinersConfig,
  newVal: number,
  current: SpaceMinersConfig,
): SpaceMinersConfig {
  const oldVal = current[key];
  const oldOthersTotal = 1 - oldVal;
  const remaining = 1 - newVal;
  const others = KEYS.filter((k) => k !== key);

  const next = { ...current, [key]: newVal };
  if (oldOthersTotal === 0) {
    const even = remaining / others.length;
    others.forEach((k) => { next[k] = even; });
  } else {
    others.forEach((k) => {
      next[k] = current[k] * remaining / oldOthersTotal;
    });
  }

  // Reject moves that would zero out everything — at least one body must have weight.
  const total = KEYS.reduce((sum, k) => sum + next[k], 0);
  if (total === 0) return current;

  return next;
}

interface Props {
  value: SpaceMinersConfig;
  onChange: (cfg: SpaceMinersConfig) => void;
}

export function SpaceMiners({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs uppercase tracking-widest text-slate-400">Hashrate Distribution</h3>

      <div className="flex flex-col gap-2.5">
        {BODIES.map(({ key, label, color }) => {
          const pct = value[key] * 100;
          return (
            <div key={key} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color }}>{label}</span>
                <span className="text-xs tabular-nums text-slate-400">{pct.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={pct}
                onChange={(e) => onChange(reallocate(key, Number(e.target.value) / 100, value))}
                className="w-full"
                style={{ '--thumb-color': color } as React.CSSProperties}
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800">
        <p className="text-xs text-slate-500">Presets</p>
        <div className="grid grid-cols-3 gap-1">
          {PRESETS.map(({ label, config }) => (
            <button
              key={label}
              onClick={() => onChange(config)}
              className="px-1.5 py-1 bg-slate-700/80 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors text-center leading-tight"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { SpaceMiners as HypotheticalMiner };
