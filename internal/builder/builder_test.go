package builder_test

import (
	"math"
	"testing"
	"time"

	"github.com/Insulince/center-of-hash/internal/builder"
	"github.com/Insulince/center-of-hash/internal/ccaf"
)

func TestBuild_TwoCountries(t *testing.T) {
	date := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	shares := []ccaf.CountryShare{
		{Date: date, Country: "US", Share: 0.40},
		{Date: date, Country: "CN", Share: 0.20},
	}
	snaps := builder.Build(shares)
	if len(snaps) != 1 {
		t.Fatalf("want 1 snapshot, got %d", len(snaps))
	}
	snap := snaps[0]
	if !snap.Date.Equal(date) {
		t.Errorf("date: got %v, want %v", snap.Date, date)
	}
	if len(snap.Shares) != 2 {
		t.Errorf("want 2 country shares, got %d", len(snap.Shares))
	}
	// Centroid must be inside Earth (magnitude < Earth radius)
	const R = 6_371_000.0
	mag := math.Sqrt(snap.Centroid.X*snap.Centroid.X + snap.Centroid.Y*snap.Centroid.Y + snap.Centroid.Z*snap.Centroid.Z)
	if mag >= R {
		t.Errorf("centroid magnitude should be < Earth radius, got %.2f m", mag)
	}
}

func TestBuild_UnknownCountryDropped(t *testing.T) {
	date := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	shares := []ccaf.CountryShare{
		{Date: date, Country: "US", Share: 0.60},
		{Date: date, Country: "ZZ", Share: 0.40}, // unknown — should be dropped
	}
	snaps := builder.Build(shares)
	if len(snaps) != 1 {
		t.Fatalf("want 1 snapshot, got %d", len(snaps))
	}
	if len(snaps[0].Shares) != 1 {
		t.Errorf("want 1 share after dropping unknown, got %d", len(snaps[0].Shares))
	}
	if snaps[0].Shares[0].Country != "US" {
		t.Errorf("want US, got %s", snaps[0].Shares[0].Country)
	}
}

func TestBuild_MultipleMonthsSorted(t *testing.T) {
	jan := time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC) // mid-month — should normalize to Jan 1
	feb := time.Date(2024, 2, 1, 0, 0, 0, 0, time.UTC)
	shares := []ccaf.CountryShare{
		{Date: feb, Country: "US", Share: 0.50},
		{Date: jan, Country: "US", Share: 0.50},
	}
	snaps := builder.Build(shares)
	if len(snaps) != 2 {
		t.Fatalf("want 2 snapshots, got %d", len(snaps))
	}
	if !snaps[0].Date.Before(snaps[1].Date) {
		t.Error("snapshots should be sorted chronologically")
	}
}

func TestBuild_Empty(t *testing.T) {
	snaps := builder.Build(nil)
	if len(snaps) != 0 {
		t.Errorf("want 0 snapshots for nil input, got %d", len(snaps))
	}
}
