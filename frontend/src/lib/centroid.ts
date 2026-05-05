import type { Centroid } from '../types';

export interface Miner {
  x: number;
  y: number;
  z: number;
  weight: number;
}

// Returns null for empty miners — (0,0,0) is ambiguous (valid ECEF = Earth's center)
export function weightedCentroid(miners: Miner[]): Centroid | null {
  if (miners.length === 0) return null;
  let x = 0, y = 0, z = 0;
  for (const m of miners) {
    x += m.weight * m.x;
    y += m.weight * m.y;
    z += m.weight * m.z;
  }
  return { x, y, z };
}
