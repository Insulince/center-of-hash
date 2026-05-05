package centroid_test

import (
	"math"
	"testing"

	"github.com/Insulince/center-of-hash/internal/centroid"
)

func TestLatLonToECEF(t *testing.T) {
	x, y, z := centroid.LatLonToECEF(0, 0)
	if math.Abs(x-6371000) > 1 {
		t.Errorf("x: got %.2f, want 6371000", x)
	}
	if math.Abs(y) > 1 {
		t.Errorf("y: got %.2f, want 0", y)
	}
	if math.Abs(z) > 1 {
		t.Errorf("z: got %.2f, want 0", z)
	}
}

func TestLatLonToECEFNorthPole(t *testing.T) {
	x, y, z := centroid.LatLonToECEF(90, 0)
	if math.Abs(x) > 1 {
		t.Errorf("x: got %.2f, want 0", x)
	}
	if math.Abs(y) > 1 {
		t.Errorf("y: got %.2f, want 0", y)
	}
	if math.Abs(z-6371000) > 1 {
		t.Errorf("z: got %.2f, want 6371000", z)
	}
}

func TestWeightedCentroid_TwoMiner(t *testing.T) {
	// Dhruv's two-miner example: A has 2x hashrate of B.
	// A at (0°,0°) → ECEF (6371000, 0, 0)
	// B at (0°,90°) → ECEF (0, 6371000, 0)
	// Center of hash at weights 2/3 and 1/3:
	//   x = 2/3 * 6371000 + 1/3 * 0       = 4247333.33
	//   y = 2/3 * 0       + 1/3 * 6371000 = 2123666.67
	//   z = 0
	const wantX = 4_247_333.33
	const wantY = 2_123_666.67

	ax, ay, az := centroid.LatLonToECEF(0, 0)
	bx, by, bz := centroid.LatLonToECEF(0, 90)

	miners := []centroid.Miner{
		{X: ax, Y: ay, Z: az, Weight: 2.0 / 3},
		{X: bx, Y: by, Z: bz, Weight: 1.0 / 3},
	}
	cx, cy, cz, ok := centroid.WeightedCentroid(miners)
	if !ok {
		t.Fatal("expected ok=true for non-empty miners")
	}

	tol := 1.0
	if math.Abs(cx-wantX) > tol {
		t.Errorf("x: got %.2f, want %.2f", cx, wantX)
	}
	if math.Abs(cy-wantY) > tol {
		t.Errorf("y: got %.2f, want %.2f", cy, wantY)
	}
	if math.Abs(cz) > tol {
		t.Errorf("z: got %.2f, want 0", cz)
	}
}

func TestWeightedCentroid_Uniform(t *testing.T) {
	ax, ay, az := centroid.LatLonToECEF(0, 0)
	bx, by, bz := centroid.LatLonToECEF(0, 180)

	miners := []centroid.Miner{
		{X: ax, Y: ay, Z: az, Weight: 0.5},
		{X: bx, Y: by, Z: bz, Weight: 0.5},
	}
	cx, cy, cz, ok := centroid.WeightedCentroid(miners)
	if !ok {
		t.Fatal("expected ok=true for non-empty miners")
	}

	tol := 1.0
	if math.Abs(cx) > tol || math.Abs(cy) > tol || math.Abs(cz) > tol {
		t.Errorf("centroid: got (%.2f, %.2f, %.2f), want near (0,0,0)", cx, cy, cz)
	}
}

func TestWeightedCentroid_Empty(t *testing.T) {
	_, _, _, ok := centroid.WeightedCentroid(nil)
	if ok {
		t.Error("expected ok=false for nil miners")
	}
	_, _, _, ok = centroid.WeightedCentroid([]centroid.Miner{})
	if ok {
		t.Error("expected ok=false for empty miners")
	}
}
