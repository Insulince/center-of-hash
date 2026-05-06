import type { Centroid } from '../types';

export interface Miner {
  x: number;
  y: number;
  z: number;
  weight: number;
}

// Returns null when miners are empty or all weights are zero.
export function weightedCentroid(miners: Miner[]): Centroid | null {
  if (miners.length === 0) return null;
  let x = 0, y = 0, z = 0, total = 0;
  for (const m of miners) {
    x += m.weight * m.x;
    y += m.weight * m.y;
    z += m.weight * m.z;
    total += m.weight;
  }
  if (total === 0) return null;
  return { x: x / total, y: y / total, z: z / total };
}
