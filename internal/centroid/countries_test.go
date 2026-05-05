package centroid_test

import (
	"testing"

	"github.com/Insulince/center-of-hash/internal/centroid"
)

func TestCountryLookup_US_Alpha2(t *testing.T) {
	lat, lon, ok := centroid.CountryLatLon("US")
	if !ok {
		t.Fatal("US (alpha-2) not found in lookup table")
	}
	if lat < 24 || lat > 50 || lon < -130 || lon > -65 {
		t.Errorf("US centroid out of expected range: (%.2f, %.2f)", lat, lon)
	}
}

func TestCountryLookup_CN_Alpha2(t *testing.T) {
	lat, lon, ok := centroid.CountryLatLon("CN")
	if !ok {
		t.Fatal("CN (alpha-2) not found in lookup table")
	}
	// China centroid should be in Asia
	if lat < 20 || lat > 55 || lon < 70 || lon > 140 {
		t.Errorf("CN centroid out of expected range: (%.2f, %.2f)", lat, lon)
	}
}

func TestCountryLookup_Unknown(t *testing.T) {
	_, _, ok := centroid.CountryLatLon("ZZ")
	if ok {
		t.Error("expected not found for unknown country code")
	}
}

func TestCountryLookup_NullCode(t *testing.T) {
	_, _, ok := centroid.CountryLatLon("")
	if ok {
		t.Error("expected not found for empty string code")
	}
}
