import type { JumpTarget } from './Scene';

export type AnchorTarget = Exclude<JumpTarget, 'solar-system'>;

interface Props {
  autoOrbit: boolean;
  onToggleAutoOrbit: () => void;
  onJumpTo: (target: JumpTarget) => void;
  anchorTarget: AnchorTarget | null;
  onAnchor: (target: AnchorTarget | null) => void;
}

const JUMP_LABELS: { target: JumpTarget; label: string; anchorable: boolean }[] = [
  { target: 'earth',        label: 'Earth',    anchorable: true },
  { target: 'moon',         label: 'Moon',     anchorable: true },
  { target: 'mars',         label: 'Mars',     anchorable: true },
  { target: 'sun',          label: 'Sun',      anchorable: true },
  { target: 'centroid',     label: 'Centroid', anchorable: true },
  { target: 'solar-system', label: 'Full View',anchorable: false },
];

export function SceneOverlay({ autoOrbit, onToggleAutoOrbit, onJumpTo, anchorTarget, onAnchor }: Props) {
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
        <p className="text-xs text-slate-500 font-medium px-1 mb-0.5">Jump to / Anchor</p>
        {JUMP_LABELS.map(({ target, label, anchorable }) => {
          const isAnchored = anchorable && anchorTarget === target;
          return (
            <div key={target} className="flex gap-1">
              <button
                onClick={() => onJumpTo(target)}
                className="flex-1 px-3 py-1 bg-slate-700/80 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors text-left"
              >
                {label}
              </button>
              {anchorable && (
                <button
                  title={isAnchored ? 'Unanchor camera' : `Anchor camera to ${label}`}
                  onClick={() => onAnchor(isAnchored ? null : (target as AnchorTarget))}
                  className={`w-7 rounded text-xs font-medium transition-colors ${
                    isAnchored
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700/80 text-slate-500 hover:bg-slate-600 hover:text-slate-300'
                  }`}
                >
                  ⊙
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
