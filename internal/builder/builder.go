package builder

import (
	"sort"
	"time"

	"github.com/Insulince/center-of-hash/internal/ccaf"
	"github.com/Insulince/center-of-hash/internal/centroid"
	"github.com/Insulince/center-of-hash/internal/store"
)

// Build groups ccaf output by month, resolves country centroids,
// renormalizes weights, and computes the weighted centroid for each snapshot.
// Countries not found in the lookup table are dropped silently.
func Build(shares []ccaf.CountryShare) []store.Snapshot {
	byDate := map[time.Time][]ccaf.CountryShare{}
	for _, s := range shares {
		key := time.Date(s.Date.Year(), s.Date.Month(), 1, 0, 0, 0, 0, time.UTC)
		byDate[key] = append(byDate[key], s)
	}

	var snapshots []store.Snapshot
	for date, monthShares := range byDate {
		type entry struct {
			country string
			share   float64
			x, y, z float64
		}
		var valid []entry
		totalShare := 0.0
		for _, s := range monthShares {
			lat, lon, ok := centroid.CountryLatLon(s.Country)
			if !ok {
				continue
			}
			x, y, z := centroid.LatLonToECEF(lat, lon)
			valid = append(valid, entry{s.Country, s.Share, x, y, z})
			totalShare += s.Share
		}
		if len(valid) == 0 || totalShare == 0 {
			continue
		}

		miners := make([]centroid.Miner, len(valid))
		storeShares := make([]store.CountryShare, len(valid))
		for i, e := range valid {
			w := e.share / totalShare
			miners[i] = centroid.Miner{X: e.x, Y: e.y, Z: e.z, Weight: w}
			// Store normalized fraction (0–1) so the API and frontend agree on units.
			storeShares[i] = store.CountryShare{Country: e.country, Share: w}
		}

		cx, cy, cz, ok := centroid.WeightedCentroid(miners)
		if !ok {
			continue
		}
		snapshots = append(snapshots, store.Snapshot{
			Date:     date,
			Shares:   storeShares,
			Centroid: store.Centroid{X: cx, Y: cy, Z: cz},
		})
	}

	sort.Slice(snapshots, func(i, j int) bool {
		return snapshots[i].Date.Before(snapshots[j].Date)
	})
	return snapshots
}
