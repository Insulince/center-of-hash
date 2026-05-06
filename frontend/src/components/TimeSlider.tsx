import type { Snapshot } from '../types';

interface Props {
  snapshots: Snapshot[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function TimeSlider({ snapshots, selectedIndex, onChange }: Props) {
  if (snapshots.length === 0) return null;

  const snap = snapshots[selectedIndex];
  const date = new Date(snap.date);
  const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">Historical Snapshot</span>
        <span className="text-xs tabular-nums text-slate-300">{label}</span>
      </div>
      <div className="hidden md:flex justify-between text-xs text-slate-600 font-mono">
        <span>{new Date(snapshots[0].date).getFullYear()}</span>
        <span>{new Date(snapshots[snapshots.length - 1].date).getFullYear()}</span>
      </div>
      <input
        type="range"
        min={0}
        max={snapshots.length - 1}
        value={selectedIndex}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ '--thumb-color': '#f97316' } as React.CSSProperties}
      />
    </div>
  );
}
