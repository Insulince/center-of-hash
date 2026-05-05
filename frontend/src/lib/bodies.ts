export const EARTH_RADIUS = 6_371_000; // m
export const MOON_RADIUS = 1_737_400; // m
export const MARS_RADIUS = 3_389_500; // m

// Average distances from Earth center, in meters
export const MOON_DISTANCE = 384_400_000; // ~384,400 km
export const MARS_DISTANCE = 225_000_000_000; // ~225 million km

// Three.js scene positions (Y-up, meters)
// Moon on +X axis, Mars on -Z axis (in front of default camera viewpoint)
export const MOON_POSITION: [number, number, number] = [MOON_DISTANCE, 0, 0];
export const MARS_POSITION: [number, number, number] = [0, 0, -MARS_DISTANCE];
