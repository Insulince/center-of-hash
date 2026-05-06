import type { JumpTarget } from './Scene';

interface Props {
  autoOrbit: boolean;
  onToggleAutoOrbit: () => void;
  onJumpTo: (target: JumpTarget) => void;
}

const JUMP_LABELS: { target: JumpTarget; label: string }[] = [
  { target: 'earth', label: 'Earth' },
  { target: 'moon', label: 'Moon' },
  { target: 'mars', label: 'Mars' },
  { target: 'sun', label: 'Sun' },
  { target: 'centroid', label: 'Centroid' },
  { target: 'solar-system', label: 'Full View' },
];

export function SceneOverlay({ autoOrbit, onToggleAutoOrbit, onJumpTo }: Props) {
  return (
    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
      <button
        onClick={onToggleAutoOrbit}
        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
          autoOrbit
            ? 'bg-orange-500 text-white'
            : 'bg-slate-700/90 text-slate-300 hover:bg-slate-600'
        }`}
      >
        {autoOrbit ? 'Auto-Orbit: On' : 'Auto-Orbit: Off'}
      </button>

      <div className="bg-slate-800/90 rounded p-2 flex flex-col gap-1">
        <p className="text-xs text-slate-500 font-medium px-1 mb-0.5">Jump to</p>
        {JUMP_LABELS.map(({ target, label }) => (
          <button
            key={target}
            onClick={() => onJumpTo(target)}
            className="px-3 py-1 bg-slate-700/80 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors text-left"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
