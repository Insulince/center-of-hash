import { useMemo } from 'react';
import { getPlanetaryPositions, type PlanetaryPositions } from '../lib/ephemeris';

export function usePlanetaryPositions(date?: Date): PlanetaryPositions {
  // Use numeric timestamp as dep so a new Date object with the same time doesn't
  // trigger a recompute (important when playing the simulation at 30fps).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getPlanetaryPositions(date ?? new Date()), [date?.getTime() ?? 0]);
}
