package centroid

import "math"

const earthRadiusM = 6_371_000.0

// Miner is a point in ECEF space with a fractional hashrate weight.
type Miner struct {
	X, Y, Z float64
	Weight  float64
}

// LatLonToECEF converts decimal degrees to Earth-Centered Earth-Fixed meters.
// Treats Earth as a sphere of radius 6,371,000 m.
func LatLonToECEF(latDeg, lonDeg float64) (x, y, z float64) {
	lat := latDeg * math.Pi / 180
	lon := lonDeg * math.Pi / 180
	x = earthRadiusM * math.Cos(lat) * math.Cos(lon)
	y = earthRadiusM * math.Cos(lat) * math.Sin(lon)
	z = earthRadiusM * math.Sin(lat)
	return
}

// WeightedCentroid returns the hashrate-weighted centroid in ECEF meters.
// Weights must sum to 1; callers are responsible for normalization.
// Returns ok=false if miners is empty — (0,0,0) is a valid ECEF point
// (Earth's center) so a zero return is otherwise ambiguous.
func WeightedCentroid(miners []Miner) (x, y, z float64, ok bool) {
	if len(miners) == 0 {
		return
	}
	for _, m := range miners {
		x += m.Weight * m.X
		y += m.Weight * m.Y
		z += m.Weight * m.Z
	}
	return x, y, z, true
}
