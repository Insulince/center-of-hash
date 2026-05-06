export const EARTH_RADIUS = 6_371_000; // m
export const MOON_RADIUS = 1_737_400; // m
export const MARS_RADIUS = 3_389_500; // m
export const SUN_RADIUS = 696_000_000; // m

// Average distances from Earth center, in meters
export const MOON_DISTANCE = 384_400_000; // ~384,400 km
export const MARS_DISTANCE = 225_000_000_000; // ~225 million km
export const SUN_DISTANCE = 149_597_870_700; // m (1 AU)

// Three.js scene positions (Y-up, meters)
// Moon on +X axis, Mars on -Z axis, Sun on +Z axis (behind default camera, correctly lights Earth face)
export const MOON_POSITION: [number, number, number] = [MOON_DISTANCE, 0, 0];
export const MARS_POSITION: [number, number, number] = [0, 0, -MARS_DISTANCE];
export const SUN_POSITION: [number, number, number] = [0, 0, SUN_DISTANCE];
