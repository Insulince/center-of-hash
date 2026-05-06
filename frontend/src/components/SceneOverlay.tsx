import type { JumpTarget } from './Scene';

export type AnchorTarget = Exclude<JumpTarget, 'solar-system'>;

interface Props {
  autoOrbit: boolean;
  onToggleAutoOrbit: () => void;
  onJumpTo: (target: JumpTarget) => void;
  anchorTarget: AnchorTarget | null;
  onAnchor: (target: AnchorTarget | null) => void;
}

const BODIES: { target: AnchorTarget; label: string; color: string }[] = [
  { target: 'earth',    label: 'Earth',    color: '#60a5fa' },
  { target: 'moon',     label: 'Moon',     color: '#94a3b8' },
  { target: 'mars',     label: 'Mars',     color: '#ef4444' },
  { target: 'sun',      label: 'Sun',      color: '#fbbf24' },
  { target: 'centroid', label: 'Centroid', color: '#f97316' },
];

export function SceneOverlay({ autoOrbit, onToggleAutoOrbit, onJumpTo, anchorTarget, onAnchor }: Props) {
  return (
    <div className="absolute top-3 left-3 z-10">
      <div className="bg-slate-900/85 backdrop-blur-sm rounded-lg border border-slate-700/40 overflow-hidden min-w-[160px]">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-slate-700/40">
          <span className="text-xs font-semibold tracking-widest uppercase text-slate-500">
            Navigation
          </span>
          <button
            onClick={onToggleAutoOrbit}
            title={autoOrbit ? 'Disable auto-orbit' : 'Enable auto-orbit'}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              autoOrbit
                ? 'bg-orange-500/90 text-white'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-700'
            }`}
          >
            ⟳ {autoOrbit ? 'Orbiting' : 'Orbit'}
          </button>
        </div>

        {/* Body list */}
        <div className="p-1.5 flex flex-col gap-0.5">
          {BODIES.map(({ target, label, color }) => {
            const isAnchored = anchorTarget === target;
            return (
              <div key={target} className="flex items-center gap-0.5">
                <button
                  onClick={() => onJumpTo(target)}
                  className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors text-left"
                >
                  <span style={{ color, fontSize: '8px', lineHeight: 1 }}>●</span>
                  {label}
                </button>
                <button
                  title={isAnchored ? 'Unanchor camera' : `Anchor camera to ${label}`}
                  onClick={() => onAnchor(isAnchored ? null : target)}
                  className={`w-8 h-7 rounded text-xs font-medium transition-colors ${
                    isAnchored
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:text-slate-400 hover:bg-slate-700/60'
                  }`}
                >
                  ⊙
                </button>
              </div>
            );
          })}

          <div className="my-0.5 border-t border-slate-700/40" />

          <button
            onClick={() => onJumpTo('solar-system')}
            className="w-full px-2 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors text-center"
          >
            Full View
          </button>
        </div>
      </div>
    </div>
  );
}
