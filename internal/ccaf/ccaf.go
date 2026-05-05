package ccaf

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"time"
)

//go:embed ccaf.json
var embeddedData []byte

// CountryShare is one country's hashrate share for one month.
type CountryShare struct {
	Date    time.Time
	Country string  // ISO 3166-1 alpha-2
	Share   float64 // percentage, 0–100
}

// Fetch parses the embedded CCAF mining-map snapshot.
// To update the data, replace internal/ccaf/ccaf.json and redeploy.
func Fetch() ([]CountryShare, error) {
	var payload struct {
		Data []struct {
			Code *string `json:"code"` // nullable
			X    int64   `json:"x"`    // Unix milliseconds
			Y    float64 `json:"y"`    // percentage 0–100
		} `json:"data"`
	}
	if err := json.Unmarshal(embeddedData, &payload); err != nil {
		return nil, fmt.Errorf("decode ccaf data: %w", err)
	}

	results := make([]CountryShare, 0, len(payload.Data))
	for _, row := range payload.Data {
		if row.Code == nil {
			continue // drop "Other" entries — no ISO code to geolocate
		}
		results = append(results, CountryShare{
			Date:    time.UnixMilli(row.X).UTC(),
			Country: *row.Code,
			Share:   row.Y,
		})
	}
	return results, nil
}
