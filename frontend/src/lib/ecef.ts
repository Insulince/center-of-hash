const EARTH_RADIUS_M = 6_371_000;

export function latLonToECEF(latDeg: number, lonDeg: number): [number, number, number] {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return [
    EARTH_RADIUS_M * Math.cos(lat) * Math.cos(lon),
    EARTH_RADIUS_M * Math.cos(lat) * Math.sin(lon),
    EARTH_RADIUS_M * Math.sin(lat),
  ];
}
