import { useState, useEffect, type ReactNode } from 'react';
import { LIGHT_LAG_RADIUS } from './LightLagSphere';
import type { SpaceMinersConfig } from './HypotheticalMiner';

export interface BodyStatus {
  distanceToCentroid: number; // meters
  inLightSphere: boolean;
}

export interface BodyStatuses {
  earth: BodyStatus;
  moon:  BodyStatus;
  mars:  BodyStatus;
  sun:   BodyStatus;
}

function formatDistance(meters: number): string {
  const AU = 149_597_870_700;
  const Gm = 1_000_000_000;
  const Mm = 1_000_000;
  if (meters >= AU) return `${(meters / AU).toFixed(2)} AU`;
  if (meters >= Gm) return `${(meters / Gm).toFixed(1)} Gm`;
  if (meters >= Mm) return `${(meters / Mm).toFixed(1)} Mm`;
  return `${(meters / 1_000).toFixed(0)} km`;
}

// Hover-only tooltip that opens above the trigger — used for row status labels.
function TipAbove({ children, content }: { children: ReactNode; content: ReactNode }) {
  return (
    <span className="relative inline-block group">
      {children}
      <span className="absolute left-0 bottom-full mb-2 z-50 w-64 p-2.5 bg-slate-800 border border-slate-700/60 rounded-lg text-[11px] text-slate-300 leading-relaxed shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-normal">
        {content}
      </span>
    </span>
  );
}

// Click-to-pin tooltip — clicking the trigger toggles it open/locked;
// clicking anywhere else on the page closes it.
function PinnableTip({ children, content }: { children: ReactNode; content: ReactNode }) {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!pinned) return;
    const close = () => setPinned(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [pinned]);

  return (
    <span className="relative inline-block group">
      <span
        onClick={(e) => { e.stopPropagation(); setPinned((p) => !p); }}
        className="cursor-pointer"
      >
        {children}
      </span>
      <span
        className={`absolute left-0 top-full mt-2 z-50 w-72 p-3 bg-slate-800 border border-slate-700/60 rounded-lg text-[11px] text-slate-300 leading-relaxed shadow-xl transition-opacity duration-150 pointer-events-none whitespace-normal ${
          pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {content}
      </span>
    </span>
  );
}

const SPHERE_TIP = (
  <>
    <p className="text-slate-100 font-medium mb-1.5">What is the light-lag sphere?</p>
    <p className="mb-1.5">
      It is centered on the network's hashrate centroid with a radius equal to one Bitcoin block
      time of light travel — about 10 light-minutes, or ~179.9 Gm.
    </p>
    <p>
      Miners <span className="text-emerald-400">inside</span> it will, on average, hear about a
      new block before the next one is found — their work stays valid.{' '}
      Miners <span className="text-slate-400">outside</span> it are already mining a stale block
      by the time the latest announcement reaches them.
    </p>
  </>
);

// Shared grid column template used by both the header row and every body row.
const COLS = '1fr 76px 52px';

interface RowProps {
  color: string;
  label: string;
  share: number;
  status: BodyStatus;
}

function BodyRow({ color, label, share, status }: RowProps) {
  const { distanceToCentroid, inLightSphere } = status;
  const edgeDist = Math.abs(LIGHT_LAG_RADIUS - distanceToCentroid);
  const statusTip = inLightSphere
    ? `${formatDistance(edgeDist)} from the sphere edge. Miners here will, on average, hear about a new block before the next one is found elsewhere.`
    : `${formatDistance(edgeDist)} beyond the sphere edge. Miners here are, on average, already working on a stale block when a new one is announced.`;

  return (
    <div
      className="grid items-center gap-x-4 px-4 py-2 border-t border-slate-800/50"
      style={{ gridTemplateColumns: COLS }}
    >
      {/* Body name + hash share */}
      <div className="flex items-center gap-2 min-w-0">
        <span style={{ color, fontSize: '7px', flexShrink: 0, lineHeight: 1 }}>●</span>
        <div className="min-w-0">
          <p className="text-xs text-slate-200 leading-snug truncate">{label}</p>
          <p className="text-[10px] text-slate-500 leading-snug">
            {share > 0 ? `${(share * 100).toFixed(0)}% hash` : 'no miners'}
          </p>
        </div>
      </div>

      {/* Distance from centroid */}
      <p className="text-[11px] text-slate-300 font-mono tabular-nums text-right">
        {formatDistance(distanceToCentroid)}
      </p>

      {/* Inside / Outside — dashed underline signals hover tooltip */}
      <div className="flex justify-end">
        <TipAbove content={statusTip}>
          <span
            className={`text-[11px] font-medium cursor-help border-b border-dashed ${
              inLightSphere
                ? 'text-emerald-400 border-emerald-700/60'
                : 'text-slate-500 border-slate-600/60'
            }`}
          >
            {inLightSphere ? 'Inside' : 'Outside'}
          </span>
        </TipAbove>
      </div>
    </div>
  );
}

interface Props {
  bodyStatuses: BodyStatuses;
  spaceMiners: SpaceMinersConfig;
}

export function BodyStatusPanel({ bodyStatuses, spaceMiners }: Props) {
  return (
    <div className="bg-slate-900/85 backdrop-blur-sm rounded-lg border border-slate-700/40">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-700/40">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold tracking-widest uppercase text-slate-500">
            Light-Lag Sphere
          </span>
          <PinnableTip content={SPHERE_TIP}>
            <span className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors select-none">
              ⓘ
            </span>
          </PinnableTip>
        </div>
        <span className="text-[10px] text-slate-600 font-mono tabular-nums">
          r = {formatDistance(LIGHT_LAG_RADIUS)}
        </span>
      </div>

      {/* Column headers */}
      <div className="grid gap-x-4 px-4 pt-2 pb-1" style={{ gridTemplateColumns: COLS }}>
        <span className="text-[9px] uppercase tracking-wider text-slate-600">Body</span>
        <span className="text-[9px] uppercase tracking-wider text-slate-600 text-right">From centroid</span>
        <span className="text-[9px] uppercase tracking-wider text-slate-600 text-right">Status</span>
      </div>

      <BodyRow color="#60a5fa" label="Earth" share={spaceMiners.earth} status={bodyStatuses.earth} />
      <BodyRow color="#94a3b8" label="Moon"  share={spaceMiners.moon}  status={bodyStatuses.moon}  />
      <BodyRow color="#ef4444" label="Mars"  share={spaceMiners.mars}  status={bodyStatuses.mars}  />
      <BodyRow color="#fbbf24" label="Sun"   share={spaceMiners.sun}   status={bodyStatuses.sun}   />
    </div>
  );
}
