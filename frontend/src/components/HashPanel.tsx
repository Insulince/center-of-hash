import type { CountryShare } from '../types';

interface Props {
  shares: CountryShare[];
}

export function HashPanel({ shares }: Props) {
  const sorted = [...shares].sort((a, b) => b.share - a.share).slice(0, 12);
  const total = sorted.reduce((s, c) => s + c.share, 0);

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-2">Hashrate Distribution</h3>
      {sorted.map((c) => {
        const pct = ((c.share / total) * 100).toFixed(1);
        return (
          <div key={c.country} className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-300 w-6">{c.country}</span>
            <div className="flex-1 bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-orange-500 h-1.5 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-400 w-10 text-right">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
