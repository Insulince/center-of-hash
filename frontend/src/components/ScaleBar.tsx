import { forwardRef, useImperativeHandle, useRef } from 'react';

// Units ordered largest → smallest. The first unit where the raw value >= 1 is selected.
const UNITS = [
  { factor: 1_079_252_848_800, label: 'lh' }, // light-hour  ~1.079 Tm
  { factor: 17_987_547_480,    label: 'lm' }, // light-minute ~17.99 Gm
  { factor: 1_000_000_000,     label: 'Gm' }, // gigameter
  { factor: 299_792_458,       label: 'ls' }, // light-second ~299.8 Mm
  { factor: 1_000_000,         label: 'Mm' }, // megameter
  { factor: 1_000,             label: 'km' }, // kilometer
  { factor: 1,                 label: 'm'  }, // meter
];

const NICE_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
const TARGET_PX = 150;

export interface ScaleInfo {
  value: number;
  unit: string;
  barPx: number;
}

export function computeScale(metersPerPixel: number): ScaleInfo | null {
  if (!isFinite(metersPerPixel) || metersPerPixel <= 0) return null;

  const rawMeters = metersPerPixel * TARGET_PX;

  for (const unit of UNITS) {
    const valueInUnit = rawMeters / unit.factor;
    if (valueInUnit >= 1) {
      const nice = NICE_STEPS.reduce((best, s) =>
        Math.abs(s - valueInUnit) < Math.abs(best - valueInUnit) ? s : best
      );
      return {
        value: nice,
        unit: unit.label,
        barPx: (nice * unit.factor) / metersPerPixel,
      };
    }
  }

  return { value: 1, unit: 'm', barPx: 1 / metersPerPixel };
}

export interface ScaleBarHandle {
  update(info: ScaleInfo): void;
}

// ScaleBar intentionally uses direct DOM mutation (no React state) so the bar
// width tracks zoom smoothly at 60 fps without triggering any React re-renders.
export const ScaleBar = forwardRef<ScaleBarHandle>(function ScaleBar(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef       = useRef<HTMLDivElement>(null);
  const labelRef     = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => ({
    update({ value, unit, barPx }: ScaleInfo) {
      if (barRef.current)       barRef.current.style.width = `${barPx}px`;
      if (labelRef.current)     labelRef.current.textContent = `${value} ${unit}`;
      if (containerRef.current) containerRef.current.style.opacity = '1';
    },
  }));

  return (
    // opacity starts at 0 so nothing flashes before the first frame fires.
    <div
      ref={containerRef}
      style={{ opacity: 0 }}
      className="absolute bottom-4 left-4 flex flex-col items-start gap-1 pointer-events-none select-none"
    >
      <span ref={labelRef} className="text-xs font-mono text-white/80 leading-none" />
      {/* Bar with end-cap ticks */}
      <div className="flex items-end">
        <div className="w-px h-2 bg-white/70 flex-none" />
        <div ref={barRef} className="h-px bg-white/70" />
        <div className="w-px h-2 bg-white/70 flex-none" />
      </div>
    </div>
  );
});
