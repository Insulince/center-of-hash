import * as Astronomy from 'astronomy-engine';
import { Vector3 } from 'three';

// All positions are heliocentric ecliptic J2000, converted to Three.js Y-up meters.
// Sun sits at the scene origin. Earth and Mars orbit around it.
export interface PlanetaryPositions {
  sun: Vector3;   // always (0,0,0) — heliocentric origin
  earth: Vector3; // heliocentric, Three.js Y-up, meters
  mars: Vector3;  // heliocentric, Three.js Y-up, meters
  moon: Vector3;  // earth + geocentric offset, Three.js Y-up, meters
}

const AU_TO_METERS = 149_597_870_700;

// Ecliptic J2000 → Three.js Y-up (right-handed):
// ecl.x → three.x,  ecl.z (north pole) → three.y,  -ecl.y → three.z
function eclToThreeJs(ex: number, ey: number, ez: number): Vector3 {
  return new Vector3(ex * AU_TO_METERS, ez * AU_TO_METERS, -ey * AU_TO_METERS);
}

export function getPlanetaryPositions(date: Date): PlanetaryPositions {
  const earthHelio = Astronomy.HelioVector(Astronomy.Body.Earth, date);
  const marsHelio  = Astronomy.HelioVector(Astronomy.Body.Mars, date);

  // GeoMoon returns geocentric equatorial J2000; Ecliptic() converts to ecliptic
  const moonEqu = Astronomy.GeoMoon(date);
  const moonEcl = Astronomy.Ecliptic(moonEqu); // .vec has ecliptic Cartesian in AU

  const earthPos = eclToThreeJs(earthHelio.x, earthHelio.y, earthHelio.z);
  // Moon: geocentric ecliptic offset added to Earth's heliocentric position
  const moonGeoOffset = eclToThreeJs(moonEcl.vec.x, moonEcl.vec.y, moonEcl.vec.z);

  return {
    sun:   new Vector3(0, 0, 0),
    earth: earthPos,
    mars:  eclToThreeJs(marsHelio.x, marsHelio.y, marsHelio.z),
    moon:  earthPos.clone().add(moonGeoOffset),
  };
}
